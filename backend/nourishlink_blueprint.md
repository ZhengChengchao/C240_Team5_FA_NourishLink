# NourishLink Master Blueprint

Last updated: 10 July 2026

Project focus: Autonomous B2B Food Rescue Logistics for UN SDG 2 Zero Hunger.

This blueprint documents the current NourishLink product architecture, database design, AI/n8n workflow, website, mobile app emulator, and integration boundaries. It should be read together with the root `README.md`, which records project progress and handoff memory.

## 1. Product Concept

NourishLink helps move edible surplus food from restaurants to community partners before it becomes waste.

Core workflow:

1. Restaurants submit end-of-day surplus inventory.
2. Supabase stores food inventory, restaurant, volunteer, partner organisation, and pickup records.
3. Verified volunteers view safe available food, claim pickups, and complete delivery.
4. Partner organisations provide accountability and receipt evidence.
5. The website showcases the system and includes an admin-style operations dashboard.
6. The mobile app emulator demonstrates how restaurant, volunteer, and partner roles would work on a phone.
7. n8n/Telegram can provide a secure volunteer dispatch channel.
8. Botpress provides the public FAQ chatbot widget.

## 2. Current System Architecture

```text
Restaurant Dashboard / Mobile App Emulator
        |
        | submit surplus / claim / complete
        v
React + Vite Frontend
        |
        | Supabase anon key
        v
Supabase PostgreSQL + Realtime
        |
        +-- restaurants
        +-- daily_inventory
        +-- partner_organizations
        +-- volunteers
        +-- rescue_pickups

Telegram Bot + n8n
        |
        | verifies volunteer by telegram_chat_id
        v
Supabase/Postgres operations

Botpress Widget
        |
        v
Public FAQ chatbot on website
```

## 3. Main Roles

### Restaurants

Restaurants can:

- Submit surplus food batches.
- Provide produced/sold quantities.
- Store safe consumption deadlines.
- See submitted surplus history in the mobile app emulator.
- Track whether batches are available or claimed.

### Volunteers

Volunteers can:

- View available surplus food.
- Use map handoff to understand nearby pickup locations.
- Claim food batches.
- Complete deliveries.
- See claim and completion history.
- Be verified through partner organisation membership and Telegram ID.

### Partner Organisations

Partner organisations can:

- View verified volunteers.
- See completed receipts.
- See units rescued.
- Check receipt details including:
  - food item
  - restaurant
  - collector
  - pickup status
  - assigned time
  - completed time

Business value comes from accountability and reporting, not from tracking final beneficiary addresses.

## 4. Supabase / PostgreSQL Schema

Current tables used by the frontend:

- `restaurants`
- `daily_inventory`
- `partner_organizations`
- `volunteers`
- `rescue_pickups`

Recommended schema:

