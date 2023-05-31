import Markdoc, { RenderableTreeNode } from '@markdoc/markdoc';
import {
  Combine,
  MessagesSquare,
  FileBarChart,
  Sliders,
  Unplug,
  Package,
  Key,
  ShieldCheck,
} from 'lucide-react';
import React, { FC } from 'react';

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

type ResourcesLayoutProps = {
  content: RenderableTreeNode;
  toc: TOC;
  frontmatter: any;
  format?: string;
};

const ResourcesProseContainer = ({
  frontmatter,
  content,
  print,
}: Pick<ResourcesLayoutProps, 'frontmatter' | 'content'> & {
  print?: boolean;
}) => {
  return (
    <ProseContainer print={!!print} width="lg">
      {frontmatter?.title && (
        <h1 className="mb-12 text-left text-3xl md:text-4xl">
          {frontmatter.title}
        </h1>
      )}
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
          IconCombine: () => (
            <Combine className="mt-8 block h-5 w-5 text-fuchsia-500" />
          ),
          IconMessagesSquare: () => (
            <MessagesSquare className="mt-8 block h-5 w-5 text-fuchsia-500" />
          ),
          IconFileBarChart: () => (
            <FileBarChart className="mt-8 block h-5 w-5 text-fuchsia-500" />
          ),
          IconSliders: () => (
            <Sliders className="mt-8 block h-5 w-5 text-fuchsia-500" />
          ),
          IconUnplug: () => (
            <Unplug className="mt-8 block h-5 w-5 text-fuchsia-500" />
          ),
          IconPackage: () => (
            <Package className="mt-8 block h-5 w-5 text-fuchsia-500" />
          ),
          IconKey: () => (
            <Key className="mt-8 block h-5 w-5 text-fuchsia-500" />
          ),
          IconShieldCheck: () => (
            <ShieldCheck className="mt-8 block h-5 w-5 text-fuchsia-500" />
          ),
        },
      })}
    </ProseContainer>
  );
};

export const ResourcesLayout: FC<ResourcesLayoutProps> = ({
  content,
  toc,
  frontmatter,
  format,
}: any) => {
  const { registerHeading, unregisterHeading } = useTableOfContents(toc);

  if (format === 'print') {
    return (
      <div className="relative mx-auto min-h-screen w-full bg-white">
        <MarkdocContext.Provider value={{ registerHeading, unregisterHeading }}>
          <div className="prose prose-invert relative mx-auto min-h-screen w-full max-w-screen-2xl px-6 pt-24 pb-24 sm:px-8">
            <div className="relative mx-auto w-full max-w-screen-lg overflow-hidden">
              <ResourcesProseContainer
                frontmatter={frontmatter}
                content={content}
                print
              />
            </div>
          </div>
        </MarkdocContext.Provider>
      </div>
    );
  }

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
          <div className="prose prose-invert relative mx-auto min-h-screen w-full max-w-screen-2xl px-6 pt-40 pb-24 sm:px-8">
            <div className="relative mx-auto w-full max-w-screen-md overflow-hidden">
              <ResourcesProseContainer
                frontmatter={frontmatter}
                content={content}
              />
            </div>
          </div>
        </MarkdocContext.Provider>
      </div>
    </>
  );
};
