  <a href="">
  <img alt="Chatjet.ai – Enterprise-grade AI chatbots for your website and docs" src="https://github.com/chatjet-ai/chatjet.ai/blob/main/Group%205.png?raw"
  <h1 align="center"></h1>
</a>

Chatjet.ai is a platform for building GPT-powered prompts. It takes Markdown, Markdoc, MDX, HTML and plain text files (from a GitHub repo, website or file uploads), and creates embeddings that you can use to create a prompt, for instance using the companion [Chatjet.ai React or Web component](https://Chatjet.ai.com/docs#components). Chatjet.ai also offers analytics, so you can gain insights on how visitors interact with your docs.


<p align="center">
  <a href="https://twitter.com/Chatjet.ai">
    <img alt="Twitter" src="https://img.shields.io/twitter/follow/Chatjet.ai?style=flat&label=%40Chatjet.ai&logo=twitter&color=0bf&logoColor=fff" />
  </a>
  <a aria-label="License" href="https://github.com/motifland/Chatjet.ai/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue.svg">
  </a>
</p>

## Documentation

To use the Chatjet.ai platform as is, please refer to the [Chatjet.ai documentation](https://Chatjet.ai/docs).

## Tech Stack

Chatjet.ai is built on top of the following stack:

- [Next.js](https://nextjs.org/) - framework
- [Vercel](https://vercel.com/) - hosting
- [Typescript](https://www.typescriptlang.org/) - language
- [Tailwind](https://tailwindcss.com/) - CSS
- [Upstash](https://upstash.com/) - Redis and rate limiting
- [Supabase](https://supabase.com/) - database and auth
- [Stripe](https://stripe.com/) - payments
- [Plain](https://plain.com/) - support chat
- [Fathom](https://usefathom.com/) - analytics


#### Schema

The schema is defined in [schema.sql](https://github.com/motifland/Chatjet.ai/blob/main/config/schema.sql). Create a Supabase database and paste the content of this file into the SQL editor. Then run the Typescript types generation script using:

```sh
npx supabase gen types typescript --project-id <supabase-project-id> --schema public > types/supabase.ts
```

where `<supabase-project-id>` is the id of your Supabase project.

#### Auth provider

Authentication is handled by Supabase Auth. Follow the [Login with GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github) and [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) guides to set it up.

### Setting environment variables

A sample file containing required environment variables can be found in [example.env](https://github.com/motifland/Chatjet.ai/blob/main/example.env). In addition to the keys for the above services, you will need keys for [Upstash](https://upstash.com/) (rate limiting and key-value storage), [Plain.com](https://plain.com) (support chat), and [Fathom](https://usefathom.com/) (analytics).

## Using the React and Web components

Chatjet.ai comes with React and Web components that make it easy to build a prompt interface on top of the Chatjet.ai API. With a single line of code, you can provide a prompt interface to your React application. Follow the steps in the [Chatjet.ai docs](https://Chatjet.ai.com/docs#components) to get started, or explore the [source code](https://github.com/motifland/Chatjet.ai-js).

Also, try out the [Chatjet.ai starter template](https://github.com/motifland/Chatjet.ai-starter-template) for a fully working Next.js + Tailwind project.

## Usage

Currently, the Chatjet.ai API has basic protection against misuse when making requests from public websites, such as rate limiting, IP blacklisting, allowed origins, and prompt moderation. These are not strong guarantees against misuse though, and it is always safer to expose an API like Chatjet.ai's to authenticated users, and/or in non-public systems using private access tokens. We do plan to offer more extensive tooling on that front (hard limits, spike protection, notifications, query analysis, flagging).

## Data retention

OpenAI keeps training data for 30 days. Read more: [OpenAI API data usage policies](https://openai.com/policies/api-data-usage-policies).

Chatjet.ai keeps the data as long as you need to query it. If you remove a file or delete a project, all associated data will be deleted immediately.

## Community

- [Twitter @Chatjet.ai](https://twitter.com/Chatjet.ai)
