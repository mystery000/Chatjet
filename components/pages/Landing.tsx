// import * as Slider from '@radix-ui/react-slider';
import { Application } from '@splinetool/runtime';
import cn from 'classnames';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import Balancer from 'react-wrap-balancer';
import Slider, { Settings } from 'react-slick';
import { AngeListIcon } from '@/components/icons/AngelList';
import { CalIcon } from '@/components/icons/Cal';
import { GitHubIcon } from '../icons/GitHub';
import { MarkpromptIcon } from '@/components/icons/Markprompt';
import { MotifIcon } from '@/components/icons/Motif';
import { ReploIcon } from '@/components/icons/Replo';
import { TwitterIcon } from '@/components/icons/Twitter';
import LandingNavbar from '@/components/layouts/LandingNavbar';
import { Blurs } from '@/components/ui/Blurs';
import Button from '@/components/ui/Button';
import { Pattern } from '@/components/ui/Pattern';
import emitter, { EVENT_OPEN_CONTACT } from '@/lib/events';
import { PricedModel, TierDetails, TIERS } from '@/lib/stripe/tiers';

import StepsSection from './sections/Steps';
import VideoSection from './sections/Video';
import { SharedHead } from './SharedHead';
import { AnalyticsExample } from '../examples/analytics';
import { DiscordIcon } from '../icons/Discord';
import { ListItem } from '../ui/ListItem';
import { Segment } from '../ui/Segment';
import { Tag } from '../ui/Tag';
import Image from 'next/image';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { CheckCircle } from 'lucide-react';
import AppFooter from '../layouts/AppFooter';

const logos = [
  <DiscordIcon className="h-20 w-20" />,
  <TwitterIcon className="h-20 w-20" />,
  <CalIcon className="h-20 w-20" />,
  <GitHubIcon className="h-20 w-20" />,
];

const PricingTiers = [
  {
    name: 'Personal',
    price: '$5',
    duration: 'p/month',
    items: ['1 projects', 'Analytics', 'Insights Panel', 'Share Features'],
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$10',
    duration: 'p/month',
    items: ['2 projects', 'Analytics', 'Insights Panel', 'Share Features'],
    highlight: true,
  },
  {
    name: 'Business',
    price: '$50',
    duration: 'p/month',
    highlight: false,
    items: [
      'Unlimited projects',
      'Analytics',
      'Insights Panel',
      'Share Features',
    ],
  },
];

const testimonials = [
  {
    image:
      'https://framerusercontent.com/images/KAOATpHBGtqCGW7RMDMWbKZYBQ.png',
    link: '/',
    description: 'We helped Greon increase their MRR 24x in three months.',
    tag: 'Web Redesign',
  },
  {
    image:
      'https://framerusercontent.com/images/NSLwmpWswPFqJ2DWd08WvmUIYE.png',
    link: '/',
    description:
      'How Ascend Increased Their Sales by 300% Without Large Social Following.',
    tag: 'Web Redesign',
  },
];

