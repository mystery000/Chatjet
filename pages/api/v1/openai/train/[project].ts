import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import type { NextApiRequest, NextApiResponse } from 'next';
import pLimit from 'p-limit';
import { isPresent } from 'ts-is-present';

import {
  EmbeddingsError,
  generateFileEmbeddings,
} from '@/lib/generate-embeddings';
import {
  checkEmbeddingsRateLimits,
  getEmbeddingsRateLimitResponse,
} from '@/lib/rate-limits';
import {
  getChecksums,
  getOrCreateSource,
  getProjectConfigData,
  getProjectTeam,
  refreshMaterializedViews,
} from '@/lib/supabase';
import {
  createChecksum,
  getNameFromPath,
  pluralize,
  shouldIncludeFileWithPath,
} from '@/lib/utils';
import { getBufferFromReadable } from '@/lib/utils.node';
import { Database } from '@/types/supabase';
import {
  API_ERROR_CODE_CONTENT_TOKEN_QUOTA_EXCEEDED,
  API_ERROR_ID_CONTENT_TOKEN_QUOTA_EXCEEDED,
  ApiError,
  FileData,
  Project,
} from '@/types/types';

type Data = {
  status?: string;
  message?: string;
  error?: string;
  name?: string;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const ACCEPTED_CONTENT_TYPES = [
  'application/json',
  'application/octet-stream',
  'application/zip',
];

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

const allowedMethods = ['POST'];

const generateResponseMessage = (
  errors: EmbeddingsError[],
  numFilesSuccess: number,
) => {
  const successMessage = `Successfully trained ${pluralize(
    numFilesSuccess,
    'file',
    'files',
  )}.`;

  let message = '';
  if (errors.length > 0) {
    if (numFilesSuccess > 0) {
      message = successMessage;
    }
    message += `\nEncountered ${pluralize(
      errors.length,
      'error',
      'errors',
    )}:\n${errors.map((e) => `* In '${e.path}': ${e.message}`).join('\n')}`;
  } else {
    message = successMessage;
  }
  return message;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const projectId = req.query.project as Project['id'];

  if (!projectId) {
    return res.status(401).json({ error: 'Invalid project id' });
  }

  // Apply rate limits before hitting the database
  const rateLimitResult = await checkEmbeddingsRateLimits({
    type: 'projectId',
    value: projectId,
  });

  res.setHeader('X-RateLimit-Limit', rateLimitResult.result.limit);
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.result.remaining);

  if (!rateLimitResult.result.success) {
    return res.status(429).json({
      status: getEmbeddingsRateLimitResponse(
        rateLimitResult.hours,
        rateLimitResult.minutes,
      ),
    });
  }

  let filesWithPath: FileData[] = [];

  const buffer = await getBufferFromReadable(req);
  const contentType = req.headers['content-type'];

  if (!contentType || !ACCEPTED_CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({
      status: `Please specify a content type. Currently supported values are: ${ACCEPTED_CONTENT_TYPES.join(
        ', ',
      )}.`,
    });
  }

  const team = await getProjectTeam(supabaseAdmin, projectId);

  if (!team) {
    return res.status(400).json({
      status: 'Team not found.',
    });
  }

  const { byoOpenAIKey, markpromptConfig } = await getProjectConfigData(
    supabaseAdmin,
    projectId,
  );

  if (
    contentType === 'application/zip' ||
    contentType === 'application/octet-stream'
  ) {
    // A zip file is uploaded
    try {
      const zip = await JSZip.loadAsync(buffer);
      filesWithPath = (
        await Promise.all(
          Object.keys(zip.files).map(async (k) => {
            if (
              !shouldIncludeFileWithPath(
                k,
                markpromptConfig.include || [],
                markpromptConfig.exclude || [],
                false,
              )
            ) {
              return undefined;
            }
            try {
              const content = await zip.files[k].async('string');
              const path = k.startsWith('/') ? k : '/' + k;
              return { path, name: getNameFromPath(k), content };
            } catch (e) {
              console.error('Error extracting file:', e);
              return undefined;
            }
          }),
        )
      ).filter(isPresent);
    } catch (e) {
      console.error('Error loading zip:', e);
      return res.status(400).json({ status: `Invalid data: ${e}` });
    }
  } else if (contentType === 'application/json') {
    // Try if this is a raw JSON payload
    try {
      const rawBody = buffer.toString('utf8');
      const body = JSON.parse(rawBody);
      if (body?.files && Array.isArray(body.files)) {
        // v1
        filesWithPath = body.files
          .map((f: any) => {
            const path = f.path || f.id; // f.id for backwards compatibility

            if (
              typeof path !== 'string' ||
              typeof f.content !== 'string' ||
              !path ||
              !f.content
            ) {
              return undefined;
            }

            if (
              !shouldIncludeFileWithPath(
                path,
                markpromptConfig.include || [],
                markpromptConfig.exclude || [],
                false,
              )
            ) {
              return undefined;
            }

            return {
              path,
              name: getNameFromPath(path),
              content: f.content,
            };
          })
          .filter(isPresent);
      } else {
        // v0
        filesWithPath = Object.keys(body)
          .map((path) => {
            if (
              !shouldIncludeFileWithPath(
                path,
                markpromptConfig.include || [],
                markpromptConfig.exclude || [],
                false,
              )
            ) {
              return undefined;
            }
            return {
              path,
              name: getNameFromPath(path),
              content: body[path],
            };
          })
          .filter(isPresent);
      }
    } catch (e) {
      console.error('Error extracting payload', e);
      return res.status(400).json({ status: `Invalid data: ${e}` });
    }
  }

  const sourceId = await getOrCreateSource(
    supabaseAdmin,
    projectId,
    'api-upload',
    undefined,
  );
  const checksums = await getChecksums(supabaseAdmin, sourceId);

  let numFilesSuccess = 0;
  let allFileErrors: EmbeddingsError[] = [];

  const forceRetrain = req.headers['x-markprompt-force-retrain'] === 'true';

  const _processFile = async (file: FileData) => {
    // Check the checksum, and skip if equals
    const contentChecksum = createChecksum(file.content);

    const existingChecksum = checksums.find(
      (c) => c.path === file.path,
    )?.checksum;

    if (
      !forceRetrain &&
      existingChecksum &&
      existingChecksum === contentChecksum
    ) {
      numFilesSuccess++;
      return;
    }

    const errors = await generateFileEmbeddings(
      supabaseAdmin,
      projectId,
      sourceId,
      file,
      byoOpenAIKey,
      markpromptConfig,
    );

    if (errors && errors.length > 0) {
      allFileErrors = [...allFileErrors, ...errors];
    } else {
      numFilesSuccess++;
    }

    if (
      allFileErrors.some(
        (e) => e.id === API_ERROR_ID_CONTENT_TOKEN_QUOTA_EXCEEDED,
      )
    ) {
      // In case of a quota exceeded error, throw so as to stop
      // further processing
      throw new ApiError(API_ERROR_CODE_CONTENT_TOKEN_QUOTA_EXCEEDED);
    }
  };

  try {
    // TODO: Since we are parallelizing the processing, we cannot check reliably
    // inside each _processFile call whether we have reached the token limit
    // for training. Therefore, we make a rough estimate here, and only
    // send the set of files that fit within the threshold.

    // TODO: check how much we can do concurrently without hitting
    // rate limitations.
    const limit = pLimit(5);

    await Promise.all(
      filesWithPath.map((fileWithPath) => {
        return limit(() => _processFile(fileWithPath));
      }),
    );
  } catch (e) {
    if (
      e instanceof ApiError &&
      e.code === API_ERROR_CODE_CONTENT_TOKEN_QUOTA_EXCEEDED
    ) {
      // If this is a quota exceeded error, return immediately, and with an
      // error code. Also return the cumulative "success" message, and make
      // sure to update the materialized views.
      const message = generateResponseMessage(allFileErrors, numFilesSuccess);

      await refreshMaterializedViews(supabaseAdmin, [
        'mv_file_section_search_infos',
      ]);

      return res.status(403).json({
        error: message,
        name: API_ERROR_ID_CONTENT_TOKEN_QUOTA_EXCEEDED,
      });
    }
  }

  await refreshMaterializedViews(supabaseAdmin, [
    'mv_file_section_search_infos',
  ]);

  const message = generateResponseMessage(allFileErrors, numFilesSuccess);

  res.status(200).json({
    status: 'ok',
    message,
  });
}
