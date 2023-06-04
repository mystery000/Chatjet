// Browser-dependent utilities. Cannot run on edge runtimes.
import { Json } from '@/types/supabase';

import { DEFAULT_MARKPROMPT_CONFIG } from './constants';
import { MarkpromptConfig, parse } from './schema';

export const getMarkpromptConfigOrDefault = (
  markpromptConfig: Json | undefined,
): MarkpromptConfig => {
  return (markpromptConfig ||
    parse(DEFAULT_MARKPROMPT_CONFIG)) as MarkpromptConfig;
};
