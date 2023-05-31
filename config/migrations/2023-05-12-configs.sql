-- Add a prompt configs table
create table public.prompt_configs (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id          uuid references public.projects on delete cascade not null,
  share_key           text,
  config              jsonb
);
comment on table public.prompt_configs is 'Prompt configs.';

-- RLS

alter table prompt_configs
  enable row level security;

create policy "Users can only see prompt configs associated to projects they have access to." on public.prompt_configs
  for select using (
    prompt_configs.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can insert prompt configs associated to projects they have access to." on public.prompt_configs
  for insert with check (
    prompt_configs.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can update prompt configs associated to projects they have access to." on public.prompt_configs
  for update using (
    prompt_configs.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can delete prompt configs associated to projects they have access to." on public.prompt_configs
  for delete using (
    prompt_configs.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );