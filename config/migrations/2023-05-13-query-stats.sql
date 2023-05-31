-- This migration introduces a new "query_stats" table.

create table public.query_stats (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id     uuid references public.projects on delete cascade not null,
  prompt         text,
  response       text,
  no_response    boolean,
  upvoted        boolean,
  downvoted      boolean,
  processed      boolean not null default false,
  embedding      vector(1536)
);
comment on table public.query_stats is 'Query stats.';

alter table query_stats
  enable row level security;

create policy "Users can only see query stats associated to projects they have access to." on public.query_stats
  for select using (
    query_stats.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can insert query stats associated to projects they have access to." on public.query_stats
  for insert with check (
    query_stats.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can update query stats associated to projects they have access to." on public.query_stats
  for update using (
    query_stats.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can delete query stats associated to projects they have access to." on public.query_stats
  for delete using (
    query_stats.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

alter table query_stats
add column embedding vector(1536);