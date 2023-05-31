import { createHash } from 'crypto';

import slugify from '@sindresorhus/slugify';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import { ChevronsUp, Globe, Upload } from 'lucide-react';
import minimatch from 'minimatch';
import { customAlphabet } from 'nanoid';
import pako from 'pako';
import tailwindColors from 'tailwindcss/colors';
import type { Config } from 'unique-names-generator';
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import { GitHubIcon } from '@/components/icons/GitHub';
import { MotifIcon } from '@/components/icons/Motif';
import {
  DateCountHistogramEntry,
  FileType,
  GitHubSourceDataType,
  HistogramStat,
  LLMInfo,
  MotifSourceDataType,
  Source,
  SourceType,
  TimeInterval,
  WebsiteSourceDataType,
} from '@/types/types';

import { removeSchema } from './utils.edge';

const lookup = [
  { value: 1, symbol: '' },
  { value: 1e3, symbol: 'K' },
  { value: 1e6, symbol: 'M' },
  { value: 1e9, symbol: 'G' },
  { value: 1e12, symbol: 'T' },
  { value: 1e15, symbol: 'P' },
  { value: 1e18, symbol: 'E' },
];
const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;

export function formatNumber(num: number, digits?: number) {
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, '$1') + item.symbol
    : '0';
}

export const intervalData = {
  '1h': {
    milliseconds: 3600000,
    intervals: 60,
    numTicks: 6,
    coefficient: 60000,
    format: (e: number) =>
      new Date(e).toLocaleTimeString('en-us', {
        hour: 'numeric',
        minute: 'numeric',
      }),
  },
  '24h': {
    milliseconds: 86400000,
    intervals: 24,
    numTicks: 12,
    coefficient: 3600000,
    format: (e: number) =>
      new Date(e).toLocaleTimeString('en-us', {
        hour: 'numeric',
      }),
  },
  '7d': {
    milliseconds: 604800000,
    intervals: 7,
    numTicks: 7,
    coefficient: 86400000,
    format: (e: number) =>
      new Date(e).toLocaleDateString('en-us', {
        month: 'numeric',
        day: 'numeric',
      }),
  },
  '30d': {
    milliseconds: 2592000000,
    intervals: 30,
    numTicks: 8,
    coefficient: 86400000,
    format: (e: number) =>
      new Date(e).toLocaleDateString('en-us', {
        month: 'numeric',
        day: 'numeric',
      }),
  },
  '3m': {
    milliseconds: 7776000000,
    intervals: 12,
    numTicks: 12,
    coefficient: 604800000,
    format: (e: number) =>
      new Date(e).toLocaleDateString('en-us', {
        month: 'short',
        day: 'numeric',
      }),
  },
  '1y': {
    milliseconds: 31536000000,
    intervals: 12,
    numTicks: 12,
    coefficient: 2592000000,
    format: (e: number) =>
      new Date(e).toLocaleDateString('en-us', {
        month: 'short',
        day: 'numeric',
      }),
  },
};

export interface getTimeIntervalsOutputProps {
  startTimestamp: number;
  endTimestamp: number;
  timeIntervals: { start: number; end: number }[];
}

export const getTimeIntervals = (
  interval: TimeInterval,
): getTimeIntervalsOutputProps => {
  const { milliseconds, intervals, coefficient } = intervalData[interval];
  const endTimestamp = Math.ceil(Date.now() / coefficient) * coefficient;
  const startTimestamp = endTimestamp - milliseconds;
  const timeIntervals = Array.from({ length: intervals }, (_, i) => ({
    start: startTimestamp + i * coefficient,
    end: startTimestamp + (i + 1) * coefficient,
  }));
  return { startTimestamp, endTimestamp, timeIntervals };
};

const slugGeneratorConfig: Config = {
  dictionaries: [adjectives, animals, colors],
  separator: '-',
  length: 3,
};

export const generateRandomSlug = (): string => {
  return uniqueNamesGenerator(slugGeneratorConfig);
};

export const slugFromEmail = (email: string) => {
  return slugify(email.split('@')[0]);
};

export const slugFromName = (name: string) => {
  return slugify(name);
};

export const copyToClipboard = (text: string): void => {
  navigator?.clipboard && navigator.clipboard.writeText(text);
};

export const generateHint = (
  text: string,
  offsetStart = 2,
  offsetEnd = 4,
): string => {
  if (text.length <= offsetStart + offsetEnd) {
    return text;
  }
  return text.substring(0, offsetStart) + '...' + text.slice(-offsetEnd);
};

