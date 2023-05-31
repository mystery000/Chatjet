import { Database } from './supabase';

export type TimeInterval = '1h' | '24h' | '7d' | '30d' | '3m' | '1y';
export type TimePeriod = 'hour' | 'day' | 'weekofyear' | 'month' | 'year';
export type HistogramStat = { start: number; end: number; value: number };
export type DateCountHistogramEntry = { date: string; count: number };
export type ProjectUsageHistogram = {
  projectId: Project['id'];
  histogram: DateCountHistogramEntry[];
};
export type FileStats = {
  numFiles: number;
};

export type OAuthProvider = 'github';

export type GitHubRepository = {
  name: string;
  owner: string;
  url: string;
};

export type LLMVendors = 'openai';

export type LLMInfo = {
  vendor: LLMVendors;
  model: OpenAIModelIdWithType;
};

export type OpenAIModelIdWithType =
  | { type: 'chat_completions'; value: OpenAIChatCompletionsModelId }
  | { type: 'completions'; value: OpenAICompletionsModelId }
  | { type: 'embeddings'; value: OpenAIEmbeddingsModelId };

export type OpenAIChatCompletionsModelId =
  | 'gpt-4'
  | 'gpt-4-0314'
  | 'gpt-4-32k'
  | 'gpt-4-32k-0314'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-0301';

export type OpenAICompletionsModelId =
  | 'text-davinci-003'
  | 'text-davinci-002'
  | 'text-curie-001'
  | 'text-babbage-001'
  | 'text-ada-001'
  | 'davinci'
  | 'curie'
  | 'babbage'
  | 'ada';

export type OpenAIEmbeddingsModelId = 'text-embedding-ada-002';

export type OpenAIModelId =
  | OpenAIChatCompletionsModelId
  | OpenAICompletionsModelId
  | OpenAIEmbeddingsModelId;

export const SUPPORTED_MODELS: {
  chat_completions: OpenAIChatCompletionsModelId[];
  completions: OpenAICompletionsModelId[];
  embeddings: OpenAIEmbeddingsModelId[];
} = {
  chat_completions: [
    'gpt-4',
    'gpt-4-0314',
    'gpt-4-32k',
    'gpt-4-32k-0314',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0301',
  ],
  completions: [
    'text-davinci-003',
    'text-davinci-002',
    'text-curie-001',
    'text-babbage-001',
    'text-ada-001',
    'davinci',
    'curie',
    'babbage',
    'ada',
  ],
  embeddings: ['text-embedding-ada-002'],
};

export const getModelIdWithVendorPrefix = (model: LLMInfo) => {
  return `${model.vendor}:${model.model.value}`;
};

export const geLLMInfoFromModel = (model: OpenAIModelIdWithType): LLMInfo => {
  // Only OpenAI models are supported currently
  return { vendor: 'openai', model };
};

export type ModelConfig = {
  model: OpenAIModelId;
  promptTemplate: string;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
  sectionsMatchCount: number;
  sectionsMatchThreshold: number;
};

export type DbUser = Database['public']['Tables']['users']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Token = Database['public']['Tables']['tokens']['Row'];
export type Domain = Database['public']['Tables']['domains']['Row'];
export type Membership = Database['public']['Tables']['memberships']['Row'];
export type MembershipType =
  Database['public']['Tables']['memberships']['Row']['type'];
export type Source = Database['public']['Tables']['sources']['Row'];
export type DbFile = Database['public']['Tables']['files']['Row'];
export type FileSections = Database['public']['Tables']['file_sections']['Row'];
export type OAuthToken =
  Database['public']['Tables']['user_access_tokens']['Row'];
export type PromptConfig =
  Database['public']['Tables']['prompt_configs']['Row'];

export type FileData = { path: string; name: string; content: string };
export type PathContentData = Pick<FileData, 'path' | 'content'>;
export type Checksum = Pick<DbFile, 'path' | 'checksum'>;
export type SourceType = Pick<Source, 'type'>['type'];

export type FileType = 'mdx' | 'mdoc' | 'md' | 'html' | 'txt';

export type ProjectUsage = number;
export type Usage = Record<Project['id'], ProjectUsage>;

export type GitHubSourceDataType = { url: string };
export type MotifSourceDataType = { projectDomain: string };
export type WebsiteSourceDataType = { url: string };

export type RobotsTxtInfo = { sitemap?: string; disallowedPaths: string[] };

export type ReferenceInfo = { name: string; href?: string };

export class ApiError extends Error {
  readonly code: number;

  constructor(code: number, message?: string | null) {
    super(message || 'API Error');
    this.code = code;
  }
}
