import dayjs from 'dayjs';

import { DateCountHistogramEntry, LLMInfo, Project } from '@/types/types';

import { sampleTokenCountData } from './utils';

const recordEvent = async (name: string, payload: any) => {
  await fetch(
    `https://api.us-east.tinybird.co/v0/events?name=${name}&wait=true`,
    {
      method: 'POST',
      body: JSON.stringify({
        timestamp: new Date(Date.now()).toISOString(),
        ...payload,
      }),
      headers: {
        Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}`,
      },
    },
  );
};

export const recordProjectTokenCount = async (
  projectId: Project['id'],
  model: LLMInfo,
  count: number,
) => {
  return recordEvent('token_count', {
    projectId,
    count,
    vendor: model.vendor,
    model: model.model.value,
  });
};

export const getProjectCompletionsTokenCount = async (
  projectId: Project['id'],
  startDate: Date,
  endDate: Date,
): Promise<DateCountHistogramEntry[]> => {
  if (process.env.NODE_ENV === 'development') {
    // Tinybird quickly hits rate limits, use sample data in development.
    return sampleTokenCountData;
  }

  const response = await fetch(
    `https://api.us-east.tinybird.co/v0/pipes/project_completions_token_count.json?projectId=${projectId}&startDate=${dayjs(
      startDate,
    ).format('YYYY-MM-DD')}&endDate=${dayjs(endDate).format('YYYY-MM-DD')}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}`,
      },
    },
  )
    .then((r) => r.json())
    .then((r) => r);

  if (response.error) {
    return [];
  }

  return response.data?.map((d: any) => {
    return {
      date: dayjs(d['toStartOfDay(timestamp)']).toISOString(),
      count: d['count()'],
    } as DateCountHistogramEntry;
  });
};
