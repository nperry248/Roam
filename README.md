# Roam

A full-stack mobile travel tracker built with React Native (Expo) and Supabase.

## Features

- **Trip management** — Create and track trips across three stages: Dreaming, Planning, and Confirmed
- **Cover photos** — Pick from your library or take a photo; images are stored in Supabase Storage
- **Expenses** — Log and categorize spending per trip
- **Documents** — Save flights, hotels, and other bookings with links
- **Photo gallery** — Multi-select upload; tap to view full-screen
- **AI assistant** — Chat with Gemini with full context of your trips
- **Calendar view** — See all trips laid out by date
- **Authentication** — Email/password auth with persistent sessions

## Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | Google Gemini |
| Navigation | React Navigation |

## Setup

1. Clone the repo
2. `npm install`
3. Create a [Supabase](https://supabase.com) project and run the schema below
4. Copy `keys.ts.example` to `keys.ts` and fill in your credentials
5. `npx expo start`

### Supabase Schema

```sql
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  destination text not null,
  status text check (status in ('ideated','planned','confirmed')) default 'ideated',
  start_date date,
  end_date date,
  cover_image_url text,
  notes text,
  budget integer,
  created_at timestamptz default now()
);
alter table trips enable row level security;
create policy "users own trips" on trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references trips(id) on delete cascade not null,
  url text not null,
  caption text,
  created_at timestamptz default now()
);
alter table photos enable row level security;
create policy "users own photos" on photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  amount integer not null,
  category text not null,
  created_at timestamptz default now()
);
alter table expenses enable row level security;
create policy "users own expenses" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references trips(id) on delete cascade not null,
  type text not null,
  title text not null,
  subtitle text,
  link text,
  created_at timestamptz default now()
);
alter table documents enable row level security;
create policy "users own documents" on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Create two public Storage buckets: `trip-covers` and `trip-photos`.
