import cn from 'classnames';
import createGlobe from 'cobe';
import { motion } from 'framer-motion';
import {
  Code,
  Globe,
  MessageCircle,
  MessagesSquare,
  Search,
  Settings2,
  Unplug,
  Upload,
} from 'lucide-react';
import { X } from 'lucide-react';
import Image from 'next/image';
import {
  JSXElementConstructor,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import Balancer from 'react-wrap-balancer';
import colors from 'tailwindcss/colors';

import { GitHubIcon } from '@/components/icons/GitHub';

const AnimatedGlobe = ({ className }: { className: string }) => {
  const canvasRef = useRef<any>();

  useEffect(() => {
    let phi = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 500 * 2,
      height: 500 * 2,
      phi: 2,
      theta: 0.4,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 251 / 255, 241 / 255],
      markers: [],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas className={className} ref={canvasRef} style={{ aspectRatio: 1 }} />
  );
};

const SourceIcon = ({
  Icon,
  id,
}: {
  Icon?: JSXElementConstructor<any>;
  id?: string;
}) => {
  return (
    <div className="z-20 rounded-full border border-dashed border-neutral-800 bg-neutral-1000 p-3 text-white">
      {Icon && <Icon className="h-5 w-5" />}
      {id && (
        <Image
          alt={id}
          width={20}
          height={20}
          className="h-5 w-5"
          src={`/static/icons/${id}.svg`}
        />
      )}
    </div>
  );
};

type StepProps = {
  title: string;
  description: string;
  Icon: JSXElementConstructor<any>;
  position: 'left' | 'middle' | 'right';
  children?: ReactNode;
};

const Step = ({ title, description, Icon, position, children }: StepProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-[400px] w-full flex-grow items-center justify-center">
        {children}
      </div>
      <div className="relative flex w-full flex-none flex-col">
        <div className="absolute inset-0 flex w-full items-center justify-center">
          <div
            className={cn('gridline gridline-horizontal h-1 w-full', {
              'gridline-fade-left': position === 'left',
              'gridline-fade-right': position === 'right',
            })}
          />
        </div>
        <div className="relative flex w-full items-center justify-center">
          <div className="relative z-20">
            <div className="glow-border glow-border-founded-full glow-border-white h-10 w-10 flex-none rounded-full bg-fuchsia-600 p-3 text-white">
              <Icon className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="relative mt-4 flex w-full flex-none flex-col items-center font-medium text-neutral-300">
          {title}
          <p className="mx-auto mt-2 h-20 max-w-xs text-center text-sm font-normal text-neutral-500">
            <Balancer ratio={0.5}>{description}</Balancer>
          </p>
        </div>
      </div>
    </div>
  );
};

