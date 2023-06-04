import { Team } from '@/types/types';

import { roundToLowerOrderDecimal } from '../utils';

type Price = {
  amount: number;
  priceIds: {
    test: string;
    production: string;
  };
};

export type Tier = 'hobby' | 'starter' | 'pro' | 'enterprise';

export type PricedModel = 'gpt-4' | 'gpt-3.5-turbo' | 'byo';

export const modelLabels: Record<PricedModel, string> = {
  'gpt-4': 'GPT-4',
  'gpt-3.5-turbo': 'Chat',
  byo: 'BYO',
};

const env =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 'production' : 'test';

export type TierPriceDetails = {
  name: string;
  quota: number;
  numTokensPerTeam: number;
  price?: {
    monthly?: Price;
    yearly: Price;
  };
};

export type TierDetails = {
  name: string;
  enterprise?: boolean;
  description: string;
  items: string[];
  notes?: string[];
  prices: TierPriceDetails[];
};

export const getTierPriceDetailsFromPriceId = (
  priceId: string,
): TierPriceDetails | undefined => {
  for (const tier of Object.values(TIERS)) {
    for (const price of tier.prices) {
      if (
        price?.price?.monthly?.priceIds[env] === priceId ||
        price?.price?.yearly?.priceIds[env] === priceId
      ) {
        return price;
      }
    }
  }
  return undefined;
};

export const getTierDetailsFromPriceId = (
  priceId: string,
): TierDetails | undefined => {
  for (const tierDetail of Object.values(TIERS)) {
    for (const price of tierDetail.prices) {
      if (
        price?.price?.monthly?.priceIds[env] === priceId ||
        price?.price?.yearly?.priceIds[env] === priceId
      ) {
        return tierDetail;
      }
    }
  }
  return undefined;
};

export const isYearlyPrice = (priceId: string) => {
  for (const tierDetail of Object.values(TIERS)) {
    for (const price of tierDetail.prices) {
      if (price?.price?.yearly?.priceIds[env] === priceId) {
        return true;
      }
    }
  }
  return false;
};

export const getTierFromPriceId = (priceId: string): Tier | undefined => {
  for (const tier of Object.keys(TIERS) as Tier[]) {
    for (const price of TIERS[tier].prices) {
      if (
        price?.price?.monthly?.priceIds[env] === priceId ||
        price?.price?.yearly?.priceIds[env] === priceId
      ) {
        return tier;
      }
    }
  }
  return undefined;
};

export const comparePlans = (
  priceId: string,
  otherPriceId: string,
): -1 | 0 | 1 => {
  if (priceId === otherPriceId) {
    return 0;
  }
  // We assume that the TIERS list is ordered from lower to higher.
  for (const tierDetail of Object.values(TIERS)) {
    for (const price of tierDetail.prices) {
      const monthlyPriceId = price?.price?.monthly?.priceIds[env];
      const yearlyPriceId = price?.price?.yearly?.priceIds[env];
      if (
        (monthlyPriceId === priceId && yearlyPriceId === otherPriceId) ||
        (monthlyPriceId === otherPriceId && yearlyPriceId === priceId)
      ) {
        // Consider equal if one is yearly and other is monthly of
        // the same plan.
        return 0;
      }
      if (monthlyPriceId === priceId || yearlyPriceId === priceId) {
        // priceId came first in list, so it's lower
        return -1;
      }
      if (monthlyPriceId === otherPriceId || yearlyPriceId === otherPriceId) {
        // otherPriceId came first in list, so it's lower
        return 1;
      }
    }
  }
  return 1;
};

