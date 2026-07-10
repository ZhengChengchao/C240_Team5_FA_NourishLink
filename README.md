# NourishLink Project 

## Project Summary

NourishLink is a C240 AI Essentials and Innovations final assessment prototype for **Autonomous B2B Food Rescue Logistics** aligned with **SDG 2 Zero Hunger**.

The product idea:

- Restaurants submit end-of-day surplus food.
- The system stores surplus inventory in Supabase.
- Verified volunteers can view nearby available food, claim pickups, and complete delivery.
- Partner organisations can see volunteer activity and receipt evidence.
- The website acts as both a showcase/admin dashboard and a mobile app emulator.
- Telegram/n8n can act as a secure volunteer dispatch channel.
- Botpress is used as the public website FAQ chatbot widget.

## Workspace And Repo

Main local project root:

```powershell
D:\RP\AY 2026 Sem1\C240 AI Essentials and Innovations\FA
```

Main frontend folder:

```powershell
D:\RP\AY 2026 Sem1\C240 AI Essentials and Innovations\FA\website
```

GitHub repo:

```text
https://github.com/ZhengChengchao/C240_Team5_FA_NourishLink
```

Important: there is also another local folder named `nourishlink website`, but the current deploy-ready project is `FA/website`.

## Folder Structure

```text
FA/
+-- backend/
|   +-- nourishlink_mcp.py
|   +-- nourishlink_blueprint.md
|   +-- demo_seed_data.sql
|   +-- DEMO_DATA_README.md
+-- n8n-workflows/
|   +-- .gitkeep
+-- website/
|   +-- public/
|   |   +-- nourishlink-logo.png
|   |   +-- nourishlink-mark.png
|   +-- src/
|   |   +-- App.tsx
|   |   +-- index.css
|   |   +-- main.tsx
|   |   +-- vite-env.d.ts
|   |   +-- lib/supabase.ts
|   +-- .env.example
|   +-- .env.local
|   +-- index.html
|   +-- package.json
|   +-- package-lock.json
|   +-- SUPABASE_SETUP.md
|   +-- vite.config.ts
+-- README.md
```

## Frontend Status

Main frontend file:

```text
website/src/App.tsx
```

Current frontend includes:

- Main dashboard/showcase page at `/`
- Mobile app emulator page at `/app`
- Supabase live sync and demo fallback
- Restaurant surplus submission
- Volunteer available surplus list with search and scroll
- Google Maps handoff panel
- Pickup/receipt tracking
- Telegram dispatcher section
- Botpress FAQ chatbot widget loaded from `index.html`
- Branded copyright footer

The old built-in frontend “Denas FAQ assistant” was removed. Only the Botpress widget remains.

## Main Dashboard Page

Dashboard features:

- Hero section with SDG 2 message
- Metrics:
  - Available units
  - Units claimed
  - Receipts locked
  - Partner orgs
- Database connection message
- Live Operations Model schema cards
- Restaurant dashboard form
- Volunteer available surplus list
- Map handoff section
- Claimed pickups and receipts section
- AI workflow explanation
- Telegram dispatcher bot section
- Footer

Recent layout decisions:

- Restaurant form and volunteer list titles are aligned using `SectionHeader`.
- Restaurant form has fixed desktop minimum height so the confirmation message area does not visually jump.
- The confirmation message area is always reserved under Submit.
- Surplus list shows roughly 3 cards and then scrolls.
- Map/driver section uses a 2-card driver pickup window and then scrolls.
- Map panel height is fixed to align with the driver state area.
- Mobile header uses a burger menu so shortcut buttons do not disappear on phone.

## Mobile App Emulator Page

Route:

```text
/app
```

Purpose:

Demonstrates how the future mobile app might work for three roles:

- Restaurant
- Volunteer
- Partner organisation

Current mobile app emulator features:

- Fixed phone frame shape
- Centered login/register screen
- Logo inside phone screen
- Role selector
- User profile card after login
- Role-specific dashboards and history
- Scrollable signed-in content inside the phone
- Footer also appears on the App Demo page

### Restaurant Role

Restaurant users can:

