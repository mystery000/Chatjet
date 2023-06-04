import { Ratelimit } from '@upstash/ratelimit';

import { Project } from '@/types/types';

import { getRedisClient } from './redis';
import { pluralize } from './utils';

type RateLimitIdProjectIdType = { value: Project['id']; type: 'projectId' };
type RateLimitIdProjectKeyType = { value: string; type: 'projectKey' };
type RateLimitIdTokenType = { value: string; type: 'token' };
type RateLimitIdHostnameType = { value: string; type: 'hostname' };
type RateLimitIdIPType = { value: string; type: 'ip' };

type RateLimitIdType =
  | RateLimitIdProjectIdType
  | RateLimitIdProjectKeyType
  | RateLimitIdTokenType
  | RateLimitIdHostnameType
  | RateLimitIdIPType;

const rateLimitTypeToKey = (identifier: RateLimitIdType) => {
  return `${identifier.type}:${identifier.value}`;
};

const getResetTime = (result: {
  reset: number;
}): { hours: number; minutes: number } => {
  // Calcualte the remaining time until generations are reset
  const diff = Math.abs(
    new Date(result.reset).getTime() - new Date().getTime(),
  );
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor(diff / 1000 / 60) - hours * 60;

  return { hours, minutes };
};

export const checkEmbeddingsRateLimits = async (
  identifier: RateLimitIdType,
) => {
  // For now, impose a hard limit of 100 embeddings per minute
  // per project. Later, make this configurable.
  const ratelimit = new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.fixedWindow(100, '1 m'),
    analytics: true,
  });

  const result = await ratelimit.limit(rateLimitTypeToKey(identifier));

  return { result, ...getResetTime(result) };
};

type RateLimitUnit = 'ms' | 's' | 'm' | 'h' | 'd';
type RateLimitDuration =
  | `${number} ${RateLimitUnit}`
  | `${number}${RateLimitUnit}`;

const getRateLimit = async (
  key: string,
  tokens: number,
  window: RateLimitDuration,
) => {
  const ratelimit = new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.fixedWindow(tokens, window),
    analytics: true,
  });

  return ratelimit.limit(key);
};

export const getEmbeddingsRateLimitResponse = (
  hours: number,
  minutes: number,
) => {
  return `You have reached your training limit for the day. You can resume training in ${pluralize(
    hours,
    'hour',
    'hours',
  )} and ${pluralize(minutes, 'minute', 'minutes')}. Email ${
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'us'
  } if you have any questions.`;
};

export const checkCompletionsRateLimits = async (
  identifier: RateLimitIdType,
) => {
  // For now, impose a hard limit of 10 completions per minute
  // per hostname. Later, tie it to the plan associated to a team/project.
  const result = await getRateLimit(rateLimitTypeToKey(identifier), 10, '60 s');
  return { result, ...getResetTime(result) };
};

export const checkSectionsRateLimits = async (identifier: RateLimitIdType) => {
  // For now, impose a hard limit of 100 sections per minute
  // per project. Later, make this configurable.
  const result = await getRateLimit(rateLimitTypeToKey(identifier), 100, '1 m');
  return { result, ...getResetTime(result) };
};

export const checkSearchRateLimits = async (identifier: RateLimitIdType) => {
  // For now, impose a hard limit of 100 queries per second
  // per project. Later, make this configurable.
  const result = await getRateLimit(rateLimitTypeToKey(identifier), 100, '1 s');
  return { result, ...getResetTime(result) };
};

export const checkEmailRateLimits = async (ip: string) => {
  // Impose a hard limit of 100 emails per minute.
  const result = await getRateLimit(
    rateLimitTypeToKey({ value: ip, type: 'ip' }),
    100,
    '1 m',
  );
  return { result, ...getResetTime(result) };
};
