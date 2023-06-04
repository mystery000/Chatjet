import { PostHog } from 'posthog-node';

type TrackingEventType =
  | 'train'
  | 'generate completions'
  | 'get sections'
  | 'search';

const posthogNoopClient = {
  capture: () => {
    // No-op
  },
  identify: () => {
    // No-op
  },
};

const client =
  process.env.NODE_ENV === 'production'
    ? new PostHog(process.env.POSTHOG_API_KEY!)
    : posthogNoopClient;

export const track = (
  identifier: string,
  name: TrackingEventType,
  data: any,
) => {
  client.capture({
    distinctId: identifier,
    event: name,
    properties: data,
  });
};