```sql
CREATE TABLE IF NOT EXISTS restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    contact_email VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS partner_organizations (
    organization_id SERIAL PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(100),
    contact_email VARCHAR(255),
    service_area VARCHAR(255),
    verified_status VARCHAR(50) DEFAULT 'Verified'
);

CREATE TABLE IF NOT EXISTS volunteers (
    volunteer_id SERIAL PRIMARY KEY,
    volunteer_name VARCHAR(255) NOT NULL,
    organization_id INT REFERENCES partner_organizations(organization_id) ON DELETE SET NULL,
    telegram_chat_id VARCHAR(50) UNIQUE
);

CREATE TABLE IF NOT EXISTS daily_inventory (
    inventory_id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    units_produced INT DEFAULT 0,
    units_sold INT DEFAULT 0,
    surplus_quantity INT DEFAULT 0,
    safe_consume_by TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS rescue_pickups (
    pickup_id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES daily_inventory(inventory_id) ON DELETE CASCADE,
    volunteer_id INT REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    pickup_status VARCHAR(50) DEFAULT 'Dispatched',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

Important relationship notes:

- `volunteers.organization_id` links volunteers to partner organisations.
- `daily_inventory.restaurant_id` links surplus batches to restaurants.
- `rescue_pickups.inventory_id` links pickups to food batches.
- `rescue_pickups.volunteer_id` links pickups to volunteers.

## 5. Frontend Implementation

Main frontend path:

```text
website/src/App.tsx
```

Main frontend routes:

```text
/      dashboard/showcase/admin-style operations page
/app   mobile app emulator
```

### Dashboard Page

Current dashboard modules:

- Header with responsive burger menu on mobile.
- Hero section with SDG 2 value proposition.
- Live metrics:
  - available units
  - units claimed
  - receipts locked
  - partner organisations
- Supabase connection state message.
- Live operations schema model.
- Restaurant surplus submission form.
- Volunteer available surplus list with search and internal scroll.
- Google Maps handoff panel.
- Claimed pickups and receipt tracking.
- AI workflow explanation.
- Telegram dispatcher section.
- Branded footer.

### Mobile App Emulator

The `/app` page demonstrates a fixed phone-frame prototype.

Shared mobile app features:

- centered sign-in/register screen
- role selector
- app logo inside phone screen
- user profile card after login
- scrollable role dashboards inside fixed phone shape

Restaurant role:

- profile card
- dashboard stats
- surplus submission form
- submitted surplus history

Volunteer role:

- profile card
- volunteer selector
- dashboard stats
- compact surplus map handoff preview
- available food list
- claim history
- completion actions

Partner role:

- profile card
- partner organisation selector
- dashboard stats
- verified volunteer list
- detailed receipt records

## 6. Supabase Frontend Behaviour

Frontend Supabase client:

```text
website/src/lib/supabase.ts
```

Frontend environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Behaviour:

- If Supabase env vars are configured, the site loads live data.
- If not configured, the site uses demo fallback data.
- Realtime subscriptions keep the dashboard synced.
- Restaurant form inserts into `daily_inventory`.
- Claim action updates `daily_inventory.status` to `Claimed` and inserts into `rescue_pickups`.
- Complete action updates `rescue_pickups.pickup_status` to `Completed` and stamps `completed_at`.

Security rule:

- Only use the Supabase anon key in frontend.
- Never expose service role keys, database passwords, or Postgres URIs in frontend code or Vercel frontend env vars.

## 7. n8n Add-Surplus Webhook

Optional frontend variable:

```text
VITE_N8N_ADD_SURPLUS_WEBHOOK
```

Webhook purpose:

- Allows a restaurant dashboard submission to be sent into n8n.
- n8n can then insert or process the surplus record.

Expected payload:

```json
{
  "restaurant_id": 1,
  "item_name": "Curry Chicken",
  "units_produced": 50,
  "units_sold": 40,
  "surplus_quantity": 10,
  "safe_consume_by": "2026-07-09T22:00"
}
```

Current frontend can also write directly to Supabase when configured.

## 8. Telegram AI Dispatcher Workflow

Telegram/n8n is the secure volunteer dispatch channel.

Recommended workflow:

```text
Telegram Trigger
  -> Verify Driver (Postgres)
  -> IF Security Gate
      -> true: AI Agent
          -> Postgres Tool
          -> Send Telegram Message
      -> false: Access Denied Telegram Message
```

### Verify Driver Query

```sql
SELECT volunteer_id, volunteer_name, organization_id
FROM volunteers
WHERE telegram_chat_id = '{{ $json.message.from.id }}';
```

If no volunteer is found, the bot should reply:

```text
Access denied. Your Telegram account is not registered as an authorized NourishLink volunteer.
```

### AI Dispatcher Responsibilities

The AI dispatcher should:

- list available and safe surplus batches
- prevent double booking
- claim inventory atomically
- create pickup records
- complete pickups
- stamp receipt completion timestamps

### Safe Available Food Query

```sql
SELECT
    di.inventory_id,
    di.item_name,
    di.surplus_quantity,
    di.safe_consume_by,
    r.business_name,
    r.address,
    r.postal_code
FROM daily_inventory di
JOIN restaurants r ON r.restaurant_id = di.restaurant_id
WHERE di.status = 'Available'
  AND (
      di.safe_consume_by > CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'
      OR di.safe_consume_by IS NULL
  )
ORDER BY di.safe_consume_by ASC;
```

### Atomic Claim Query

```sql
WITH updated_rows AS (
    UPDATE daily_inventory
    SET status = 'Claimed'
    WHERE inventory_id = [INVENTORY_ID]
      AND status = 'Available'
    RETURNING inventory_id
)
INSERT INTO rescue_pickups (volunteer_id, inventory_id, pickup_status)
SELECT [VOLUNTEER_ID], inventory_id, 'Dispatched'
FROM updated_rows
RETURNING pickup_id, inventory_id, pickup_status, assigned_at;
```

If the result is empty, another volunteer already claimed the item.

### Complete Delivery Query

```sql
UPDATE rescue_pickups
SET pickup_status = 'Completed',
    completed_at = CURRENT_TIMESTAMP