export const Lines = ({
  width,
  height,
  radius,
  strokeWidth,
  highlightStrokeWidth,
  strokeDasharray,
}: {
  width: number;
  height: number;
  radius: number;
  strokeWidth: number;
  highlightStrokeWidth: number;
  strokeDasharray: number;
}) => {
  const topLinesHeight = Math.round(height / 3);
  const bottomLineHeight = height - topLinesHeight;
  const thirdWidth = Math.round(width / 3);
  const halfWidth = Math.round(width / 2);
  const sixthWidth = Math.round(width / 6);

  const path = `M1 0v${
    topLinesHeight - radius
  }a${radius} ${radius} 0 00${radius} ${radius}h${halfWidth - radius}M${
    width - 1
  } 0v${topLinesHeight - radius}a${radius} ${radius} 0 01-${radius} ${radius}H${
    halfWidth + 1
  }v${bottomLineHeight}m-${sixthWidth} -${height}v${topLinesHeight}m${thirdWidth} -${topLinesHeight}v${topLinesHeight}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} fill="none">
      <path
        d={path}
        stroke="#ffffff20"
        strokeDasharray={strokeDasharray}
        strokeWidth={strokeWidth}
      />
      <path
        d={path}
        stroke="url(#pulse)"
        strokeLinecap="round"
        strokeWidth={highlightStrokeWidth}
        strokeDasharray={strokeDasharray}
      />
      <defs>
        <motion.linearGradient
          animate={{
            x1: [0, 0],
            y1: [-2.5 * height, 2 * height],
            x2: [0, 0],
            y2: [-2 * height, 2.5 * height],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          id="pulse"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={colors.sky['500']} stopOpacity="0" />
          <stop stopColor={colors.sky['500']} stopOpacity="0.4" />
          <stop offset="1" stopColor={colors.sky['500']} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
};

export const LaunchLine = ({
  height,
  strokeWidth,
  highlightStrokeWidth,
  strokeDasharray,
}: {
  height: number;
  strokeWidth: number;
  highlightStrokeWidth: number;
  strokeDasharray: string;
}) => {
  const path = `M1 0v${height}`;

  return (
    <svg viewBox={`0 0 2 ${height / 2}`} fill="none">
      <path
        d={path}
        stroke="#ffffff20"
        strokeDasharray={strokeDasharray}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={path}
        stroke="url(#pulse1)"
        strokeDasharray={strokeDasharray}
        strokeWidth={highlightStrokeWidth}
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          animate={{
            x1: [0, 0],
            y1: [1.2 * height, -1 * height],
            x2: [0, 0],
            y2: [1 * height, -1.2 * height],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          id="pulse1"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={colors.fuchsia['500']} stopOpacity="0" />
          <stop stopColor={colors.fuchsia['500']} stopOpacity="0.7" />
          <stop offset="1" stopColor={colors.fuchsia['500']} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
};

const StepsSection = () => {
  const sourcesContainerRef = useRef<HTMLDivElement>(null);
  const [sourcesContainerDimensions, setSourcesContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (!sourcesContainerRef.current) {
        return;
      }

      const sourcesContainerRect =
        sourcesContainerRef.current?.getBoundingClientRect();

      const width = sourcesContainerRect?.width || 0;
      const height = sourcesContainerRect?.height || 0;

      setSourcesContainerDimensions({
        width,
        height,
      });
    });

    sourcesContainerRef.current &&
      observer.observe(sourcesContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative z-0 mx-auto max-w-screen-xl px-6 sm:px-8">
      <h2 className="gradient-heading mt-16 text-center text-4xl sm:mt-40">
        <Balancer>Go live in minutes, no setup required</Balancer>
      </h2>
      <div className="grid grid-cols-1 items-center justify-center gap-12 sm:mt-16 sm:gap-0 md:grid-cols-3">
        <Step
          title="Connect multiple sources"
          description="Sync a website, a GitHub repo, a Gitbook docs site, a Zendesk knowledge base. Drag and drop files. Or upload via API."
          Icon={Unplug}
          position="left"
        >
          <div className="max-auto flex h-full flex-col items-end justify-end">
            <div className="relative flex h-min w-full">
              <div className="absolute inset-x-0 top-0 z-10 h-[100px] bg-gradient-to-b from-neutral-1100 to-neutral-1100/0" />
              <div className="relative z-0 grid h-min w-full grid-cols-4 items-center justify-center gap-4">
                <SourceIcon id="motif" />
                <SourceIcon id="substack" />
                <SourceIcon id="medium" />
                <SourceIcon id="wordpress" />
                <SourceIcon id="gitbook" />
                <SourceIcon id="readme" />
                <SourceIcon id="docusaurus" />
                <SourceIcon id="markdown" />
                <SourceIcon Icon={Globe} />
                <SourceIcon Icon={GitHubIcon} />
                <SourceIcon id="zendesk" />
                <SourceIcon Icon={Upload} />
              </div>
            </div>
            <div className="h-[150px] w-full px-5">
              <div ref={sourcesContainerRef}>
                <Lines
                  width={sourcesContainerDimensions.width}
                  height={150}
                  radius={5}
                  strokeWidth={1}
                  highlightStrokeWidth={2}
                  strokeDasharray={2}
                />
              </div>
            </div>
          </div>
        </Step>
        <Step
          title="Configure to your needs"
          description="Fine-tune prompt and model parameters to match your tone, language and use case. Customize the UI to match your brand."
          Icon={Settings2}
          position="middle"
        >
          <div className="relative h-full w-full">
            <div className="skewed-sheet group absolute inset-x-12 inset-y-0 mt-12 flex transform flex-col items-end justify-start gap-4 transition duration-300">
              <div className="animate-bounce-subtle relative h-[70%] w-full rounded-2xl border border-dashed border-neutral-700 bg-neutral-1000/20">
                <div className="absolute inset-0 z-30 flex transform flex-col rounded-md border-neutral-900 bg-white opacity-100 transition duration-300 group-hover:opacity-0">
                  <div className="relative h-[38px] flex-none items-center gap-2 border-b border-neutral-200 py-2 px-12 text-sm text-neutral-400">
                    <Search className="absolute left-3 top-3 h-[14px] w-[14px] text-neutral-400" />
                    <p className="absolute inset-x-10 top-2.5 text-xs">
                      How can we help?
                    </p>
                    <X className="absolute top-3 right-3 h-[14px] w-[14px] text-neutral-400" />
                  </div>
                  <div className="flex flex-grow flex-col items-start gap-1 px-3 py-3">
                    <div className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-600">
                      What is the pricing plan?
                    </div>
                    <div className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-600">
                      How do I add a team member?
                    </div>
                    <div className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-600">
                      Are you SOC2 compliant?
                    </div>
                  </div>
                  <div className="relative h-[1px] flex-none overflow-hidden">
                    <div
                      className={`animate-progress absolute left-0 top-0 h-[1px]`}
                      style={{
                        backgroundImage: `linear-gradient(to right,${colors.rose['600']},${colors.purple['600']})`,
                      }}
                    />
                  </div>
                  <div className="flex flex-none flex-row items-center gap-2 border-t border-neutral-200 px-2 py-2">
                    <div className="rounded border border-indigo-100 px-2 py-1 text-xs font-medium text-indigo-600">
                      Pricing
                    </div>
                    <div className="rounded border border-indigo-100 px-2 py-1 text-xs font-medium text-indigo-600">
                      Security
                    </div>
                  </div>
                </div>
                <Search className="absolute top-4 left-6 h-4 w-4 text-neutral-700" />
                <X className="absolute top-4 right-6 h-4 w-4 text-neutral-700" />
                <p className="absolute left-12 top-[14px] text-sm text-neutral-700">
                  Ask me anything...
                </p>
                <div className="absolute inset-x-4 inset-y-0 z-10 border-l border-r border-dashed border-neutral-700" />
                <div className="absolute inset-x-0 top-0 h-12 border-b border-dashed border-neutral-700" />
                <div className="absolute inset-x-0 bottom-0 z-0 flex h-10 flex-row items-center gap-2 overflow-hidden border-t border-dashed border-neutral-700 px-6 text-xs text-neutral-700">
                  <div className="whitespace-nowrap rounded-md border border-dashed border-neutral-700 px-2 py-1">
                    Reference 1
                  </div>
                  <div className="whitespace-nowrap rounded-md border border-dashed border-neutral-700 px-2 py-1">
                    Reference 2
                  </div>
                </div>
                <div className="absolute inset-x-8 inset-y-16 flex animate-pulse flex-col gap-4">
                  <div className="h-2 w-4/5 rounded bg-neutral-800" />
                  <div className="h-2 w-2/3 rounded bg-neutral-800" />
                  <div className="h-2 w-1/3 rounded bg-neutral-800" />
                  <div className="h-2 w-1/2 rounded bg-neutral-800" />
                </div>
              </div>
              <div className="relative flex-none">
                <div className="absolute z-10 rounded-full border border-indigo-400 bg-indigo-500 p-3 opacity-100 transition duration-300 group-hover:opacity-0">
                  <MessagesSquare className="h-5 w-5 text-white" />
                </div>
                <div className="flex-none rounded-full border border-dashed border-neutral-700 p-3">
                  <MessageCircle className="h-5 w-5 text-neutral-700" />
                </div>
              </div>
            </div>
          </div>
        </Step>
        <Step
          title="Launch at all touch points"
          description="Paste a script tag to your website. Use a React component in your web application. Build custom logic with our streaming API endpoints."
          Icon={Code}
          position="right"
        >
          <div className="relative overflow-hidden">
            <div className="absolute top-0 z-20 h-[200px] w-full bg-gradient-to-b from-neutral-1100 to-neutral-1100/0" />
            <div className="absolute right-0 z-20 h-full w-[200px] bg-gradient-to-l from-neutral-1100 to-neutral-1100/0" />
            <AnimatedGlobe className="relative z-10 h-[400px] w-[400px]" />
            <div className="absolute left-[calc(50%-1px)] bottom-0 z-0 h-[100px] w-1">
              <LaunchLine
                height={100}
                strokeWidth={2}
                highlightStrokeWidth={2}
                strokeDasharray="2 4"
              />
            </div>
          </div>
        </Step>
      </div>
    </div>
  );
};

export default StepsSection;
