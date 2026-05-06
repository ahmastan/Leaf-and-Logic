# Leaf and Logic

Plant care app with identification (Plant.id), care info, and your garden in Supabase.

## Prerequisites

- Node.js 18+
- Supabase project
- Plant.id API Key
- (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) — deploys **delete-account**

## Setup

1. Clone and install:
   ```bash
   npm install
   ```

2. Copy env example and add your keys:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set:
   - **Supabase:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (from Supabase dashboard → Settings → API)
   - **Plant.id** `VITE_PLANT_ID_URL`, `VITE_PLANT_ID_API_KEY` from [admin.kindwise.com/api_keys](https://admin.kindwise.com/api_keys)
   - **Perenual** (optional) `VITE_PERENUAL_KEY` for richer search/results


3. Create Supabase tables and storage (run in SQL Editor and create bucket in Storage):

```sql
-- Profiles (user settings)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  location text,
  climate text,
  pet_safety_mode boolean default false,
  notifications_enabled boolean default true,
  notification_time text default '08:00',
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reference plants (from identification)
create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  common_name text not null,
  scientific_name text,
  plant_type text,
  difficulty text,
  sunlight text,
  watering_interval_days int,
  humidity text,
  temperature_min int,
  temperature_max int,
  soil_type text,
  fertilize_interval_days int,
  toxicity_pets boolean,
  toxicity_humans boolean,
  pruning_notes text,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- User's plants
create table if not exists public.user_plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id text,
  plant_name text,
  nickname text,
  scientific_name text,
  plant_type text,
  photo_url text,
  location text,
  room text,
  pot_size text,
  health_status text default 'healthy',
  last_watered date,
  last_fertilized date,
  last_pruned date,
  notes text,
  watering_interval_days int,
  sunlight text,
  difficulty text,
  toxicity_pets boolean,
  photos_history jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Care tasks
create table if not exists public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_plant_id uuid not null references public.user_plants(id) on delete cascade,
  plant_name text,
  task_type text not null,
  due_date date not null,
  completed boolean default false,
  completed_date date,
  notes text,
  recurring boolean default true,
  interval_days int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.plants enable row level security;
alter table public.user_plants enable row level security;
alter table public.care_tasks enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Anyone can read plants" on public.plants for select using (true);
create policy "Authenticated can insert plants" on public.plants for insert with check (auth.uid() is not null);

create policy "Users can CRUD own user_plants" on public.user_plants for all using (auth.uid() = user_id);

create policy "Users can CRUD own care_tasks" on public.care_tasks for all using (auth.uid() = user_id);
```

4. **Storage bucket**

   In Supabase Dashboard → **Storage**, create a **public** bucket named `plant-photos` (or change `BUCKET` in `src/api/supabaseData.js`).

5. **Storage policies (recommended)**

   Photos are stored under `plant-photos/{user_id}/...`. Add policies so users can manage **their own** prefix (needed for identification uploads, listing/deleting files on account deletion):

```sql
-- Adjust bucket_id if you changed BUCKET in supabaseData.js

create policy "Users can upload own plant photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Covers GET URLs and storage.list() for the user's folder
create policy "Users can read own plant photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own plant photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own plant photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

If policies with these names already exist, drop them first or pick different names.

6. Run locally:
   ```bash
   npm run dev
   ```

## Auth

The app uses Supabase Auth. Configure an auth method (e.g. Email/Password or OAuth) in Supabase Dashboard → **Authentication**. Without signing in, plant list and tasks will be empty.

## Delete account (Settings)

The **Settings** page includes a **Danger zone → Delete account** action. It:

1. Removes objects under `plant-photos/{user_id}/` in Storage (best effort).
2. Calls an Edge Function **`delete-account`** that deletes the user from **Auth** using the service role.
3. Relies on foreign keys (`on delete cascade` on `profiles`, `user_plants`, and `care_tasks` as in the SQL above) so app data is removed when the auth user is deleted.
4. Signs the user out and redirects to the login page.

The Edge Function source lives at `supabase/functions/delete-account/index.ts`. It does **not** appear in the Supabase project until you deploy it.

### Deploy the `delete-account` Edge Function

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) and log in:
   ```bash
   supabase login
   ```

2. From the project root, link your project (reference ID is under **Project Settings → General**):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   If the CLI reports no local Supabase config, run `supabase init` once, then link again.

3. Deploy:
   ```bash
   supabase functions deploy delete-account
   ```

   One-shot alternative without saving link metadata:
   ```bash
   supabase functions deploy delete-account --project-ref YOUR_PROJECT_REF
   ```

4. In **Edge Functions → delete-account**, keep **JWT verification** enabled so only authenticated users can invoke it.

No extra environment variables are required in the frontend: `supabase.functions.invoke('delete-account')` uses your existing Supabase URL and anon key.



## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview production build