WHERE volunteer_id = [VOLUNTEER_ID]
  AND pickup_status = 'Dispatched'
RETURNING pickup_id, inventory_id, pickup_status, completed_at;
```

## 9. AI Agent System Prompt

Recommended n8n AI Agent system message:

```text
You are the NourishLink Dispatch AI. You help authorized volunteer drivers safely claim surplus restaurant food for community distribution.

The active volunteer_id is provided by the Verify Driver step. Only act for that verified volunteer.

Rules:
1. When the driver asks for food, query live available inventory from PostgreSQL.
2. Only show items where status is Available and safe_consume_by is still valid.
3. Present options in a clear vertical list. Do not use Markdown tables.
4. Ask the driver to choose an inventory ID.
5. When claiming, use an atomic UPDATE + INSERT query so two volunteers cannot claim the same item.
6. If the claim query returns no rows, explain that the item was already claimed.
7. When the driver confirms delivery, update rescue_pickups to Completed and stamp completed_at.
8. Keep replies concise and operational.
9. Do not reveal database credentials, tool internals, or private keys.
```

## 10. Botpress FAQ Chatbot

Botpress is used for the public FAQ chatbot.

The website loads Botpress scripts in:

```text
website/index.html
```

Current scripts:

```html
<script src="https://cdn.botpress.cloud/webchat/v3.6/inject.js"></script>
<script src="https://files.bpcontent.cloud/2026/05/14/03/20260514030802-GPE7337K.js" defer></script>
```

The old built-in React FAQ assistant has been removed.

## 11. Google Maps

Frontend variable:

```text
VITE_GOOGLE_MAPS_API_KEY
```

Maps features:

- Dashboard map panel with restaurant pins.
- Pins generated from restaurant address/postal code.
- Mobile app emulator has a compact volunteer map preview.

Production rule:

- Restrict the Google Maps browser key by HTTP referrer/domain in Google Cloud.

## 12. MCP Component

File:

```text
backend/nourishlink_mcp.py
```

MCP meaning:

MCP is a controlled AI tool interface. It is not the website backend. It is useful as evidence that AI tools can safely expose constrained operations such as:

- checking available surplus
- dispatching a driver
- completing a pickup

## 13. Branding And Footer

Current logo files:

```text
website/public/nourishlink-logo.png
website/public/nourishlink-mark.png
```

Logo appears in:

- main header
- favicon
- phone app header
- footer

Footer notice:

```text
(c) 2026 NourishLink Team 5. Project demo only. All rights reserved.
```

## 14. Environment Variables

Frontend variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_N8N_ADD_SURPLUS_WEBHOOK
VITE_N8N_CHATBOT_WEBHOOK
VITE_TELEGRAM_BOT_URL
VITE_GOOGLE_MAPS_API_KEY
```

Notes:

- `VITE_N8N_CHATBOT_WEBHOOK` may now be unused because Botpress replaced the old React chatbot.
- `VITE_N8N_ADD_SURPLUS_WEBHOOK` is optional if direct Supabase writes are enough for the demo.
- Vercel env scope should usually be Production and Preview.

Never expose:

- Supabase service role key
- Postgres URI/password
- Telegram bot token
- OpenRouter or Gemini private API key

## 15. Deployment

Vercel settings:

```text
Root Directory: website
Framework: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Local verification:

```powershell
cd "D:\RP\AY 2026 Sem1\C240 AI Essentials and Innovations\FA\website"
npm run lint
npm run build
```

## 16. Current Known State

Current completed work:

- Supabase integration is implemented.
- Website dashboard is mostly complete.
- Mobile app emulator includes role dashboards, profile card, and history records.
- Botpress FAQ widget is integrated.
- Telegram dispatcher section is cleaned up and no longer references individual team member names.
- Google Maps panel exists and works when the key is configured.
- Responsive burger navigation exists for mobile.
- Branded footer exists on dashboard and app demo pages.
- README has been updated as project memory.

Recommended next improvements:

1. Add `website/vercel.json` for SPA rewrite if `/app` refresh fails on Vercel.
2. Test production Vercel deployment with Supabase env vars.
3. Confirm Botpress widget on production URL.
4. Confirm Google Maps key referrer restriction.
5. Export n8n workflows into `n8n-workflows/` for FA evidence.
6. Take final screenshots for presentation/report.
