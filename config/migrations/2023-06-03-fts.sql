create extension if not exists pgroonga with schema public;

-- Add an index on file_sections' content column for pgroonga extension.
create index ix_file_sections_content on file_sections using pgroonga(content);
-- create index concurrently ix_mv_file_section_search_infos on mv_file_section_search_infos using pgroonga(section_content);

-- create materialized view mv_file_section_search_infos as
--   select
--     f.id as file_id,
--     f.path as file_path,
--     f.meta as file_meta,
--     fs.content as section_content,
--     fs.meta as section_meta,
--     s.type as source_type,
--     s.data as source_data,
--     p.id as project_id,
--     p.public_api_key as public_api_key,
--     p.private_dev_api_key as private_dev_api_key,
--     tok.value as token,
--     d.name as domain,
--     t.stripe_price_id as stripe_price_id,
--     t.is_enterprise_plan as is_enterprise_plan
--   from file_sections fs
--   left join files f on fs.file_id = f.id
--   left join sources s on f.source_id = s.id
--   left join projects p on s.project_id = p.id
--   left join tokens tok on p.id = tok.project_id
--   left join domains d on p.id = d.project_id
--   left join teams t on t.id = p.team_id

create view v_file_section_search_infos as
  select
    f.id as file_id,
    f.path as file_path,
    f.meta as file_meta,
    fs.content as section_content,
    fs.meta as section_meta,
    s.type as source_type,
    s.data as source_data,
    p.id as project_id,
    p.public_api_key as public_api_key,
    p.private_dev_api_key as private_dev_api_key,
    tok.value as token,
    d.name as domain,
    t.stripe_price_id as stripe_price_id,
    t.is_enterprise_plan as is_enterprise_plan
  from file_sections fs
  left join files f on fs.file_id = f.id
  left join sources s on f.source_id = s.id
  left join projects p on s.project_id = p.id
  left join tokens tok on p.id = tok.project_id
  left join domains d on p.id = d.project_id
  left join teams t on t.id = p.team_id;

create or replace function refresh_materialized_view(view_name text)
returns void
language plpgsql
as $$
begin
  execute 'refresh materialized view concurrently ' || view_name;
end;
$$;

alter table file_sections
add column meta jsonb;