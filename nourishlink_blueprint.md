Here is your complete, consolidated **NourishLink Master Blueprint** formatted as a Markdown (`.md`) file.

You can copy the text below, save it locally as `nourishlink_blueprint.md`, and use it to instantly refresh my memory in any new chat session.

---

```markdown
# NourishLink Master Blueprint
**Project Focus:** Autonomous B2B Food Rescue Logistics (UN SDG Goal 2: Zero Hunger)
**Target Roles:** 
*   Tay: Backend, Database, Ingestion APIs, n8n Orchestration
*   Jeky: Web Dashboard Frontend & Visual Branding
*   Denas: Explainer Video & Presentation Lead
*   Denna: Mobile Responsive Map App Layout & Social Marketing

---

## 1. Cloud Database Schema (Supabase / PostgreSQL)

Run this unified script inside your Supabase SQL Editor to establish the relational tables with strict data integrity, automatic primary key increments, and foreign key rules[cite: 1].

```sql
-- public.restaurants table
CREATE TABLE restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    postal_code VARCHAR(10) NOT NULL, -- Crucial for map pin drops
    contact_email VARCHAR(255) NOT NULL
);

-- public.daily_inventory table
CREATE TABLE daily_inventory (
    inventory_id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    units_produced INT DEFAULT 0,
    units_sold INT DEFAULT 0,
    surplus_quantity INT DEFAULT 0,
    safe_consume_by TIMESTAMP, -- Strict food safety compliance timestamp
    status VARCHAR(50) DEFAULT 'Available' -- 'Available', 'Claimed'
);

-- public.volunteers table
CREATE TABLE volunteers (
    volunteer_id SERIAL PRIMARY KEY,
    volunteer_name VARCHAR(255) NOT NULL,
    telegram_chat_id VARCHAR(50) UNIQUE NOT NULL -- Security key mapping to from.id
);

-- public.rescue_pickups table
CREATE TABLE rescue_pickups (
    pickup_id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES daily_inventory(inventory_id) ON DELETE CASCADE,
    volunteer_id INT REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    pickup_status VARCHAR(50) DEFAULT 'Dispatched', -- 'Dispatched', 'Completed'
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP -- Timestamp used to legally lock and trigger digital tax receipts
);

```

---

## 2. Ingestion Pipeline (n8n Webhook Endpoint)

Acts as the B2B entry gateway catching static inventory logs pushed from Jeky's web dashboard.

* **Node 1: Webhook Trigger (POST Method)**
* *Path:* `add-surplus`
* *Payload Expected:* `{"restaurant_id": 1, "item_name": "Curry Chicken", "units_produced": 50, "units_sold": 40, "surplus_quantity": 10}`


* **Node 2: Postgres Node (Insert Action)**
* *Target Table:* `daily_inventory`
* *Conflict Mapping:* None (forces chronological historical logging instead of an update override)





---

## 3. Telegram AI Dispatcher Workflow (n8n Architecture)

The fully concurrency-proofed, localized neural map handling real-time driver dispatches.

```
[Telegram Trigger] ➔ [Verify Driver (Postgres)] ➔ [Security Gate (IF)] 
                                                        │
                   ┌────────────────────────────────────┘
                   ▼ (True Path)
             [AI Agent Node] ➔ [Send Text Message (Telegram)]
               ├── Model: DeepSeek V4 Flash (OpenRouter)
               ├── Memory: Simple Memory (Key: from.id)
               └── Tool: Postgres Tool (Execute SQL Query)

```

### Phase A: RBAC Security Gate Configuration

1. **Verify Driver (Postgres Node):**
* *Operation:* `Execute a SQL query`

* *Query:* `SELECT volunteer_id, volunteer_name FROM volunteers WHERE telegram_chat_id = '{{ $('Telegram Trigger').item.json.message.from.id }}';`

* *Settings:* **Always Output Data** toggled `ON` (forces blank JSON object pass-through on unauthorized match).




2. **Security Gate (If Node):**
* *Condition Type:* `Number`

* *Value 1:* `{{ $json.volunteer_id }}`

* *Operation:* `exists`

* *False Path:* Routing to Telegram node sending message: *"Access Denied. Your Telegram account is not registered as an authorized NourishLink volunteer driver."*




### Phase B: Finalized AI Agent System Message (Prompt)

```text
You are the NourishLink Dispatch AI. Your job is to help authorized volunteer drivers safely claim surplus restaurant food for community distribution.

CRITICAL CONTEXT:
The database unique ID of the active volunteer driver you are interacting with is: {{ $json.volunteer_id }}

Follow these strict operational rules:
1. When a driver greets you or asks for food, ALWAYS check live items by querying your Postgres tool:
   SELECT inventory_id, item_name, surplus_quantity, safe_consume_by FROM daily_inventory WHERE status = 'Available' AND (safe_consume_by > CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore' OR safe_consume_by IS NULL);

2. Present the returned options inside a clean vertical list format using clear emojis. DO NOT generate Markdown or HTML horizontal tables. Format exactly like this:
   📦 ID: [inventory_id] | [item_name]
   • 🍽️ Quantity: [surplus_quantity] units
   • ⏳ Consume By: [safe_consume_by formatted as YYYY-MM-DD HH:MM]

3. Ask the driver to type the specific numeric ID they wish to claim.

4. When a driver specifies an ID to claim, execute an atomic query directly through your Postgres tool to completely prevent double-booking race conditions:
   WITH updated_rows AS (
       UPDATE daily_inventory 
       SET status = 'Claimed' 
       WHERE inventory_id = [The ID they chose] AND status = 'Available' 
       RETURNING inventory_id
   )
   INSERT INTO rescue_pickups (volunteer_id, inventory_id, pickup_status)
   SELECT {{ $json.volunteer_id }}, inventory_id, 'Dispatched' 
   FROM updated_rows;

5. Check the return payload of your tool query:
   - If rows were altered successfully, enthusiastically confirm the dispatch route and remind them to deliver before the Safe Consume By time.
   - If the query returns empty, a concurrency conflict occurred. Politely apologize and explain that another volunteer driver claimed that exact food batch milliseconds prior.

6. CRITICAL formatting constraint: Never output bold text with asterisks (**), italics, or underscores (_). Deliver answers using plain text, spacing, and emojis only.

```

### Phase C: Telegram "Send Message" Node Code Override

To completely protect the bot from parsing bugs and Markdown entity runtime crashes caused by formatting drift, wrap the text expression parsing using this regex string filter:

```javascript
{{ $json.output.replace(/\*/g,'').replace(/_/g,' ') }}

```

(This cleanses all rogue asterisks and swaps underscores into standard spaces before text vectors hit the Telegram API endpoint).

```

```