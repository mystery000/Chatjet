import { parse, transform } from '@markdoc/markdoc';
import dayjs from 'dayjs';
import yaml from 'js-yaml';

import {
  buttonTag,
  collapseGroupTag,
  collapseTag,
  createTOC,
  fenceNode,
  headingNode,
  iconTags,
  imageNode,
  noteTag,
  playgroundTag,
  videoTag,
} from '@/components/layouts/MarkdocLayout';

import { DEFAULT_PROMPT_TEMPLATE } from './prompt';

export const getMarkdocStaticProps = async (pageId: string) => {
  const res = await fetch(`https://api.motif.land/v1/exports/raw/${pageId}`);
  const rawText = await res.text();
  const ast = parse(rawText);
  const config = {
    nodes: {
      fence: fenceNode,
      heading: headingNode,
      image: imageNode,
    },
    tags: {
      button: buttonTag,
      playground: playgroundTag,
      note: noteTag,
      collapsegroup: collapseGroupTag,
      collapse: collapseTag,
      video: videoTag,
      ...iconTags,
    },
    variables: {
      defaultPromptTemplate: DEFAULT_PROMPT_TEMPLATE.template,
    },
  };

  const frontmatter = ast.attributes.frontmatter
    ? yaml.load(ast.attributes.frontmatter)
    : {};

  const content = transform(ast, config);
  const toc = createTOC(content);

  return {
    props: { content: JSON.stringify(content), toc, frontmatter },
    revalidate: 60,
  };
};

const getPageFrontmatter = async (pageId: string) => {
  const res = await fetch(`https://api.motif.land/v1/exports/raw/${pageId}`);
  const rawText = await res.text();
  const ast = parse(rawText);
  return ast.attributes.frontmatter
    ? yaml.load(ast.attributes.frontmatter)
    : {};
};

export const getPageMetadataStaticProps = async (pageIds: {
  [key: string]: string;
}) => {
  const metadata: any = await Promise.all(
    Object.keys(pageIds).map(async (path) => {
      const frontmatter = await getPageFrontmatter(pageIds[path]);
      return { path, frontmatter };
    }),
  );

  const sortedMetadata = metadata.sort((entry1: any, entry2: any) => {
    if (!entry1.frontmatter?.date || !entry2.frontmatter?.date) {
      return 0;
    }
    const date1 = dayjs(entry1.frontmatter?.date).valueOf();
    const date2 = dayjs(entry2.frontmatter?.date).valueOf();
    return date1 > date2 ? -1 : 1;
  });

  return {
    props: {
      metadata: sortedMetadata,
    },
    revalidate: 60,
  };
};
