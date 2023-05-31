import { Team } from '@/types/types';

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
  numWebsitePagesPerProject: number;
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
      'Unlimited documents',
      'Unlimited BYO* completions',
      '25 GPT-4 completions',
      '50 indexed website pages per project',
      'Public/private GitHub repos',
    ],
    notes: ['* BYO: Bring-your-own API key'],
    prices: [
      {
        name: 'Free',
        quota: 25,
        numWebsitePagesPerProject: 50,
      },
    ],
  },
  starter: {
    name: 'Starter',
    description: 'For small projects',
    items: [
      '500 GPT-4 completions',
      '100 indexed website pages per project',
      'Usage analytics',
    ],
    prices: [
      {
        name: 'Starter',
        quota: 500,
        numWebsitePagesPerProject: 100,
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
      'Prompt templates',
      'Model customization',
      '1000 GPT-4 completions',
      '200 indexed website pages per project',
      'Advanced analytics',
    ],
    prices: [
      {
        name: 'Pro',
        quota: 1000,
        numWebsitePagesPerProject: 200,
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
        numWebsitePagesPerProject: -1,
      },
    ],
  },
};

const maxAllowanceForEnterprise = 1_000_000;
const quotaForLegacyPriceId = TIERS.pro.prices[0].quota;
const legacyNumWebsitePagesPerProject =
  TIERS.pro.prices[0].numWebsitePagesPerProject;

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

export const isAtLeastPro = (team: Team): boolean => {
  return team.is_enterprise_plan || !!team.stripe_price_id;
};

export const getNumWebsitePagesPerProjectAllowance = (
  team: Team,
): number | 'unlimited' => {
  if (team.is_enterprise_plan) {
    return 'unlimited';
  } else if (team.stripe_price_id) {
    const priceDetails = getTierPriceDetailsFromPriceId(team.stripe_price_id);
    if (priceDetails) {
      return priceDetails.numWebsitePagesPerProject;
    }
    return legacyNumWebsitePagesPerProject;
  } else {
    return TIERS.hobby.prices[0].numWebsitePagesPerProject;
  }
};

export const canRemoveBranding = (team: Team) => {
  return team.is_enterprise_plan;
};

export const canConfigureModel = (team: Team) => {
  return isAtLeastPro(team);
};
