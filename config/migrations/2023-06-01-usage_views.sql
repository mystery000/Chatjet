create or replace function refresh_materialized_view(view_name text)
returns void as $$
begin
  refresh materialized view view_name;
end;
$$ language plpgsql;

create view v_team_project_usage_info as
  select
    projects.id as project_id,
    teams.id as team_id,
    teams.is_enterprise_plan as is_enterprise_plan,
    teams.stripe_price_id as stripe_price_id,
    sum(file_sections.token_count) as team_token_count
  from file_sections
  left join files on file_sections.file_id = files.id
  left join sources on files.source_id = sources.id
  left join projects on sources.project_id = projects.id
  left join teams on projects.team_id = teams.id
  group by projects.id, teams.id

create view v_team_project_info as
  select
    projects.id as project_id,
    teams.id as team_id,
    teams.is_enterprise_plan as is_enterprise_plan,
    teams.stripe_price_id as stripe_price_id
  from projects
  left join teams on projects.team_id = teams.id
