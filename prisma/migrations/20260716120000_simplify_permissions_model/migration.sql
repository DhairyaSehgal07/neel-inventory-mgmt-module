-- Data migration: simplify user permissions to fabric/compound/raw_material CRUD + reports.
-- Schema unchanged (permissions remains String[]).
-- Run application migration: `pnpm run migrate-permissions`
-- This SQL is a marker so deploy pipelines record the permission model change.

SELECT 1;
