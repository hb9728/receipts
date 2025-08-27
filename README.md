# receipts

anonymous image + caption app. faces auto-blurred. nsfw blocked. one-tap reactions.

## deploy

1) supabase
   - create project
   - run `schema.sql` (tables, rls, rpc)
   - storage: create bucket `receipts` (public)
   - policy: `public read images` on storage objects (select)

2) vercel
   - import this repo
   - set env vars (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET, HASH_SALT, BASE_URL)
   - deploy

## notes
- posting cooldown: 30s per device (cookie-hashed).
- reports ≥5 auto-hide a post.
- images limited ~3MB after processing; client compresses to webp; exif stripped.
- safety: emails/phones/urls/handles/postcodes redacted in captions; slurs masked.
