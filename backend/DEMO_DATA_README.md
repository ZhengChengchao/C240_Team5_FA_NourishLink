# Demo Data Guide

Use `demo_seed_data.sql` for project demonstration only.

The data is synthetic and is designed to show:

- available surplus food
- claimed inventory
- completed pickups
- receipt logging
- verified partner organisations
- volunteers linked to organisations
- dashboard metrics in the website

## How to Run

1. Open Supabase.
2. Go to SQL Editor.
3. Open `backend/demo_seed_data.sql`.
4. Copy and run the SQL.
5. Refresh the website.

If `website/.env.local` contains Supabase URL and anon key, the website should load this data automatically.

The seed file looks up real `organization_id` and `restaurant_id` values by name before inserting volunteers and inventory. This avoids foreign-key errors when your serial IDs are not 1, 2, 3, and so on.

## Telegram Bot Testing

The demo volunteers use placeholder Telegram IDs:

```txt
demo-telegram-1001
demo-telegram-1002
demo-telegram-1003
demo-telegram-1004
demo-telegram-1005
```

For real Telegram bot testing, replace one row with your actual Telegram `message.from.id`.

Example:

```sql
UPDATE volunteers
SET telegram_chat_id = 'YOUR_REAL_TELEGRAM_FROM_ID'
WHERE volunteer_name = 'Zheng Chengchao';
```

## Why We Do Not Use Real Recipient Addresses

NourishLink tracks verified partner organisations and pickup completion, not final household or beneficiary addresses.

This gives enough accountability for restaurants and charities while reducing privacy risk.
