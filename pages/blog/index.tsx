import dayjs from 'dayjs';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import Link from 'next/link';
import { FC } from 'react';
import Balancer from 'react-wrap-balancer';

import { AuthorList, CloudinaryImage } from '@/components/layouts/BlogLayout';
import LandingNavbar from '@/components/layouts/LandingNavbar';
import { SharedHead } from '@/components/pages/SharedHead';
import { Pattern } from '@/components/ui/Pattern';
import { getPageMetadataStaticProps } from '@/lib/pages';

const pageIds = JSON.parse(process.env.MOTIF_BLOG_PAGE_IDS!);

export const getStaticProps: GetStaticProps = async () => {
  return getPageMetadataStaticProps(pageIds as { [key: string]: string });
};

const BlogIndexPage: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  metadata,
}) => {
  const firstEntry = metadata[0];
  const otherEntries = metadata.slice(1);

  if (!firstEntry) {
    return <></>;
  }

  return (
    <>
      <SharedHead
        title="Markprompt Blog"
        coverUrl="https://markprompt.com/static/cover-blog.png"
      />
      <div className="relative mx-auto min-h-screen w-full">
        <Pattern />
        <div className="fixed top-0 left-0 right-0 z-30 h-24 bg-black/30 backdrop-blur">
          <div className="mx-auto max-w-screen-xl px-6 sm:px-8">
            <LandingNavbar noAnimation />
          </div>
        </div>
        <div className="relative mx-auto min-h-screen w-full max-w-screen-xl px-6 pt-28 pb-24 sm:px-8">
          <Link href={`/blog/${firstEntry.path}`}>
            <div className="prose prose-invert grid w-full max-w-full grid-cols-1 gap-8 sm:grid-cols-5">
              <div className="col-span-3">
                <CloudinaryImage
                  src={firstEntry.frontmatter.cover}
                  alt={firstEntry.frontmatter.title || 'Cover image'}
                  className="h-[440px] w-full rounded-lg border border-neutral-900 object-cover"
                />
              </div>
              <div className="prose prose-invert col-span-2 flex flex-col pt-12 sm:prose-lg">
                <h2 className="mb-4">
                  <Balancer>{firstEntry.frontmatter.title}</Balancer>
                </h2>
                <div className="flex flex-row items-center gap-4">
                  {firstEntry.frontmatter.authors && (
                    <AuthorList
                      authors={firstEntry.frontmatter.authors}
                      highlight
                      size="sm"
                    />
                  )}
                  <p className="mt-4 text-sm font-normal text-neutral-500 antialiased">
                    {dayjs(firstEntry.frontmatter.date).format('LL')}
                  </p>
                </div>

                <p className="mt-4 text-base font-normal text-neutral-500 antialiased">
                  {firstEntry.frontmatter.description}
                </p>

                <p className="mt-4 text-sm font-normal text-neutral-400 antialiased">
                  Read the post →
                </p>
              </div>
            </div>
          </Link>
          <div className="mt-4 grid w-full max-w-full grid-cols-1 gap-8 sm:grid-cols-3">
            {otherEntries.map((entry: any, i: number) => {
              return (
                <Link key={`blog-${i}`} href={`/blog/${entry.path}`}>
                  <div className="flex flex-col gap-4">
                    <CloudinaryImage
                      src={entry.frontmatter.cover}
                      alt={entry.frontmatter.title || 'Cover image'}
                      className="h-48 w-full rounded-lg border border-neutral-900 object-cover"
                    />
                    <h3 className="text-lg font-bold">
                      {entry.frontmatter.title}
                    </h3>
                    <div>
                      {entry.frontmatter.authors && (
                        <AuthorList
                          authors={entry.frontmatter.authors}
                          highlight
                          size="sm"
                        />
                      )}
                    </div>
                    <p className="text-sm font-normal text-neutral-500 antialiased">
                      {dayjs(entry.frontmatter.date).format('LL')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          {/* <CoverBlogEntry metadata={metadata} /> */}
          {/* {metadata.map((metadata: any, i: number) => {
            if (i === 0) {
              return <CoverBlogEntry metadata={metadata} />
            }
            return (
              <div key={`blog-index-${i}`}>{metadata.frontmatter.title}</div>
            );
          })} */}
          <p className="pb-16 pt-16 text-center text-sm text-neutral-700 backdrop-blur transition hover:text-neutral-300">
            Powered by{' '}
            <a
              href="https://motif.land"
              className="subtle-underline"
              target="_blank"
              rel="noreferrer"
            >
              Motif
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default BlogIndexPage;