export const readTextFileAsync = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsText(file);
  });
};

export const timeout = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const compress = (plainString: string): Uint8Array => {
  return pako.deflate(plainString);
};

export const decompress = (compressedString: Buffer): string => {
  return pako.inflate(compressedString, { to: 'string' });
};

export const getFileExtension = (pathOrName: string): string | undefined => {
  return pathOrName.match(/\.(\w*)$/)?.[1];
};

export const getFileType = (name: string): FileType => {
  const extension = getFileExtension(name);
  switch (extension) {
    case 'mdoc':
      return 'mdoc';
    case 'mdx':
      return 'mdx';
    case 'md':
      return 'md';
    case 'html':
      return 'html';
    default:
      return 'txt';
  }
};

const SUPPORTED_EXTENSIONS = ['md', 'mdx', 'mdoc', 'txt', 'html', 'htm'];

export const isSupportedFileType = (pathOrName: string): boolean => {
  const extension = getFileExtension(pathOrName);
  if (!extension) {
    // If there is no extension, consider it as supported (e.g. a URL).
    return true;
  }
  return !!(extension && SUPPORTED_EXTENSIONS.includes(extension));
};

export const pluralize = (value: number, singular: string, plural: string) => {
  return `${value} ${value === 1 ? singular : plural}`;
};

interface SWRError extends Error {
  status: number;
}

export const fetcher = async <T = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(input, init);
  return getResponseOrThrow(res);
};

export const getResponseOrThrow = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const json = await res.json();
    if (json.error) {
      const error = new Error(json.error) as SWRError;
      error.status = res.status;
      throw error;
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
  return res.json();
};

export const showConfetti = () => {
  const end = Date.now() + 2 * 1000;
  const confettiColors = [
    tailwindColors.sky['700'],
    tailwindColors.fuchsia['700'],
  ];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 80,
      startVelocity: 50,
      origin: { x: 0 },
      colors: confettiColors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 80,
      startVelocity: 50,
      origin: { x: 1 },
      colors: confettiColors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

const formatNumberK = (n: number) => {
  if (n < 1e3) {
    return `${n}`;
  } else if (n < 1e6) {
    return `${Math.round(n / 1e3)}k`;
  } else if (n < 1e9) {
    return `${Math.round(n / 1e6)}M`;
  } else if (n < 1e12) {
    return `${Math.round(n / 1e9)}B`;
  }
  return n;
};

export const formatNumQueries = (quota: number) => {
  return quota === -1
    ? 'Unlimited queries'
    : `Up to ${formatNumberK(quota)} tokens`;
};

export const truncate = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  } else {
    return text;
  }
};

export const truncateMiddle = (
  text: string,
  offsetStart = 2,
  offsetEnd = 4,
  truncateText = '...',
): string => {
  if (text.length <= offsetStart + offsetEnd) {
    return text;
  }
  return text.substring(0, offsetStart) + truncateText + text.slice(-offsetEnd);
};

const numDays = 30;
const dayInMs = 1000 * 60 * 60 * 24;
const date = new Date(2023, 5, 20).getMilliseconds();
const datapoints = [
  102, 115, 106, 121, 165, 145, 136, 157, 187, 169, 175, 190, 187, 200, 202,
  182, 200, 223, 225, 216, 204, 210, 209, 221, 221, 226, 212, 226, 228, 235,
];

export const sampleVisitsData: HistogramStat[] = Array.from(
  Array(numDays).keys(),
).map((n) => ({
  start: date - (numDays - n) * dayInMs,
  end: date - (numDays - n + 1) * dayInMs,
  value: datapoints[n],
}));

export const sampleTokenCountData: DateCountHistogramEntry[] = [
  {
    date: dayjs().startOf('day').toISOString(),
    count: 1,
  },
  {
    date: dayjs().add(-1, 'days').startOf('day').toISOString(),
    count: 1,
  },
];

export const getAuthorizationToken = (header: string | undefined | null) => {
  return header?.replace('Bearer ', '').trim();
};

// Reference: https://stackoverflow.com/questions/10306690/what-is-a-regular-expression-which-will-match-a-valid-domain-name-without-a-subd
export const isValidDomain = (domain: string) => {
  return /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/.test(
    domain,
  );
};

// Reference: https://github.com/manishsaraan/email-validator/blob/master/index.js
export const isValidEmail = (email: string) => {
  const re =
    /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

  return re.test(email);
};

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const generateKey = customAlphabet(ALPHABET, 32);