- See a user profile card
- See dashboard stats:
  - submitted batches
  - receipts
  - units
- Submit surplus food
- View submitted surplus history
- See each submitted item status, quantity, and safe consume time

### Volunteer Role

Volunteer users can:

- See a user profile card
- Select volunteer identity
- See dashboard stats:
  - claimed pickups
  - completed pickups
  - units claimed
- View a compact Surplus Map Handoff preview
- Browse available food
- Claim pickups
- View claim/completion history
- Complete delivery

### Partner Organisation Role

Partner users can:

- See a user profile card
- Select partner organisation
- See dashboard stats:
  - volunteers
  - receipts
  - units rescued
- View verified volunteers
- View receipt details:
  - food item
  - restaurant
  - collector/volunteer
  - pickup status
  - assigned time
  - completed time or pending state

## Supabase Integration

Supabase client:

```text
website/src/lib/supabase.ts
```

Environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Important:

- Use the Supabase anon public key only in the frontend.
- Never put the Supabase service role key in Vercel frontend env vars.
- Never put the Postgres database password or URI in the frontend.

Tables used:

- `restaurants`
- `daily_inventory`
- `partner_organizations`
- `volunteers`
- `rescue_pickups`

Expected relationships:

- `daily_inventory.restaurant_id` references `restaurants.restaurant_id`
- `volunteers.organization_id` references `partner_organizations.organization_id`
- `rescue_pickups.inventory_id` references `daily_inventory.inventory_id`
- `rescue_pickups.volunteer_id` references `volunteers.volunteer_id`

Frontend behavior:

- Loads data from Supabase if env vars are configured.
- Uses demo data if Supabase env vars are missing.
- Realtime sync is enabled for restaurants, partner organisations, volunteers, inventory, and pickups.
- Submitting surplus inserts into `daily_inventory`.
- Claiming food updates inventory status and inserts into `rescue_pickups`.
- Completing delivery updates pickup status and completed timestamp.

## n8n And Telegram

Telegram dispatcher section exists on the dashboard.

Purpose:

- Website opens the Telegram bot.
- n8n keeps secrets outside the frontend.
- Telegram bot handles secure volunteer dispatch.

Environment variable:

```text
VITE_TELEGRAM_BOT_URL
```

Never put the Telegram bot token in the frontend.

The earlier Denas name/reference was removed from the Telegram section.

## Botpress Chatbot

The public FAQ chatbot uses Botpress webchat scripts in:

```text
website/index.html
```

Current scripts:

```html
<script src="https://cdn.botpress.cloud/webchat/v3.6/inject.js"></script>
<script src="https://files.bpcontent.cloud/2026/05/14/03/20260514030802-GPE7337K.js" defer></script>
```

This replaced the old built-in Denas FAQ assistant.

## Google Maps

Environment variable:

```text
VITE_GOOGLE_MAPS_API_KEY
```

Usage:

- Dashboard has a live Google Maps panel when the key is configured.
- The map displays restaurant pins from addresses/postal codes.
- Mobile app emulator has a compact map preview in the volunteer dashboard.

Important:

- Google Maps browser key should be restricted by HTTP referrer/domain in Google Cloud.
- Do not put private server API keys in frontend env vars.

## Branding

Logo assets:

```text
website/public/nourishlink-logo.png
website/public/nourishlink-mark.png
```

Current use:

- Header logo
- Browser favicon
- Footer logo
- Phone app logo

Header text:

- `Nourish` is green
- `Link` is gold
- Subtitle: `B2B Food Rescue Logistics`

Footer:

- Includes logo and copyright notice
- Uses:

```text
(c) 2026 NourishLink Team 5. Project demo only. All rights reserved.
```

## Environment Variables

Use `website/.env.local` locally.

Use Vercel Environment Variables for deployment.

