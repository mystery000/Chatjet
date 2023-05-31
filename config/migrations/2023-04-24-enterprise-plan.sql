-- Add an enterprise plan flag in the team table
alter table teams
add column is_enterprise_plan boolean;