export const generateShareKey = customAlphabet(ALPHABET, 8);

const PK_TEST_PREFIX = 'pk_test_';
const SK_TEST_PREFIX = 'sk_test_';

export const generatePKKey = () => {
  return PK_TEST_PREFIX + generateKey();
};

export const generateSKTestKey = () => {
  return SK_TEST_PREFIX + generateKey();
};

export const isSKTestKey = (key: string | null) => {
  return key?.startsWith(SK_TEST_PREFIX);
};

export const stringToLLMInfo = (param?: string): LLMInfo => {
  switch (param) {
    case 'gpt-4':
    case 'gpt-4-0314':
    case 'gpt-4-32k':
    case 'gpt-4-32k-0314':
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-0301':
      return {
        vendor: 'openai',
        model: { type: 'chat_completions', value: param },
      };
    case 'text-davinci-003':
    case 'text-davinci-002':
    case 'text-curie-001':
    case 'text-babbage-001':
    case 'text-ada-001':
    case 'davinci':
    case 'curie':
    case 'babbage':
    case 'ada':
      return {
        vendor: 'openai',
        model: { type: 'completions', value: param },
      };
    default:
      return {
        vendor: 'openai',
        model: { type: 'chat_completions', value: 'gpt-3.5-turbo' },
      };
  }
};

export const matchesGlobs = (path: string, globs: string[]) => {
  return globs.some((g) => minimatch(path, g));
};

export const shouldIncludeFileWithPath = (
  path: string,
  includeGlobs: string[],
  excludeGlobs: string[],
) => {
  if (
    path.startsWith('.') ||
    path.includes('/.') ||
    !isSupportedFileType(path)
  ) {
    // Exclude unsupported files and dotfiles
    return false;
  }

  if (matchesGlobs(path, includeGlobs)) {
    return !matchesGlobs(path, excludeGlobs);
  }

  return false;
};

export const getNameFromPath = (path: string) => {
  return path.split('/').slice(-1)[0];
};

export const createChecksum = (content: string) => {
  return createHash('sha256').update(content).digest('base64');
};

export const capitalize = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getMotifImageDimensionsFromUrl = (
  url: string,
): { width: number; height: number } | undefined => {
  // Extracts the image dimensions from a URL when uploaded via Motif,
  // which has the form:
  // https://res.cloudinary.com/xxx/image/upload/v111/i1600x1068-yyy.png
  const dimens = url
    .split('/')
    .slice(-1)[0]
    ?.split('-')[0]
    ?.replace(/^i/, '')
    .split('x');

  try {
    return { width: parseInt(dimens?.[0]), height: parseInt(dimens?.[1]) };
  } catch {
    return undefined;
  }
};

