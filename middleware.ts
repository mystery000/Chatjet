import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

import AppMiddleware from './lib/middleware/app';
import CompletionsMiddleware from './lib/middleware/completions';
import MatchSectionsMiddleware from './lib/middleware/sections';
import TrainMiddleware from './lib/middleware/train';
import { getAppHost } from './lib/utils.edge';

export const config = {
  matcher: [
    '/((?!_next/|_proxy/|_auth/|_root/|_static|static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const hostname = req.headers.get('host');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  if (req.nextUrl.pathname.startsWith('/api/oauth/')) {
    return NextResponse.next();
  }

  if (hostname === getAppHost()) {
    return AppMiddleware(req);
  }

  if (hostname === 'api.markprompt.com' || hostname === 'api.localhost:3000') {
    const path = req.nextUrl.pathname;

    if (
      path?.startsWith('/completions') ||
      path?.startsWith('/v1/completions')
    ) {
      return CompletionsMiddleware(req);
    } else if (path?.startsWith('/train') || path?.startsWith('/v1/train')) {
      return TrainMiddleware(req);
    } else if (path?.startsWith('/v1/sections')) {
      return MatchSectionsMiddleware(req);
    }
  }

  return NextResponse.next();
}
