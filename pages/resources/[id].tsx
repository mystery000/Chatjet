import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { FC } from 'react';

import { ResourcesLayout } from '@/components/layouts/ResourcesLayout';
import { SharedHead } from '@/components/pages/SharedHead';
import { getMarkdocStaticProps } from '@/lib/pages';

let pageIds:any=[];
if(process.env.MOTIF_RESOURCES_PAGE_IDS !== "" && process.env.MOTIF_RESOURCES_PAGE_IDS) {
  pageIds = JSON.parse(process.env.MOTIF_RESOURCES_PAGE_IDS!);
} 
export const getStaticPaths = async () => {
  if(pageIds) {
    return {
      paths: Object.keys(pageIds).map((path) => ({ params: { id: path } })),
      fallback: false,
    };
  } else {
    return {
      paths: [],
      fallback: false,
    };  
  }
  
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return getMarkdocStaticProps(pageIds[params!.id as string]);
};

const ResourcesPage: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  content,
  toc,
  frontmatter,
}) => {
  const router = useRouter();

  return (
    <>
      <SharedHead
        title={`${
          frontmatter.shortTitle || frontmatter.title
        } | Markprompt Resources`}
        description={frontmatter.description}
        coverUrl={
          frontmatter.cover || 'https://markprompt.com/static/cover.png'
        }
      />
      <ResourcesLayout
        content={JSON.parse(content)}
        toc={toc}
        frontmatter={frontmatter}
        format={router.query.format as string}
      />
    </>
  );
};

export default ResourcesPage;