export const TIERS: Record<Tier, TierDetails> = {
  hobby: {
    name: 'Hobby',
    description: 'For personal and non-commercial projects',
    items: [
      '25 indexed documents*',
      '25 GPT-4 completions per month',
      'Unlimited BYO* completions',
      'Public/private GitHub repos',
    ],
    notes: ['* Varies by document size', '* BYO: Bring-your-own API key'],
    prices: [
      {
        name: 'Free',
        quota: 25,
        numTokensPerTeam: 30_000,
      },
    ],
  },
  starter: {
    name: 'Starter',
    description: 'For small projects',
    items: [
      '100 indexed documents',
      '200 GPT-4 completions per month',
      'Usage analytics',
    ],
    prices: [
      {
        name: 'Starter',
        quota: 200,
        numTokensPerTeam: 120_000,
        price: {
          monthly: {
            amount: 25,
            priceIds: {
              test: 'price_1N8Wh6Cv3sM26vDeKjjg71C7',
              production: 'price_1N8WfxCv3sM26vDeN9BnA5D3',
            },
          },
          yearly: {
            amount: 20,
            priceIds: {
              test: 'price_1N8Wh6Cv3sM26vDeNTZ2D1K2',
              production: 'price_1N8WfxCv3sM26vDerkB8Tkmz',
            },
          },
        },
      },
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For production',
    items: [
      '500 indexed documents',
      '1000 GPT-4 completions per month',
      'Prompt templates',
      'Model customization',
      'Advanced analytics',
    ],
    prices: [
      {
        name: 'Pro',
        quota: 1000,
        numTokensPerTeam: 600_000,
        price: {
          monthly: {
            amount: 120,
            priceIds: {
              test: 'price_1N0TzLCv3sM26vDeQ7VxLKWP',
              production: 'price_1N0U0ICv3sM26vDes1KHwQ4y',
            },
          },
          yearly: {
            amount: 100,
            priceIds: {
              test: 'price_1N0TzLCv3sM26vDeIwhDValY',
              production: 'price_1N0U0ICv3sM26vDebBlSdU2k',
            },
          },
        },
      },
    ],
  },
  enterprise: {
    name: 'Enterprise',
    enterprise: true,
    description: 'For projects at scale',
    items: [
      'Teams',
      'Integrations',
      'Unbranded prompts',
      'Unlimited completions',
      'Dedicated support',
      'White glove onboarding',
      'Insights (soon)',
    ],
    prices: [
      {
        name: 'Enterprise',
        quota: -1,
        numTokensPerTeam: -1,
      },
    ],
  },
};

const maxAllowanceForEnterprise = 1_000_000;
const quotaForLegacyPriceId = TIERS.pro.prices[0].quota;

export const getMonthlyQueryAllowance = (team: Team) => {
  if (team.is_enterprise_plan) {
    return maxAllowanceForEnterprise;
  } else if (team.stripe_price_id) {
    const priceDetails = getTierPriceDetailsFromPriceId(team.stripe_price_id);
    if (priceDetails) {
      return priceDetails.quota;
    }
    return quotaForLegacyPriceId;
  } else {
    return TIERS.hobby.prices[0].quota;
  }
};

export const isAtLeastPro = (
  stripePriceId: string | null,
  isEnterprisePlan: boolean,
): boolean => {
  return !!(
    isEnterprisePlan ||
    (stripePriceId && getTierFromPriceId(stripePriceId) === 'pro')
  );
};

export type TokenAllowance = number | 'unlimited';

export const getNumTokensPerTeamAllowance = (
  isEnterprisePlan: boolean,
  stripePriceId: string | null | undefined,
): TokenAllowance => {
  if (isEnterprisePlan) {
    return 'unlimited';
  } else if (stripePriceId) {
    const priceDetails = getTierPriceDetailsFromPriceId(stripePriceId);
    if (priceDetails) {
      return priceDetails.numTokensPerTeam;
    }
    // Deprecated plans were similar to the current pro plan, so if a
    // user is on a deprecated plan, use the same allowance as the current
    // pro plan.
    return TIERS.pro.prices[0].numTokensPerTeam;
  } else {
    return TIERS.hobby.prices[0].numTokensPerTeam;
  }
};

export const getTeamTier = (team: Team): Tier => {
  if (team.is_enterprise_plan) {
    return 'enterprise';
  } else if (team.stripe_price_id) {
    const tier = getTierFromPriceId(team.stripe_price_id);
    if (tier) {
      return tier;
    }
  }
  return 'hobby';
};

export const tokensToApproxParagraphs = (numTokens: number): number => {
  return roundToLowerOrderDecimal(numTokens / 200);
};

export const canRemoveBranding = (team: Team) => {
  return team.is_enterprise_plan;
};

export const canEnableInstantSearch = (team: Team) => {
  return isAtLeastPro(team.stripe_price_id, !!team.is_enterprise_plan);
};

export const canConfigureModel = (team: Team) => {
  return isAtLeastPro(team.stripe_price_id, !!team.is_enterprise_plan);
};
