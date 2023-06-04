import { createClient } from '@supabase/supabase-js';
import { stripIndent } from 'common-tags';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';
import type { NextRequest } from 'next/server';

import * as constants from '@/lib/constants';
import { I_DONT_KNOW, MAX_PROMPT_LENGTH } from '@/lib/constants';
import { track } from '@/lib/posthog';
import { DEFAULT_PROMPT_TEMPLATE } from '@/lib/prompt';
import { checkCompletionsRateLimits } from '@/lib/rate-limits';
import { FileSection, getMatchingSections, storePrompt } from '@/lib/sections';
import { getProjectConfigData, getTeamStripeInfo } from '@/lib/supabase';
import { recordProjectTokenCount } from '@/lib/tinybird';
import { stringToLLMInfo } from '@/lib/utils';
import { isRequestFromMarkprompt, safeParseInt } from '@/lib/utils.edge';
import { Database } from '@/types/supabase';
import {
  ApiError,
  DbFile,
  OpenAIModelIdWithType,
  Project,
} from '@/types/types';

export const config = {
  runtime: 'edge',
};

const isIDontKnowResponse = (
  responseText: string,
  iDontKnowMessage: string,
) => {
  return !responseText || responseText.endsWith(iDontKnowMessage);
};

const getPayload = (
  prompt: string,
  model: OpenAIModelIdWithType,
  temperature: number,
  topP: number,
  frequencyPenalty: number,
  presencePenalty: number,
  maxTokens: number,
  stream: boolean,
) => {
  const payload = {
    model: model.value,
    temperature,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    max_tokens: maxTokens,
    stream,
    n: 1,
  };
  switch (model.type) {
    case 'chat_completions': {
      return {
        ...payload,
        messages: [{ role: 'user', content: prompt }],
      };
    }
    default: {
      return { ...payload, prompt };
    }
  }
};

const getCompletionsUrl = (model: OpenAIModelIdWithType) => {
  switch (model.type) {
    case 'chat_completions': {
      return 'https://api.openai.com/v1/chat/completions';
    }
    default: {
      return 'https://api.openai.com/v1/completions';
    }
  }
};

const getChunkText = (response: any, model: OpenAIModelIdWithType) => {
  switch (model.type) {
    case 'chat_completions': {
      return response.choices[0].delta.content;
    }
    default: {
      return response.choices[0].text;
    }
  }
};

const getCompletionsResponseText = (
  response: any,
  model: OpenAIModelIdWithType,
) => {
  switch (model.type) {
    case 'chat_completions': {
      return response.choices[0].message.content;
    }
    default: {
      return response.choices[0].text;
    }
  }
};

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

const allowedMethods = ['POST'];