export const parseGitHubURL = (url: string) => {
  const match = url.match(
    /^https:\/\/github.com\/([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)/,
  );
  if (match && match.length > 2) {
    return { owner: match[1], repo: match[2] };
  }
  return undefined;
};

export const getGitHubOwnerRepoString = (url: string) => {
  const info = parseGitHubURL(url);
  if (!info?.owner && !info?.repo) {
    return undefined;
  }
  return `${info.owner}/${info.repo}`;
};

export const getLabelForSource = (source: Source) => {
  switch (source.type) {
    case 'github': {
      const data = source.data as GitHubSourceDataType;
      return getGitHubOwnerRepoString(data.url);
    }
    case 'motif': {
      const data = source.data as MotifSourceDataType;
      return data.projectDomain;
    }
    case 'website': {
      const data = source.data as WebsiteSourceDataType;
      return removeSchema(toNormalizedUrl(data.url));
    }
    case 'file-upload':
      return 'File uploads';
    case 'api-upload':
      return 'API uploads';
    default:
      return 'Unknown source';
  }
};

export const getFileNameForSourceAtPath = (source: Source, path: string) => {
  switch (source.type) {
    case 'website': {
      // Handles e.g. index.html when last path component is empty
      return getNameFromUrlOrPath(path);
    }
    default:
      return path.split('/').slice(-1)[0];
  }
};

export const getNameFromUrlOrPath = (url: string) => {
  // When processing a text file, the type of a file (md, mdoc, html, etc)
  // is determined by the file name, specifically by its extension. In
  // the case where we are parsing websites, the URL of the page might
  // not contain the HTML extension, we nevertheless consider it as an
  // HTML file.
  const baseName = url.split('/').slice(-1)[0];
  if (/\.html$/.test(baseName)) {
    return baseName;
  } else if (baseName.length > 0) {
    return `${baseName}.html`;
  } else {
    return 'index.html';
  }
};

export const toNormalizedOrigin = (
  url: string,
  useInsecureSchema?: boolean,
) => {
  if (/^https?:\/\/[a-zA-Z]+/.test(url)) {
    return `${getSchema(url)}://${getUrlHostname(url)}`;
  }
  return `http${useInsecureSchema ? '' : 's'}://${getUrlHostname(url)}`;
};

export const toNormalizedUrl = (url: string, useInsecureSchema?: boolean) => {
  // Add schema, remove trailing slashes and query params.
  // Check if the URL already contains a schema
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // If not, add "https://" or "http://" to the beginning of the URL
    url = (useInsecureSchema ? 'http://' : 'https://') + url;
  }

  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`;
  } catch {
    // Do nothing, just return the URL as is.
    return url;
  }
};

export const getUrlHostname = (url: string) => {
  return removeSchema(url).split('/')[0];
};

export const getSchema = (hostname: string) => {
  return hostname.split('://')[0];
};

export const isUrl = (path: string) => {
  try {
    new URL(path);
    return true;
  } catch (err) {
    return false;
  }
};

export const getUrlPath = (url: string) => {
  const urlObj = new URL(url);
  return urlObj.pathname;
};

export const isHrefFromBaseUrl = (baseUrl: string, href: string) => {
  // Given a baseUrl, e.g. https://example.com/docs, determine whether
  // provided href has the same base. Some examples:
  // - https://acme.com is not
  // - https://example.com/docs/welcome is
  // - /blog is not
  // - /docs/welcome is
  if (/^https?:\/\/[a-zA-Z]+/.test(href)) {
    return toNormalizedUrl(href).startsWith(baseUrl);
  } else if (href.startsWith('/')) {
    // Links that don't include a full hostname are considered relative links
    // from the given host.
    const basePath = getUrlPath(baseUrl);
    return href.startsWith(basePath);
  } else if (!href.includes(':')) {
    // Relative paths should be considered valid, since they are
    // present in a page that has already been validated for processing,
    // so its full URL is already whitelisted, and adding a relative
    // path to its base path with not change this. We do exclude deep
    // links like "mailto:" and "tel:".
    return true;
  }
};

export const completeHrefWithBaseUrl = (baseUrl: string, href: string) => {
  if (href.startsWith('/')) {
    const origin = toNormalizedOrigin(baseUrl);
    return `${origin}${href}`;
  } else if (/^https?:\/\/[a-zA-Z]+/.test(href)) {
    return href;
  } else {
    return `${baseUrl}/${href}`;
  }
};

export const splitIntoSubstringsOfMaxLength = (
  line: string,
  maxLength: number,
) => {
  const words = line.split(' ');
  const result = [];
  let currentSubstring = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (currentSubstring.length + word.length <= maxLength) {
      currentSubstring += (currentSubstring.length > 0 ? ' ' : '') + word;
    } else {
      result.push(currentSubstring);
      currentSubstring = word;
    }
  }

  if (currentSubstring.length > 0) {
    result.push(currentSubstring);
  }

  return result;
};

export const getIconForSource = (sourceType: SourceType) => {
  switch (sourceType) {
    case 'motif':
      return MotifIcon;
    case 'website':
      return Globe;
    case 'file-upload':
      return Upload;
    case 'api-upload':
      return ChevronsUp;
    default:
      return GitHubIcon;
  }
};

export const removeFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return fileName;
  }
  return fileName.substring(0, lastDotIndex);
};

type RGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
};
export const hexToRgba = (hex: string): RGBA => {
  const hexValue = hex.replace('#', '');
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  let a = 1;
  if (hexValue.length === 8) {
    a = parseInt(hexValue.substring(6, 8), 16);
  }
  return { r, g, b, a };
};

export const rgbaToHex = ({ r, g, b, a }: RGBA) => {
  const _r = r.toString(16).padStart(2, '0');
  const _g = g.toString(16).padStart(2, '0');
  const _b = b.toString(16).padStart(2, '0');
  const _a = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');
  return '#' + _r + _g + _b + _a;
};

export const objectEquals = (object: any, otherObject: any) => {
  const keys = Object.keys(object);
  const otherKeys = Object.keys(otherObject);

  if (keys.length !== otherKeys.length) {
    return false;
  }

  for (const key of keys) {
    if (object[key] !== otherObject[key]) {
      return false;
    }
  }

  return true;
};
