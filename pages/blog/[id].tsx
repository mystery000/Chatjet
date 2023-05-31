import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { FC } from 'react';

import { BlogLayout } from '@/components/layouts/BlogLayout';
import { SharedHead } from '@/components/pages/SharedHead';
import { getMarkdocStaticProps } from '@/lib/pages';

const pageIds = JSON.parse(process.env.MOTIF_BLOG_PAGE_IDS!);

export const getStaticPaths = async () => {
  return {
    paths: Object.keys(pageIds).map((path) => ({ params: { id: path } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return getMarkdocStaticProps(pageIds[params!.id as string]);
};

const BlogPage: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  content,
  toc,
  frontmatter,
}) => {
  return (
    <>
      <SharedHead
        title={`${frontmatter.title} | Markprompt Blog`}
        description={frontmatter.description}
        coverUrl={
          frontmatter.cover || 'https://markprompt.com/static/cover.png'
        }
      />
      <BlogLayout
        content={JSON.parse(content)}
        toc={toc}
        frontmatter={frontmatter}
      />
    </>
  );
};

export default BlogPage;
