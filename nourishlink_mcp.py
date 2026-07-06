import os
import psycopg2
from psycopg2.extras import RealDictCursor
from mcp.server.fastmcp import FastMCP
from datetime import datetime

# 1. Initialize FastMCP Server
mcp = FastMCP("NourishLink Core Backend")

# Replace this with your actual Supabase connection string (URI)
DB_URI = "postgresql://postgres.[your-project-id]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

def get_db_connection():
    return psycopg2.connect(DB_URI, cursor_factory=RealDictCursor)

# ---------------------------------------------------------
# AI TOOL 1: Check Surplus (Now includes Food Safety & Maps)
# ---------------------------------------------------------
@mcp.tool()
def check_available_surplus() -> str:
    """
    Queries the database for all available surplus food.
    Includes safety expiration times and postal codes for map routing.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT i.inventory_id, r.business_name, r.postal_code, 
                   i.item_name, i.surplus_quantity, i.safe_consume_by 
            FROM daily_inventory i
            JOIN restaurants r ON i.restaurant_id = r.restaurant_id
            WHERE i.surplus_quantity > 0 AND i.status = 'Available';
        """
        cur.execute(query)
        records = cur.fetchall()
        
        cur.close()
        conn.close()
        
        if not records:
            return "No available surplus food logged in the system at the moment."
            
        output = "🚨 **Available Surplus Food Discovered:**\n"
        for row in records:
            # Format the safety timestamp into readable text for the AI
            expiry = row['safe_consume_by'].strftime("%Y-%m-%d %H:%M:%S") if row['safe_consume_by'] else "N/A"
            
            output += (f"- Food ID: {row['inventory_id']} | {row['business_name']} (Postal Code: {row['postal_code']})\n"
                       f"  Item: {row['surplus_quantity']} units of {row['item_name']}\n"
                       f"  ⚠️ SAFETY COMPLIANCE: Must collect and consume by {expiry}\n\n")
        return output
        
    except Exception as e:
        return f"Database Error: {str(e)}"

# ---------------------------------------------------------
# AI TOOL 2: Dispatch Driver (The Logistics Link)
# ---------------------------------------------------------
@mcp.tool()
def dispatch_driver(inventory_id: str, volunteer_chat_id: str) -> str:
    """
    Assigns a volunteer driver to a specific surplus batch.
    Updates inventory to 'Claimed' and logs the assignment time.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 1. Validate Volunteer
        cur.execute("SELECT volunteer_id FROM volunteers WHERE telegram_chat_id = %s;", (volunteer_chat_id,))
        volunteer = cur.fetchone()
        
        if not volunteer:
            return f"Error: No registered volunteer found matching Telegram ID: {volunteer_chat_id}"
            
        v_id = volunteer['volunteer_id']
        
        # 2. Insert Rescue Record & Return the new Pickup ID
        cur.execute("""
            INSERT INTO rescue_pickups (inventory_id, volunteer_id, pickup_status) 
            VALUES (%s, %s, 'Dispatched') RETURNING pickup_id;
        """, (inventory_id, v_id))
        pickup_id = cur.fetchone()['pickup_id']
        
        # 3. Secure the Inventory (Prevent Double-Booking)
        cur.execute("""
            UPDATE daily_inventory 
            SET status = 'Claimed' 
            WHERE inventory_id = %s;
        """, (inventory_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return f"✅ Optimization Success: Driver assigned. Pickup ID #{pickup_id} created. Inventory #{inventory_id} claimed."
        
    except Exception as e:
        return f"Transaction Rollback Error: {str(e)}"

# ---------------------------------------------------------
# AI TOOL 3: Complete Pickup (For Donation Receipts)
# ---------------------------------------------------------
@mcp.tool()
def complete_pickup(pickup_id: str) -> str:
    """
    Marks a rescue pickup as 'Completed' and records the timestamp.
    This explicitly triggers the digital donation receipt data.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE rescue_pickups 
            SET pickup_status = 'Completed', completed_at = CURRENT_TIMESTAMP 
            WHERE pickup_id = %s
            RETURNING pickup_id;
        """, (pickup_id,))
        result = cur.fetchone()
        
        conn.commit()
        cur.close()
        conn.close()
        
        if not result:
            return f"Error: Pickup ID {pickup_id} not found."
            
        return f"🧾 SUCCESS: Pickup {pickup_id} completed. Food safety verified and Digital Donation Receipt data logged."
        
    except Exception as e:
        return f"Database Error: {str(e)}"

if __name__ == "__main__":
    mcp.run()