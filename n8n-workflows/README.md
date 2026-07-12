# NourishLink n8n Workflow Evidence

This folder stores evidence for the NourishLink n8n automation layer. The real n8n workflows keep private credentials inside n8n, while this repository records the workflow purpose, screenshots, and exported JSON files when available.

## Workflow 1: Restaurant Surplus Ingestion

n8n workflow name:

```text
C240 FA NourishLink Ingestion Webhook
```

Purpose:

- Receives restaurant surplus submissions from the website or demo form.
- Inserts the submitted surplus batch into the Supabase/Postgres `daily_inventory` table.
- Keeps the database write automation outside the public frontend when the n8n webhook is configured.

Flow:

```text
Webhook -> Postgres Insert rows in a table -> daily_inventory
```

Expected payload shape:

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

Frontend integration:

```text
VITE_N8N_ADD_SURPLUS_WEBHOOK
```

If this variable is configured, the website can send the restaurant surplus payload to n8n. If it is not configured, the frontend can still use the Supabase demo/live path depending on environment setup.

## Workflow 2: Telegram Volunteer Dispatcher

n8n workflow name:

```text
C240 FA NourishLink Telegram Bot
```

Purpose:

- Provides a secure volunteer dispatch channel through Telegram.
- Verifies the Telegram sender against the `volunteers.telegram_chat_id` field.
- Allows only registered volunteers to access pickup operations.
- Uses the workflow agent and SQL tool to query available surplus, support claim decisions, and reply through Telegram.

Flow:

```text
Telegram Trigger
  -> Verify Driver (Postgres query)
  -> If
      -> true: Workflow Agent
          -> OpenRouter Chat Model
          -> Conversation state node
          -> Postgres SQL Tool
          -> Send Telegram Message
      -> false: Access Denied Telegram Message
```

RBAC verification query:

```sql
SELECT volunteer_id, volunteer_name, organization_id
FROM volunteers
WHERE telegram_chat_id = '{{ $json.message.from.id }}';
```

Access denied response:

```text
Access denied. Your Telegram account is not registered as an authorized NourishLink volunteer.
```

## Evidence Files

Current screenshot evidence:

```text
screenshots/ingestion-webhook.png
screenshots/telegram-dispatcher.png
```

Recommended final export files:

```text
nourishlink-ingestion-webhook.json
nourishlink-telegram-dispatcher.json
```

The exported JSON files are not included yet unless they are exported from n8n. Do not create fake workflow JSON files. Before final submission, export each workflow from n8n and place the sanitized exports in this folder.

## How To Export From n8n

1. Open the workflow in n8n.
2. Use the workflow menu to download or export the workflow JSON.
3. Save the files as:
   - `nourishlink-ingestion-webhook.json`
   - `nourishlink-telegram-dispatcher.json`
4. Open the JSON files and check that no private secret values are included.
5. Commit only sanitized exports and screenshots.

## Secret Safety Checklist

Do not commit:

- Telegram bot token
- Postgres database URI
- Postgres password
- Supabase service role key
- Private model/API keys
- Any private webhook token

It is normally acceptable for exported n8n JSON to contain credential names or credential IDs, but not the actual secret values. If unsure, remove the credential object values before committing.

## Contribution Evidence

For the team report:

- Zheng Chengchao: n8n restaurant ingestion webhook and Telegram volunteer dispatcher workflow evidence.
- Denas Ho: Botpress public FAQ chatbot contribution.

This separation keeps the report accurate: Botpress supports public website FAQ questions, while n8n/Telegram supports authenticated volunteer operations.