Current expected frontend variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_N8N_ADD_SURPLUS_WEBHOOK
VITE_N8N_CHATBOT_WEBHOOK
VITE_TELEGRAM_BOT_URL
VITE_GOOGLE_MAPS_API_KEY
```

Notes:

- `VITE_N8N_CHATBOT_WEBHOOK` may be unused now because Botpress replaced the old frontend chatbot.
- Keep `VITE_N8N_ADD_SURPLUS_WEBHOOK` only if n8n surplus submission is still needed.
- In Vercel, choose `Production and Preview` for env variables.
- The Vercel “secret/hide value” lock is okay, but remember all `VITE_` frontend values are still visible in the browser bundle.

Never expose:

- Supabase service role key
- Postgres URI/password
- Telegram bot token
- OpenRouter/Gemini private API keys

## Local Run

Run from the website folder:

```powershell
cd "D:\RP\AY 2026 Sem1\C240 AI Essentials and Innovations\FA\website"
npm install
npm run dev
```

Development server:

```text
http://localhost:3000/
```

Build/test commands:

```powershell
npm run lint
npm run build
```

The latest checks have been passing after each change.

## Vercel Deployment

Recommended Vercel settings:

- Import GitHub repo
- Root Directory: `website`
- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Add environment variables in Vercel settings

To deploy latest changes:

```powershell
cd "D:\RP\AY 2026 Sem1\C240 AI Essentials and Innovations\FA"
git status
git add website/src/App.tsx website/index.html website/public/nourishlink-logo.png website/public/nourishlink-mark.png README.md
git commit -m "Update NourishLink project progress"
git push
```

Vercel should redeploy automatically after push.

## Important Design Decisions

- The website is the public showcase/admin dashboard.
- The mobile app emulator demonstrates what a real phone app could become.
- For the current FA project, the emulator is enough; a native mobile app is not required.
- Partner organisation accountability is more appropriate than tracking final beneficiary addresses.
- Partner organisations provide business value because the system can report:
  - number of partner orgs
  - verified volunteers
  - completed receipts
  - rescued units
  - operational accountability
- MCP is backend/AI-tool evidence, not the live website backend.

## MCP Meaning

File:

```text
backend/nourishlink_mcp.py
```

Meaning:

MCP is a controlled AI tool interface. It can expose safe actions such as checking surplus, dispatching drivers, and completing pickups. It is not the frontend backend, but it is useful as FA evidence for AI-assisted operations.

## Demo Seed Data

Files:

```text
backend/demo_seed_data.sql
backend/DEMO_DATA_README.md
```

Important:

- Demo data is synthetic.
- The SQL seed was fixed to avoid hardcoded `organization_id = 1`.
- It now looks up IDs by names to avoid foreign key errors.

## Current Known State

As of this README:

- Main dashboard UI is mostly complete.
- Mobile app emulator has role dashboards and history.
- Supabase integration is implemented.
- Botpress chatbot is integrated.
- Telegram dispatcher section is cleaned up.
- Header is responsive with burger menu on mobile.
- Logo assets are updated.
- Footer is added to both dashboard and app demo.
- `npm run lint` and `npm run build` were passing after the latest code changes.

## Suggested Next Steps

Good next tasks:

1. Add `website/vercel.json` with SPA rewrite if `/app` refresh fails on Vercel.
2. Review mobile phone emulator spacing after the new role dashboards.
3. Test actual Vercel deployment with Supabase env vars.
4. Confirm Botpress widget appears correctly on production.
5. Confirm Google Maps key restrictions after deployment.
6. Export n8n workflows into `n8n-workflows/` if needed for FA evidence.
7. Take final screenshots for presentation/report.

## Prompt For Future Codex Thread

Use this prompt if opening a new Codex project/thread:

```text
We are working on NourishLink, a C240 AI Essentials and Innovations final assessment project. Please read README.md first and treat it as project memory. The active project root is:

D:\RP\AY 2026 Sem1\C240 AI Essentials and Innovations\FA

The deploy-ready frontend is in:

D:\RP\AY 2026 Sem1\C240 AI Essentials and Innovations\FA\website

Main file:
website/src/App.tsx

The project is a React/Vite website with Supabase integration, Google Maps, Botpress FAQ widget, Telegram/n8n dispatcher section, and a mobile app emulator at /app.

Before changing anything, inspect the current files and preserve existing layout/design decisions. Use npm run lint and npm run build after changes.
```
