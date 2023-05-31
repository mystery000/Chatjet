-- This migration introduces a new "sources" table, and migrates
-- projects with a non-empty "github_repo" column to entries in
-- the "sources" table.

-- Sources
create type source_type as enum ('github', 'motif', 'file-upload', 'api-upload');

create table public.sources (
  id          uuid primary key default uuid_generate_v4(),
  inserted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id  uuid references public.projects on delete cascade not null,
  type        source_type not null,
  data        jsonb
);
comment on table public.sources is 'Data sources for a project.';

-- RLS

alter table sources
  enable row level security;

create policy "Users can only see sources associated to projects they have access to." on public.sources
  for select using (
    sources.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can insert sources associated to projects they have access to." on public.sources
  for insert with check (
    sources.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can update sources associated to projects they have access to." on public.sources
  for update using (
    sources.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

create policy "Users can delete sources associated to projects they have access to." on public.sources
  for delete using (
    sources.project_id in (
      select projects.id from projects
      left join memberships
      on projects.team_id = memberships.team_id
      where memberships.user_id = auth.uid()
    )
  );

-- Migration from the "github_repo" project column to sources entry.

insert into sources (project_id, type, data)
select id, 'github', jsonb_build_object('url', github_repo)
from projects
where github_repo is not null and github_repo <> ''
and not exists (
  select 1 from sources where sources.project_id = projects.id
);

-- In the files table, add a source_id reference.
-- reference.
alter table files
add column source_id uuid references public.sources on delete cascade;

-- Update the source_id to point to the appropriate source, by matching
-- project ids
update files
set source_id = sources.id
from sources
where sources.project_id = files.project_id;

-- For all the files with a NULL source (that is, manually uploaded),
-- create a new source of type 'upload', and update the references
insert into sources (project_id, type)
select distinct project_id, 'file-upload'
from files
where source_id is null;

-- Now that we have sources for the files with null source_id, namely
-- the uploaded case, update the source_id column on these files, mapping
-- to the source_id with source equals to 'upload'

update files
set source_id = sources.id
from sources
where sources.project_id = files.project_id and sources.type = 'file-upload';

-- Now that all the source_ids have been filled, we can set the column
-- type to non-nullable.

-- IN SUPABASE DASHBOARD: make source_id column non-nullable.

-- Checksums
alter table files
add column checksum text;

-- Update the match_file_sections function
create or replace function match_file_sections(project_id uuid, embedding vector(1536), match_threshold float, match_count int, min_content_length int)
returns table (path text, content text, token_count int, similarity float)
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select
    files.path,
    file_sections.content,
    file_sections.token_count,
    (file_sections.embedding <#> embedding) * -1 as similarity
  from file_sections
  join files
    on file_sections.file_id = files.id
  join sources
    on files.source_id = sources.id

  where sources.project_id = project_id

  -- We only care about sections that have a useful amount of content
  and length(file_sections.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (file_sections.embedding <#> embedding) * -1 > match_threshold

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by file_sections.embedding <#> embedding

  limit match_count;
end;
$$;