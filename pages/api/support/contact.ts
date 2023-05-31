import type { NextApiRequest, NextApiResponse } from 'next';
import { type SendEmailResponse, Resend } from 'resend';

import { checkEmailRateLimits } from '@/lib/rate-limits';
import { isValidEmail } from '@/lib/utils';

const resend = new Resend(process.env.RESEND_API_KEY);

type Data = {
  data?: SendEmailResponse;
  error?: any;
};

const allowedMethods = ['POST'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { email, message } = req.body;
  if (!isValidEmail(email) || !message) {
    return res.status(400).json({ error: 'Invalid email or message.' });
  }

  if (process.env.NODE_ENV === 'production') {
    let ip = req.headers['x-real-ip'] as string;
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (!ip && forwardedFor) {
      ip = forwardedFor?.split(',').at(0) ?? 'Unknown';
    }

    // Apply rate limiting here already based on IP. After that, apply rate
    // limiting on requester token.
    const rateLimitIPResult = await checkEmailRateLimits(ip);

    if (!rateLimitIPResult.result.success) {
      console.error(`[CONTACT] [RATE-LIMIT] IP ${ip}, email: ${email}`);
      return new Response('Too many requests', { status: 429 });
    }
  }

  try {
    const data = await resend.sendEmail({
      from: process.env.NEXT_PUBLIC_SUPPORT_EMAIL!,
      to: process.env.NEXT_PUBLIC_SUPPORT_EMAIL!,
      reply_to: email,
      subject: 'Contact request',
      text: message,
    });

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
}
