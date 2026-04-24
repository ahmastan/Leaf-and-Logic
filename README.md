# Leaf and Logic

Plant care app with identification (Plant.id), care info, and your garden in Supabase.

## Prerequisites

- Node.js 18+
- Supabase project
- Plant.id API Key

## Setup

1. Clone and install:
   ```bash
   npm ins
  

2. Copy env example and add your keys:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set:
   - **Supabase:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (from Supabase dashboard → Settings → API)
   - **Plant.id** `VITE_PLANT_ID_API_KEY` from [admin.kindwise.com/api_keys](https://admin.kindwise.com/api_keys)

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

In Supabase Dashboard → Storage, create a **public** bucket named `plant-photos` (or update `BUCKET` in `src/api/supabaseData.js`).

4. Run locally:
   ```bash
   npm run dev
   ```

## Auth

The app uses Supabase Auth. Configure an auth method (e.g. Email/Password or OAuth) in Supabase Dashboard → Authentication. Without signing in, plant list and tasks will be empty.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview production build
# Leaf-and-Logic
