import { load } from 'cheerio';
import { isPresent } from 'ts-is-present';

import { RobotsTxtInfo } from '@/types/types';

export const isWebsiteAccessible = async (url: string) => {
  const res = await fetch('/api/integrations/website/is-accessible', {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return res.ok;
};

export const fetchRobotsTxtInfo = async (
  baseUrl: string,
): Promise<RobotsTxtInfo> => {
  const robotsTxt = await fetchPageContent(`${baseUrl}/robots.txt`);
  if (!robotsTxt) {
    return {
      disallowedPaths: [],
    };
  }

  const lines = robotsTxt.split('\n');
  let sitemap: string | undefined = undefined;
  const disallowedPaths: string[] = [];
  let isInStarUserAgentSection = false;

  for (const line of lines) {
    if (line.startsWith('Sitemap:')) {
      sitemap = line.replace(/^Sitemap:/, '').trim();
    }

    const normalizedLine = line.toLowerCase().trim();
    if (normalizedLine.startsWith('user-agent:')) {
      if (normalizedLine === 'user-agent: *') {
        isInStarUserAgentSection = true;
      } else {
        isInStarUserAgentSection = false;
      }
    }

    if (isInStarUserAgentSection) {
      if (normalizedLine.startsWith('disallow:')) {
        disallowedPaths.push(normalizedLine.split(':').slice(1).join(':'));
      }
    }
  }

  return {
    sitemap,
    disallowedPaths,
  };
};

export const fetchSitemapUrls = async (
  baseUrl: string,
  robotsTxtSitemap?: string,
): Promise<string[] | undefined> => {
  let sitemap: string | undefined = undefined;
  if (robotsTxtSitemap) {
    sitemap = await fetchPageContent(robotsTxtSitemap);
  }

  if (!sitemap) {
    sitemap = await fetchPageContent(`${baseUrl}/sitemap.xml`);
  }

  if (!sitemap) {
    return undefined;
  }

  const sitemapUrls: string[] = [];
  const $ = load(sitemap, { xmlMode: true });
  $('loc').each(function () {
    const url = $(this).text();

    if (!sitemapUrls.includes(url)) {
      sitemapUrls.push(url);
    }
  });

  return sitemapUrls;
};

export const fetchPageContent = async (
  url: string,
): Promise<string | undefined> => {
  const res = await fetch('/api/integrations/website/fetch-page', {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  if (res.ok) {
    return (await res.json()).content;
  }
  return undefined;
};

export const extractLinksFromHtml = (html: string) => {
  const $ = load(html);
  const hrefs: string[] = [];
  // Filter on href attribute rather than tag. Several other tags
  // than <a> support href attributes, such as <area>.
  $('*[href]')
    .each((i, link) => {
      const s = $(link).attr('href')?.toString();
      if (s) {
        hrefs.push(s);
      }
    })
    .filter(isPresent);
  return hrefs;
};