const PricingCard = ({
  tier,
  model,
  highlight,
  cta,
  ctaHref,
  onCtaClick,
  customPrice,
  pricingInfo,
}: {
  tier?: TierDetails;
  model?: PricedModel;
  highlight?: boolean;
  cta?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  customPrice?: string;
  pricingInfo: {
    name: string;
    price: string;
    items: string[];
    duration: string;
    highlight: boolean;
  };
}) => {
  const [priceStep, setPriceStep] = useState(0);
  const [showAnnual, setShowAnnual] = useState(true);
  // const hasMonthlyOption =
  //   tier.prices && tier.prices?.some((p) => p.price?.monthly);
  // // const quotas = tier.prices[priceStep].quota;
  // // const quotaModels = Object.keys(quotas) as PricedModel[];

  return (
    <div
      className={cn(
        `${
          pricingInfo.highlight ? 'bg-[rgb(157,241,91)]' : 'bg-transparent'
        } relative flex w-[20rem] flex-col rounded-[20px] p-8 text-[rgb(102,102,102)]`,
      )}
    >
      <span className="text-sm font-semibold">{pricingInfo.name}</span>
      <div className="mb-6 flex items-end gap-1">
        <span className="text-[3.4rem] font-bold text-[rgb(51,51,51)]">
          {pricingInfo.price}{' '}
        </span>
        <span className="-translate-y-5 text-sm font-medium">
          {pricingInfo.duration}
        </span>
      </div>
      <ul className="mb-10 flex  flex-col gap-3 text-sm font-semibold">
        {pricingInfo.items.map((item, i) => (
          <li className="flex items-center gap-2">
            <CheckCircle
              width={20}
              height={20}
              className={'text-[rgb(51,51,51)]'}
            />{' '}
            {item}
          </li>
        ))}
      </ul>
      <Link
        href={'/'}
        className={`w-fit rounded-lg bg-white p-3.5 py-2 text-sm font-semibold  ${
          pricingInfo.highlight
            ? 'bg-[#222] text-white'
            : 'bg-white text-[rgb(17,17,17)]'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
};

const TestimonialCard: React.FC<{
  testimonial: {
    image: string;
    description: string;
    tag: string;
    link: string;
  };
}> = ({ testimonial: { description, image, link, tag } }) => {
  return (
    <div className="flex h-fit w-full flex-col rounded-2xl bg-[rgb(23,24,26)]  max768:max-w-[min(35rem,90vw)]">
      <Image
        src={image}
        alt="Testimonial Image"
        className="w-full"
        width={250}
        height={250}
      />
      <div className="flex flex-col gap-6 py-7 px-8">
        <span className="text-2xl font-semibold text-[rgb(239,241,242)]">
          {description}
        </span>
        <span className="text-base font-normal text-[rgb(126,127,132)]">
          {tag}
        </span>
      </div>
    </div>
  );
};

type LandingPageProps = {
  stars: number;
};

const formatNumStars = (stars: number) => {
  if (stars > 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars;
};

const LandingPage: FC<LandingPageProps> = ({ stars }) => {
  const [model, setModel] = useState<PricedModel>('gpt-3.5-turbo');

  const [autoplaySpeed, setAutoplaySpeed] = useState(0);

  useEffect(() => {
    const canvas: any = document.getElementById('animation-canvas');
    if (canvas) {
      const app = new Application(canvas);
      app.load('https://prod.spline.design/JjuAUS8iM07Bemju/scene.splinecode');
    }
  }, []);

  const settings: Settings = {
    dots: false,
    infinite: true,
    slidesToShow: logos.length - 1,
    slidesToScroll: logos.length - 1,
    autoplay: true,
    speed: 8000,
    autoplaySpeed: 8000,
    waitForAnimate: false,
    cssEase: 'linear',
    arrows: false,
  };
  return (
    <>
      <SharedHead title="Markprompt | Enterprise-grade ChatGPT for your website and docs" />
      <div className="relative z-10 mx-auto max-w-screen-xl">
        {/* <Pattern /> By Krishna*/}
        <LandingNavbar />
        <div className="animate-slide-up">
          <div className="gap-6 pb-16 pt-20 max1200:pb-12">
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 2xl:mt-0 max1440:max-w-2xl">
              <h1 className="text-center text-4xl font-bold leading-[36px] tracking-tighter text-[rgb(239_241_242)] sm:text-[5.7rem] sm:leading-[5.95rem] max1440:text-[4rem] max1440:leading-[4.15rem] max980:text-[3.25rem] max980:leading-[3.4rem]">
                Build, Train and Deploy ChatGPT for websites
              </h1>
              <p className="z-20 mx-auto max-w-[41.5rem] justify-center whitespace-pre-wrap break-words text-center text-base text-[rgb(186_187_195)] sm:text-lg max1200:max-w-[88%] max980:max-w-[35rem]  max980:text-base max768:max-w-[32rem]">
                {/* <Balancer className=''> */}
                Connect any source of content, from public websites to private
                GitHub repos, configure the design and tone, and paste the code
                to your website. In minutes, you have a chatbot that answers all
                your customers' questions.
                {/* </Balancer> */}
              </p>
              <div className="flex flex-col items-center justify-center gap-4 pt-2">
                <button className="rounded-lg bg-[rgb(157_241_91)] px-7 py-[1.1rem] font-medium text-black  max1200:px-5 max1200:py-3">
                  Build Your Chatbot Now
                </button>
                <p className="text-[rgb(125,127,131)]">
                  No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-in mx-auto max-w-screen-xl rounded-t-3xl border border-[#272626]  border-b-transparent py-12 max1440:max-w-4xl max1200:max-w-[46rem] max980:max-w-[35rem] max768:max-w-[80%]">
        <Image
          src={
            'https://framerusercontent.com/images/8Qgbos0FKBX6cqSknqrvekMeTL8.png'
          }
          alt="Image"
          width={1800}
          height={1800}
          className="h-fit w-full object-cover outline"
        />
      </div>
      {/* AUTOPLAY SLIDER */}
      {/* <div className="h-32 !w-full pb-20">
        <Slider {...settings}>
          {logos.map((logo) => (
            <span>{logo}</span>
          ))}
        </Slider>
      </div> */}

      {/* Info Tabs */}
      <div className="mx-auto flex max-w-screen-xl flex-wrap justify-center gap-12 border-b border-[#141414] px-14 py-20">
        <div className="flex max-w-xs items-start gap-6 max768:flex-col max768:items-center">
          <div>
            <GitHubIcon className="h-9 w-9 translate-y-1 text-[rgb(157,241,91)]" />
          </div>
          <div className="flex flex-col gap-4 max768:items-center max768:text-center">
            <h3 className="text-xl font-semibold">Enter your data source</h3>
            <span className="text-base leading-6 text-[rgb(185_187_195)]">
              We will automatically fetch all the pages on your website and show
              them to you
            </span>
          </div>
        </div>
        <div className="flex max-w-xs items-start gap-6 max768:flex-col max768:items-center">
          <div>
            <GitHubIcon className="h-9 w-9 translate-y-1 text-[rgb(157,241,91)]" />
          </div>
          <div className="flex flex-col gap-4 max768:items-center max768:text-center">
            <h3 className="text-xl font-semibold">Start Training</h3>
            <span className="text-base leading-6 text-[rgb(185_187_195)]">
              Select the pages you want the chatbot to train on and click on
              Start Training.
            </span>
          </div>
        </div>
        <div className="flex max-w-xs items-start gap-6 max768:flex-col max768:items-center">
          <div>
            <GitHubIcon className="h-9 w-9 translate-y-1 text-[rgb(157,241,91)]" />
          </div>
          <div className="flex flex-col gap-4 max768:items-center max768:text-center">
            <h3 className="text-xl font-semibold">Your own AI chatbot</h3>
            <span className="text-base leading-6 text-[rgb(185_187_195)]">
              You now have your own chatbot that can answer anything related to
              your website content.
            </span>
          </div>
        </div>
      </div>
      {/* Natural Language Understanding */}
      <div className="mx-auto flex max-w-[75%]  items-center justify-between gap-12 py-36 max1200:max-w-full max1200:flex-col-reverse">
        <div className="flex w-[60%] flex-col justify-center gap-6  max1200:w-[min(90vw,34rem)] max1200:text-center">
          <h2 className="text-[3.5rem] font-semibold leading-[3.8rem]">
            Natural Language Understanding
          </h2>
          <span className="text-base leading-6 text-[rgb(186_187_195)]">
            Our chatbot understands and interprets user queries with remarkable
            accuracy. It comprehends the nuances of human language, ensuring
            smooth and effective communication.
          </span>
          <Link
            href={'/'}
            className="mt-4 text-base font-bold text-[rgb(157,241,91)]"
          >
            Start your free trial
          </Link>
        </div>
        <div className="flex w-1/2 justify-center max1200:w-full">
          <Image
            src={
              '	https://framerusercontent.com/images/BdZoXGrJGAZLrcsxVkLxOnqZMfw.png?scale-down-to=512'
            }
            alt="SS"
            width={300}
            height={300}
            className="h-[20rem] w-[22rem]"
          />
        </div>
      </div>
      {/* Contextual Responses*/}

      <div className="mx-auto flex max-w-[75%] items-center justify-center gap-6 py-36 pt-6 max1200:max-w-full max1200:flex-col max1200:items-center">
        <div className="flex w-[40%] justify-start max1200:w-full max1200:justify-center">
          <Image
            src={
              'https://framerusercontent.com/images/rWjrgizKO1VMiSq61WQoNReCIs.png'
            }
            alt="S2"
            width={300}
            height={300}
            className="h-[20rem] w-[22rem]"
          />
        </div>
        <div className="flex w-[45%] flex-col gap-6 max1200:w-[min(90vw,34rem)] max1200:items-center max1200:text-center">
          <h2 className="text-[3.5rem] font-semibold leading-[3.8rem]">
            Contextual Responses
          </h2>
          <span className="w-[85%] text-base leading-6 text-[rgb(186_187_195)]">
            With deep learning capabilities, our chatbot maintains context
            throughout conversations. It can remember past interactions and
            provide relevant and personalized responses, creating a seamless
            user experience.
          </span>
          <Link
            href={'/'}
            className="mt-4 text-base font-bold text-[rgb(157,241,91)]"
          >
            Start your free trial
          </Link>
        </div>
      </div>
      {/* Easy Deployment*/}
      <div className="mx-auto flex max-w-[75%] items-center justify-center gap-6 py-36 pt-6 max1200:max-w-full max1200:flex-col-reverse max1200:items-center">
        <div className="flex w-[40%] flex-col justify-center gap-6 max1200:w-[min(90vw,34rem)] max1200:items-center max1200:text-center">
          <h2 className="text-[3.5rem] font-semibold leading-[3.8rem]">
            Easy Deployment
          </h2>
          <span className="text-base leading-6 text-[rgb(186_187_195)]">
            When it comes to adding our chatbot to your website, all you need to
            do is copy and paste the provided code.
          </span>
          <Link
            href={'/'}
            className="mt-4 text-base font-bold text-[rgb(157,241,91)]"
          >
            Start your free trial
          </Link>
        </div>
        <div className="flex w-1/2 justify-center  max1200:w-full max1200:justify-center">
          <Image
            src={
              '	https://framerusercontent.com/images/BdZoXGrJGAZLrcsxVkLxOnqZMfw.png?scale-down-to=512'
            }
            alt="SS"
            width={300}
            height={300}
            className="h-[20rem] w-[22rem]"
          />
        </div>
      </div>
      {/* Pricing Section */}
      <div className="mx-auto flex max-w-screen-xl items-center justify-center gap-6 py-36 pt-6 max1200:flex-col">
        {PricingTiers.map((pricing, i) => (
          <PricingCard pricingInfo={pricing} key={i} />
        ))}
      </div>
      {/* <VideoSection /> */}
      {/* <StepsSection /> */}
      <div className="mx-auto flex max-w-[75%] flex-col gap-28 rounded-2xl border border-[#141414] p-11 max1200:max-w-[85%]">
        <h3 className="w-[90%] text-[3.5rem] font-semibold leading-[4.1rem] text-white max980:text-5xl max980:leading-[1.15] max768:text-center">
          Say goodbye to the hassle of managing multiple accounts across
          different financial institutions.
        </h3>
        <div className="flex flex-wrap justify-between gap-y-5 max768:justify-center">
          <div className="flex max-w-xs flex-col gap-4 max768:items-center">
            <span className="text-[3.5rem] font-semibold text-[rgb(157,241,91)]  max980:text-5xl max980:leading-[1.15]">
              2x
            </span>
            <span className="text-[rgb(186,187,195)] max768:text-center">
              A multiplier that suggests double the performance when compared
            </span>
          </div>
          <div className="flex max-w-xs flex-col gap-4 max768:items-center">
            <span className="text-[3.5rem] font-semibold text-[rgb(157,241,91)]  max980:text-5xl max980:leading-[1.15]">
              97.5%{' '}
            </span>
            <span className="text-[rgb(186,187,195)] max768:text-center">
              Use a percentage number to suggest the increase in performance to
              expect.{' '}
            </span>
          </div>
          <div className="flex max-w-xs flex-col gap-4 max768:items-center">
            <span className="text-[3.5rem] font-semibold text-[rgb(157,241,91)]  max980:text-5xl max980:leading-[1.15]">
              4.1M
            </span>
            <span className="text-[rgb(186,187,195)] max768:text-center">
              Use a percentage number to suggest the increase in performance to
              expect.{' '}
            </span>
          </div>
        </div>
      </div>
      {/* TESTIMONIALS */}

      <div className="mx-auto my-36 flex max-w-[min(75%,98vw)] gap-28 rounded-2xl py-12 max1200:flex-wrap">
        <div className="flex max-w-xs flex-col">
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[3.5rem] font-semibold leading-[3.8rem] text-[rgb(239,241,242)]">
              How we help others grow.
            </h3>
            <span className="mt-4 text-base leading-8 text-[rgb(186_187_195)]">
              Get great news and insight from our expert team.
            </span>
          </div>
          <Link
            className="mt-auto text-base font-semibold text-[rgb(157,241,91)]"
            href={'/'}
          >
            See all case studies
          </Link>
        </div>
        <div className="flex grow gap-10 max768:flex-col max768:items-center">
          {testimonials.map((testimonial, i) => (
            <TestimonialCard testimonial={testimonial} key={i} />
          ))}
        </div>
      </div>
      <AppFooter />
    </>
  );
};

export default LandingPage;

// const PricingCard = () => {};
