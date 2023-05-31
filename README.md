<a href="https://markprompt.com">
  <img alt="Markprompt – Enterprise-grade AI chatbots for your website and docs" src="https://github.com/motifland/markprompt-js/assets/504893/9df7ac5a-1ac3-4b33-9bb3-a146d119ed73">
  <h1 align="center">Markprompt</h1>
</a>

Markprompt is a platform for building GPT-powered prompts. It takes Markdown, Markdoc, MDX, HTML and plain text files (from a GitHub repo, website or file uploads), and creates embeddings that you can use to create a prompt, for instance using the companion [Markprompt React or Web component](https://markprompt.com/docs#components). Markprompt also offers analytics, so you can gain insights on how visitors interact with your docs.

<br />
<br />

<p align="center">
  <a href="https://twitter.com/markprompt">
    <img alt="Twitter" src="https://img.shields.io/twitter/follow/markprompt?style=flat&label=%40markprompt&logo=twitter&color=0bf&logoColor=fff" />
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/markprompt">
    <img alt="NPM version" src="https://badgen.net/npm/v/markprompt">
  </a>
  <a aria-label="License" href="https://github.com/motifland/markprompt/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue.svg">
  </a>
</p>

## Documentation

To use the Markprompt platform as is, please refer to the [Markprompt documentation](https://markprompt.com/docs).

## Self-hosting

Markprompt is built on top of the following stack:

- [Next.js](https://nextjs.org/) - framework
- [Vercel](https://vercel.com/) - hosting
- [Typescript](https://www.typescriptlang.org/) - language
- [Tailwind](https://tailwindcss.com/) - CSS
- [Upstash](https://upstash.com/) - Redis and rate limiting
- [Supabase](https://supabase.com/) - database and auth
- [Stripe](https://stripe.com/) - payments
- [Plain](https://plain.com/) - support chat
- [Fathom](https://usefathom.com/) - analytics

### Supabase

Supabase is used for storage and auth, and if self-hosting, you will need to set it up on the [Supabase admin console](https://app.supabase.com/).

#### Schema

The schema is defined in [schema.sql](https://github.com/motifland/markprompt/blob/main/config/schema.sql). Create a Supabase database and paste the content of this file into the SQL editor. Then run the Typescript types generation script using:

```sh
npx supabase gen types typescript --project-id <supabase-project-id> --schema public > types/supabase.ts
```

where `<supabase-project-id>` is the id of your Supabase project.

#### Auth provider

Authentication is handled by Supabase Auth. Follow the [Login with GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github) and [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) guides to set it up.

### Setting environment variables

A sample file containing required environment variables can be found in [example.env](https://github.com/motifland/markprompt/blob/main/example.env). In addition to the keys for the above services, you will need keys for [Upstash](https://upstash.com/) (rate limiting and key-value storage), [Plain.com](https://plain.com) (support chat), and [Fathom](https://usefathom.com/) (analytics).

## Using the React and Web components

Markprompt comes with React and Web components that make it easy to build a prompt interface on top of the Markprompt API. With a single line of code, you can provide a prompt interface to your React application. Follow the steps in the [Markprompt docs](https://markprompt.com/docs#components) to get started, or explore the [source code](https://github.com/motifland/markprompt-js).

Also, try out the [Markprompt starter template](https://github.com/motifland/markprompt-starter-template) for a fully working Next.js + Tailwind project.

## Usage

Currently, the Markprompt API has basic protection against misuse when making requests from public websites, such as rate limiting, IP blacklisting, allowed origins, and prompt moderation. These are not strong guarantees against misuse though, and it is always safer to expose an API like Markprompt's to authenticated users, and/or in non-public systems using private access tokens. We do plan to offer more extensive tooling on that front (hard limits, spike protection, notifications, query analysis, flagging).

## Data retention

OpenAI keeps training data for 30 days. Read more: [OpenAI API data usage policies](https://openai.com/policies/api-data-usage-policies).

Markprompt keeps the data as long as you need to query it. If you remove a file or delete a project, all associated data will be deleted immediately.

## Community

- [Twitter @markprompt](https://twitter.com/markprompt)
- [Twitter @motifland](https://twitter.com/motifland)
- [Discord](https://discord.gg/MBMh4apz6X)

## Authors

Created by the team behind [Motif](https://motif.land)
([@motifland](https://twitter.com/motifland)).
