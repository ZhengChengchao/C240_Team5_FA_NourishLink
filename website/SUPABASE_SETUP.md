# Supabase Setup for NourishLink Website

The website can run in two modes:

- Demo mode: no Supabase variables, local sample data only.
- Live mode: reads and writes Supabase tables, then syncs changes through Realtime.

## 1. Get Frontend Keys

In Supabase:

1. Open your project.
2. Go to Project Settings > API.
3. Copy the Project URL.
4. Copy the anon public key.

Create `website/.env.local`:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

Do not use these in the frontend:

- Postgres connection string
- database password
- service_role key

## 2. Tables Used

The frontend expects the same tables as the backend blueprint:

- `restaurants`
- `daily_inventory`
- `volunteers`
- `rescue_pickups`

The frontend only selects `volunteer_id` and `volunteer_name` from `volunteers`.
Telegram chat IDs remain part of the n8n RBAC workflow.

## 3. Realtime

In Supabase, enable Realtime for:

- `restaurants`
- `daily_inventory`
- `volunteers`
- `rescue_pickups`

The app subscribes to these tables and reloads live data whenever rows change.

## 4. Prototype RLS Policies

For a school prototype, you can use permissive policies with the anon key.
For production, replace these with proper authenticated roles.

```sql
alter table restaurants enable row level security;
alter table daily_inventory enable row level security;
alter table volunteers enable row level security;
alter table rescue_pickups enable row level security;

create policy "prototype read restaurants"
on restaurants for select
using (true);

create policy "prototype read inventory"
on daily_inventory for select
using (true);

create policy "prototype insert inventory"
on daily_inventory for insert
with check (true);

create policy "prototype claim available inventory"
on daily_inventory for update
using (status = 'Available')
with check (status = 'Claimed');

create policy "prototype read volunteer names"
on volunteers for select
using (true);

create policy "prototype read pickups"
on rescue_pickups for select
using (true);

create policy "prototype insert pickups"
on rescue_pickups for insert
with check (true);

create policy "prototype complete pickups"
on rescue_pickups for update
using (pickup_status = 'Dispatched')
with check (pickup_status = 'Completed');
```

## 5. Recommended Seed Data

Make sure these tables have at least one restaurant and one volunteer before testing claims:

```sql
insert into restaurants (business_name, address, postal_code, contact_email)
values
('Tiong Bahru Curry House', '56 Eng Hoon Street, Singapore', '160056', 'ops@tiongbahrucurry.sg')
on conflict do nothing;

insert into volunteers (volunteer_name, telegram_chat_id)
values
('Demo Volunteer', 'demo-telegram-id')
on conflict do nothing;
```

## 6. What Sync Means

When Supabase env variables exist, the app:

1. Loads restaurants, volunteers, inventory, and pickups from Supabase.
2. Inserts new surplus into `daily_inventory`.
3. Claims a pickup by updating `daily_inventory.status` to `Claimed`.
4. Creates a `rescue_pickups` row.
5. Completes delivery by updating `rescue_pickups.pickup_status` and `completed_at`.
6. Listens for Realtime changes and refreshes the UI when another client changes data.