export default async function handler(req: NextRequest) {
  // Preflight check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  if (!req.method || !allowedMethods.includes(req.method)) {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  let params = await req.json();
  const modelInfo = stringToLLMInfo(params.model);
  const prompt = (params.prompt as string)?.substring(0, MAX_PROMPT_LENGTH);
  const iDontKnowMessage =
    (params.i_dont_know_message as string) || // v1
    (params.iDontKnowMessage as string) || // v0
    I_DONT_KNOW;
  let stream = true;
  if (params.stream === false) {
    stream = false;
  }

  const { pathname, searchParams } = new URL(req.url);

  const lastPathComponent = pathname.split('/').slice(-1)[0];
  let projectIdParam = undefined;
  // TODO: need to investigate the difference between a request
  // from the dashboard (2nd case here) and a request from
  // an external origin (1st case here).
  if (lastPathComponent === 'completions') {
    projectIdParam = searchParams.get('project');
  } else {
    projectIdParam = pathname.split('/').slice(-1)[0];
  }

  if (!projectIdParam) {
    console.error(`[COMPLETIONS] [${pathname}] Project not found`);
    return new Response('Project not found', { status: 400 });
  }

  if (!prompt) {
    console.error(`[COMPLETIONS] [${projectIdParam}] No prompt provided`);
    return new Response('No prompt provided', { status: 400 });
  }

  const projectId = projectIdParam as Project['id'];

  // Apply rate limits, in additional to middleware rate limits.
  const rateLimitResult = await checkCompletionsRateLimits({
    value: projectId,
    type: 'projectId',
  });

  if (!rateLimitResult.result.success) {
    console.error(`[COMPLETIONS] [RATE-LIMIT] [${projectId}] IP: ${req.ip}`);
    return new Response('Too many requests', { status: 429 });
  }

  if (!isRequestFromMarkprompt(req.headers.get('origin'))) {
    // Custom model configurations are part of the Pro and Enterprise plans
    // when used outside of the Markprompt dashboard.
    const teamStripeInfo = await getTeamStripeInfo(supabaseAdmin, projectId);
    if (!teamStripeInfo?.stripePriceId && !teamStripeInfo?.isEnterprisePlan) {
      // Custom model configurations are part of the Pro and Enterprise plans.
      params = {
        ...params,
        promptTemplate: undefined,
        temperature: undefined,
        topP: undefined,
        frequencyPenalty: undefined,
        presencePenalty: undefined,
        maxTokens: undefined,
        sectionsMatchCount: undefined,
        sectionsMatchThreshold: undefined,
      };
    }
  }

  const { byoOpenAIKey } = await getProjectConfigData(supabaseAdmin, projectId);

  const sanitizedQuery = prompt.trim().replaceAll('\n', ' ');

  let fileSections: FileSection[] = [];
  let promptEmbedding: number[] | undefined = undefined;
  try {
    const sectionsResponse = await getMatchingSections(
      sanitizedQuery,
      prompt,
      params.sectionsMatchThreshold,
      params.sectionsMatchCount,
      projectId,
      byoOpenAIKey,
      'completions',
      supabaseAdmin,
    );
    fileSections = sectionsResponse.fileSections;
    promptEmbedding = sectionsResponse.promptEmbedding;
  } catch (e) {
    if (e instanceof ApiError) {
      return new Response(e.message, { status: e.code });
    } else {
      return new Response(`${e}`, { status: 400 });
    }
  }

  track(projectId, 'generate completions', { projectId });

  // const { completionsTokensCount } = await getTokenCountsForProject(projectId);

  // const maxTokenLimit = 500000;
  // if (completionsTokensCount > maxTokenLimit) {
  //   return new Response('Completions token limit exceeded.', {
  //     status: 429,
  //   });
  // }

  const _prepareSectionText = (text: string) => {
    return text.replace(/\n/g, ' ').trim();
  };

  let numTokens = 0;
  let contextText = '';
  const references: DbFile['path'][] = [];
  for (const section of fileSections) {
    numTokens += section.token_count;

    if (numTokens >= constants.CONTEXT_TOKENS_CUTOFF) {
      break;
    }

    contextText += `Section id: ${section.path}\n\n${_prepareSectionText(
      section.content,
    )}\n---\n`;
    if (!references.includes(section.path)) {
      references.push(section.path);
    }
  }

  const fullPrompt = stripIndent(
    ((params.promptTemplate as string) || DEFAULT_PROMPT_TEMPLATE.template)
      .replace('{{I_DONT_KNOW}}', iDontKnowMessage || constants.I_DONT_KNOW)
      .replace('{{CONTEXT}}', contextText)
      .replace('{{PROMPT}}', sanitizedQuery),
  );

  const payload = getPayload(
    fullPrompt,
    modelInfo.model,
    params.temperature || 0.1,
    params.topP || 1,
    params.frequencyPenalty || 0,
    params.presencePenalty || 0,
    params.maxTokens || 500,
    stream,
  );
  const url = getCompletionsUrl(modelInfo.model);

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${
        (byoOpenAIKey || process.env.OPENAI_API_KEY) ?? ''
      }`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const debugInfo = params.includeDebugInfo ? { fullPrompt } : {};

  if (!stream) {
    if (!res.ok) {
      const message = await res.text();
      await storePrompt(
        supabaseAdmin,
        projectId,
        prompt,
        null,
        promptEmbedding,
        true,
      );
      return new Response(
        `Unable to retrieve completions response: ${message}`,
        { status: 400 },
      );
    } else {
      const json = await res.json();
      // TODO: track token count
      const tokenCount = safeParseInt(json.usage.total_tokens, 0);
      await recordProjectTokenCount(projectId, modelInfo, tokenCount);
      const text = getCompletionsResponseText(json, modelInfo.model);
      await storePrompt(
        supabaseAdmin,
        projectId,
        prompt,
        text,
        promptEmbedding,
        isIDontKnowResponse(text, iDontKnowMessage),
      );
      return new Response(JSON.stringify({ text, references, debugInfo }), {
        status: 200,
      });
    }
  }

  let counter = 0;

  // All the text associated with this query, to estimate token
  // count.
  let responseText = '';
  let didSendHeader = false;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === 'event') {
          const data = event.data;
          if (data === '[DONE]') {
            return;
          }

          try {
            if (!didSendHeader) {
              // Done sending chunks, send references
              const queue = encoder.encode(
                `${JSON.stringify(references || [])}${
                  constants.STREAM_SEPARATOR
                }`,
              );
              controller.enqueue(queue);
              didSendHeader = true;
            }
            const json = JSON.parse(data);
            const text = getChunkText(json, modelInfo.model);
            if (text?.length > 0) {
              responseText += text;
            }
            if (counter < 2 && (text?.match(/\n/) || []).length) {
              // Prefix character (e.g. "\n\n"), do nothing
              return;
            }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            controller.error(e);
          }
        }
      }

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }

      // Estimate the number of tokens used by this request.
      // TODO: GPT3Tokenizer is slow, especially on large text. Use the
      // approximated value instead (1 token ~= 4 characters).
      // const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });
      // const allTextEncoded = tokenizer.encode(allText);
      // const tokenCount = allTextEncoded.text.length;
      const allText = fullPrompt + responseText;
      const estimatedTokenCount = Math.round(allText.length / 4);

      if (!byoOpenAIKey) {
        await recordProjectTokenCount(
          projectId,
          modelInfo,
          estimatedTokenCount,
        );
      }

      await storePrompt(
        supabaseAdmin,
        projectId,
        prompt,
        responseText,
        promptEmbedding,
        isIDontKnowResponse(responseText, iDontKnowMessage),
      );

      // We're done, wind down
      parser.reset();
      controller.close();
    },
  });

  return new Response(readableStream);
}
