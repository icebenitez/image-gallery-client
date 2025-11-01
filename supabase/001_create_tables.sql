-- 001_create_tables.sql
-- Create tables and constraints for images and image_metadata

CREATE TABLE IF NOT EXISTS public.images (
  id bigint PRIMARY KEY DEFAULT nextval('images_id_seq'::regclass),
  user_id uuid,
  filename character varying,
  original_path text,
  thumbnail_path text,
  uploaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Foreign key to auth.users (note: auth schema is managed by Supabase; ensure permissions)
ALTER TABLE IF EXISTS public.images
  ADD CONSTRAINT IF NOT EXISTS images_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Sequence ownership safeguard (if sequence exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'images_id_seq') THEN
    CREATE SEQUENCE images_id_seq;
    ALTER SEQUENCE images_id_seq OWNED BY public.images.id;
    -- set default if not already set above
    ALTER TABLE public.images ALTER COLUMN id SET DEFAULT nextval('images_id_seq'::regclass);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.image_metadata (
  id bigint PRIMARY KEY DEFAULT nextval('image_metadata_id_seq'::regclass),
  image_id bigint UNIQUE,
  user_id uuid,
  description text,
  tags text[],
  colors character varying[],
  ai_processing_status character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  search_vector tsvector
);

ALTER TABLE IF EXISTS public.image_metadata
  ADD CONSTRAINT IF NOT EXISTS image_metadata_image_id_fkey
  FOREIGN KEY (image_id) REFERENCES public.images(id);

ALTER TABLE IF EXISTS public.image_metadata
  ADD CONSTRAINT IF NOT EXISTS image_metadata_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Create sequences if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'image_metadata_id_seq') THEN
    CREATE SEQUENCE image_metadata_id_seq;
    ALTER SEQUENCE image_metadata_id_seq OWNED BY public.image_metadata.id;
    ALTER TABLE public.image_metadata ALTER COLUMN id SET DEFAULT nextval('image_metadata_id_seq'::regclass);
  END IF;
END$$;

-- Indexes: index columns referenced by RLS and queries
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_image_metadata_user_id ON public.image_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_image_metadata_image_id ON public.image_metadata(image_id);
-- If using full-text search:
CREATE INDEX IF NOT EXISTS idx_image_metadata_search_vector ON public.image_metadata USING gin (search_vector);