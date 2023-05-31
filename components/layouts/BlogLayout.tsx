import Markdoc, { RenderableTreeNode } from '@markdoc/markdoc';
import cn from 'classnames';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import Image from 'next/image';
import React, { FC, useMemo } from 'react';
import Balancer from 'react-wrap-balancer';

import { getMotifImageDimensionsFromUrl } from '@/lib/utils';

import { MarkdocContext } from './DocsLayout';
import LandingNavbar from './LandingNavbar';
import {
  DocsPlayground,
  Fence,
  MarkdocButton,
  ProseContainer,
  TOC,
  useTableOfContents,
} from './MarkdocLayout';
import { Collapse, CollapseGroup } from '../ui/Collapse';
import { ContentImage } from '../ui/ContentImage';
import { Heading } from '../ui/Heading';
import { Note } from '../ui/Note';
import { Pattern } from '../ui/Pattern';
import { Video } from '../ui/Video';

dayjs.extend(localizedFormat);

type BlogLayoutProps = {
  content: RenderableTreeNode;
  toc: TOC;
  frontmatter: any;
};

type CloudinaryImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export const CloudinaryImage: FC<CloudinaryImageProps> = ({
  src,
  alt,
  className,
}) => {
  const dimens = useMemo(() => {
    if (!src) {
      return undefined;
    }
    return getMotifImageDimensionsFromUrl(src);
  }, [src]);

  if (!dimens) {
    return <></>;
  }

  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      width={dimens.width}
      height={dimens.height}
    />
  );
};

export const AuthorList = ({
  authors,
  size,
  justify,
  highlight,
}: {
  authors: { name: string; avatar: string }[];
  size?: 'sm' | 'base';
  justify?: 'center';
  highlight?: boolean;
}) => {
  return (
    <div className="flex flex-row flex-wrap gap-4">
      {authors?.map((author: { name: string; avatar: string }) => {
        return (
          <div
            className={cn('not-prose flex flex-row items-center gap-2', {
              'justify-center': justify === 'center',
            })}
            key={author.name}
          >
            <CloudinaryImage
              src={author.avatar}
              alt={author.name || 'Avatar'}
              className="h-6 w-6 rounded-full object-cover"
            />
            <p
              className={cn(
                'flex justify-center whitespace-nowrap font-normal',
                {
                  'text-sm': size === 'sm',
                  'text-neutral-500': !highlight,
                  'text-neutral-300': highlight,
                },
              )}
            >
              {author?.name}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export const BlogLayout: FC<BlogLayoutProps> = ({
  content,
  toc,
  frontmatter,
}: any) => {
  const { registerHeading, unregisterHeading } = useTableOfContents(toc);

  return (
    <>
      <div className="relative mx-auto min-h-screen w-full">
        <Pattern />
        <MarkdocContext.Provider value={{ registerHeading, unregisterHeading }}>
          <div className="fixed top-0 left-0 right-0 z-30 h-24 bg-black/30 backdrop-blur">
            <div className="mx-auto max-w-screen-xl px-6 sm:px-8">
              <LandingNavbar noAnimation />
            </div>
          </div>
          <div className="prose prose-invert relative mx-auto min-h-screen w-full max-w-screen-xl px-6 pt-48 pb-24 sm:px-8">
            {frontmatter?.title && (
              <div className="flex justify-center">
                <h1 className="mb-4 text-center text-4xl md:text-5xl">
                  <Balancer>{frontmatter.title}</Balancer>
                </h1>
              </div>
            )}
            <div className="mt-4 mb-2 flex flex-row items-center  justify-center gap-4">
              {frontmatter?.authors && (
                <AuthorList authors={frontmatter.authors} justify="center" />
              )}
            </div>
            <div className="mb-8">
              <p className="mt-0 text-center text-neutral-500">
                {dayjs(frontmatter.date).format('LL')}
              </p>
            </div>
            {frontmatter?.cover && (
              <CloudinaryImage
                src={frontmatter.cover}
                alt={frontmatter.title || 'Cover image'}
                className="w-full rounded-lg border border-neutral-900"
              />
            )}
            <div className="relative mx-auto w-full max-w-screen-md overflow-hidden">
              <ProseContainer>
                {Markdoc.renderers.react(content, React, {
                  components: {
                    Button: MarkdocButton,
                    Collapse,
                    CollapseGroup,
                    ContentImage,
                    Fence,
                    Heading,
                    Note,
                    Playground: DocsPlayground,
                    Video,
                  },
                })}
              </ProseContainer>
            </div>
          </div>
        </MarkdocContext.Provider>
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
    </>
  );
};
