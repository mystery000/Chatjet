// Edge utilities. Cannot run Node APIs.

import { NextRequest } from 'next/server';

export const getAppHost = (subdomain?: string, forceProduction?: boolean) => {
  const isProd = forceProduction || process.env.NODE_ENV === 'production';
  const host = isProd ? process.env.NEXT_PUBLIC_APP_HOSTNAME : 'localhost:3000';
  return subdomain ? `${subdomain}.${host}` : host;
};

export const getAppOrigin = (subdomain?: string, forceProduction?: boolean) => {
  const host = getAppHost(subdomain, forceProduction);
  const isProd = forceProduction || process.env.NODE_ENV === 'production';
  const schema = isProd ? 'https://' : 'http://';
  return `${schema}${host}`;
};

export const isAppHost = (host: string) => {
  return host === getAppHost();
};

export const removeSchema = (origin: string) => {
  return origin.replace(/(^\w+:|^)\/\//, '');
};

export const safeParseInt = (value: any, defaultValue = 0) => {
  try {
    return parseInt(value);
  } catch {
    // Do nothing
  }
  return defaultValue;
};

export const isRequestFromMarkprompt = (origin: string | undefined | null) => {
  const requesterHost = origin && removeSchema(origin);
  return requesterHost === getAppHost();
};
