-- Migration: create or replace function public.search_images_v2
-- Created at: 2025-11-02 03:00
-- Description: Adds or updates the search_images_v2 function for searching images with metadata.

create or replace function public.search_images_v2(
  user_uuid uuid,
  search_text text default null,
  sort_order text default 'desc',
  limit_count int default 20,
  offset_count int default 0
)
returns table (
  id bigint,
  user_id uuid,
  filename text,
  created_at timestamptz,
  original_path text,
  thumbnail_path text,
  metadata jsonb
)
language plpgsql
as $$
declare
  sql text;
  safe_sort text := 'desc';
begin
  -- Validate sort order
  if lower(sort_order) not in ('asc', 'desc') then
    safe_sort := 'desc';
  else
    safe_sort := lower(sort_order);
  end if;

  -- Dynamic SQL with explicit casts
  sql := format($f$
    select
      i.id::bigint as id,
      i.user_id::uuid as user_id,
      i.filename::text as filename,
      i.uploaded_at::timestamptz as created_at,
      i.original_path::text as original_path,
      i.thumbnail_path::text as thumbnail_path,
      to_jsonb(m.*)::jsonb as metadata
    from public.images i
    join public.image_metadata m on m.image_id = i.id
    where i.user_id = %L
      and (
        %L is null
        or i.filename ilike '%%' || %L || '%%'
        or m.search_vector @@ plainto_tsquery('english', %L)
      )
    order by i.uploaded_at %s
    limit %s offset %s
  $f$,
    user_uuid,
    search_text,
    search_text,
    search_text,
    safe_sort,
    limit_count,
    offset_count
  );

  return query execute sql;
end;
$$;
