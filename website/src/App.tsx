import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  FileCheck2,
  Map,
  MapPin,
  Navigation,
  PackageCheck,
  Plus,
  Route,
  Search,
  Send,
  ShieldCheck,
  Truck,
  Utensils,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase.ts";

type InventoryStatus = "Available" | "Claimed";
type PickupStatus = "Dispatched" | "Completed";

interface Restaurant {
  restaurant_id: number;
  business_name: string;
  address: string;
  postal_code: string;
  contact_email: string;
}

interface DailyInventory {
  inventory_id: number;
  restaurant_id: number;
  item_name: string;
  units_produced: number;
  units_sold: number;
  surplus_quantity: number;
  safe_consume_by: string;
  status: InventoryStatus;
}

interface Volunteer {
  volunteer_id: number;
  volunteer_name: string;
  organization_id?: number | null;
  telegram_chat_id?: string;
}

interface PartnerOrganization {
  organization_id: number;
  organization_name: string;
  organization_type?: string | null;
  contact_email?: string | null;
  service_area?: string | null;
  verified_status?: string | null;
}

interface RescuePickup {
  pickup_id: number;
  inventory_id: number;
  volunteer_id: number;
  pickup_status: PickupStatus;
  assigned_at: string;
  completed_at?: string;
}

const WEBHOOK_URL = import.meta.env.VITE_N8N_ADD_SURPLUS_WEBHOOK as string | undefined;
const CHATBOT_WEBHOOK_URL = import.meta.env.VITE_N8N_CHATBOT_WEBHOOK as string | undefined;
const TELEGRAM_BOT_URL = import.meta.env.VITE_TELEGRAM_BOT_URL as string | undefined;
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

declare global {
  interface Window {
    google?: any;
    nourishLinkMapsPromise?: Promise<void>;
  }
}

const loadGoogleMaps = (apiKey: string) => {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (window.nourishLinkMapsPromise) {
    return window.nourishLinkMapsPromise;
  }

  window.nourishLinkMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  });

  return window.nourishLinkMapsPromise;
};

const fallbackCoordinates: Record<number, { lat: number; lng: number }> = {
  1: { lat: 1.2849, lng: 103.8332 },
  2: { lat: 1.2794, lng: 103.8547 },
  3: { lat: 1.3499, lng: 103.8738 },
};

const demoRestaurants: Restaurant[] = [
  {
    restaurant_id: 1,
    business_name: "Tiong Bahru Curry House",
    address: "56 Eng Hoon Street, Singapore",
    postal_code: "160056",
    contact_email: "ops@tiongbahrucurry.sg",
  },
  {
    restaurant_id: 2,
    business_name: "Marina Bento Lab",
    address: "8 Marina Boulevard, Singapore",
    postal_code: "018981",
    contact_email: "manager@marinabento.sg",
  },
  {
    restaurant_id: 3,
    business_name: "Serangoon Bakery Collective",
    address: "23 Serangoon Central, Singapore",
    postal_code: "556083",
    contact_email: "daily@serangoonbakery.sg",
  },
];

const volunteers: Volunteer[] = [
  {
    volunteer_id: 1,
    volunteer_name: "Aisha Rahman",
    organization_id: 1,
    telegram_chat_id: "87210451",
  },
  {
    volunteer_id: 2,
    volunteer_name: "Jeky Tan",
    organization_id: 2,
    telegram_chat_id: "91827433",
  },
];

const demoPartnerOrganizations: PartnerOrganization[] = [
  {
    organization_id: 1,
    organization_name: "Food from the Heart",
    organization_type: "Food Charity",
    contact_email: "ops@foodheart.example",
    service_area: "Central Singapore",
    verified_status: "Verified",
  },
  {
    organization_id: 2,
    organization_name: "NourishLink Volunteer Network",
    organization_type: "Community Partner",
    contact_email: "volunteers@nourishlink.example",
    service_area: "Islandwide",
    verified_status: "Verified",
  },
];

const initialInventory: DailyInventory[] = [
  {
    inventory_id: 101,
    restaurant_id: 1,
    item_name: "Curry chicken meal packs",
    units_produced: 90,
    units_sold: 62,
    surplus_quantity: 28,
    safe_consume_by: "2026-07-09T21:30",
    status: "Available",
  },
  {
    inventory_id: 102,
    restaurant_id: 2,
    item_name: "Salmon bento boxes",
    units_produced: 80,
    units_sold: 70,
    surplus_quantity: 10,
    safe_consume_by: "2026-07-09T20:45",
    status: "Available",
  },
  {
    inventory_id: 103,
    restaurant_id: 3,
    item_name: "Wholegrain bread loaves",
    units_produced: 120,
    units_sold: 84,
    surplus_quantity: 36,
    safe_consume_by: "2026-07-10T10:00",
    status: "Claimed",
  },
];

const initialPickups: RescuePickup[] = [
  {
    pickup_id: 501,
    inventory_id: 103,
    volunteer_id: 1,
    pickup_status: "Dispatched",
    assigned_at: "2026-07-09T17:20",
  },
];

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

const getRestaurant = (restaurantId: number) =>
  demoRestaurants.find((restaurant) => restaurant.restaurant_id === restaurantId) ?? demoRestaurants[0];

const findRestaurant = (restaurantList: Restaurant[], restaurantId: number) =>
  restaurantList.find((restaurant) => restaurant.restaurant_id === restaurantId) ?? demoRestaurants[0];

const findPartnerOrganization = (
  organizations: PartnerOrganization[],
  organizationId?: number | null
) => organizations.find((organization) => organization.organization_id === organizationId);

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

const denasQuickPrompts = [
  "How does NourishLink support SDG 2?",
  "What makes the food rescue workflow safe?",
  "How does volunteer RBAC work?",
  "What happens after a volunteer claims food?",
];

const getLocalDenasAnswer = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("sdg") || normalized.includes("zero hunger")) {
    return "NourishLink supports SDG 2 Zero Hunger by moving safe surplus meals from restaurants to community distribution before they expire. It reduces food waste while improving access to ready-to-eat food for people who need support.";
  }

  if (normalized.includes("safe") || normalized.includes("safety") || normalized.includes("consume")) {
    return "Food safety is handled through the safe_consume_by timestamp. The dispatcher only shows Available inventory that is still inside the safe consumption window, and volunteers are reminded to complete delivery before that time.";
  }

  if (normalized.includes("rbac") || normalized.includes("volunteer") || normalized.includes("access")) {
    return "Volunteer RBAC uses the volunteers table and telegram_chat_id as the security gate. n8n checks the sender ID before the AI dispatcher can query inventory or create rescue_pickups records.";
  }

  if (normalized.includes("claim") || normalized.includes("pickup") || normalized.includes("workflow")) {
    return "The workflow starts when a restaurant submits surplus. n8n inserts a daily_inventory row, the AI dispatcher lists safe Available batches, a verified volunteer claims one, and rescue_pickups records the dispatch and completion receipt.";
  }

  return "NourishLink is an autonomous B2B food rescue logistics concept. Restaurants log surplus, n8n and Supabase coordinate safe inventory, and verified volunteers claim pickups through a map-first workflow. Ask me about SDG 2, safety, RBAC, or the volunteer process.";
};

const extractChatbotAnswer = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return String(data.answer ?? data.output ?? data.message ?? data.text ?? JSON.stringify(data));
  }

  return response.text();
};

export default function App() {
  const [restaurantRecords, setRestaurantRecords] = useState<Restaurant[]>(demoRestaurants);
  const [partnerOrganizations, setPartnerOrganizations] = useState<PartnerOrganization[]>(demoPartnerOrganizations);
  const [volunteerRecords, setVolunteerRecords] = useState<Volunteer[]>(volunteers);
  const [inventory, setInventory] = useState<DailyInventory[]>(initialInventory);
  const [pickups, setPickups] = useState<RescuePickup[]>(initialPickups);
  const [activeVolunteerId, setActiveVolunteerId] = useState(2);
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [databaseMessage, setDatabaseMessage] = useState(
    isSupabaseConfigured ? "Connecting to Supabase..." : "Demo mode active. Add Supabase env variables to sync live data."
  );
  const [surplusSearch, setSurplusSearch] = useState("");
  const [formData, setFormData] = useState({
    restaurant_id: "1",
    item_name: "",
    units_produced: "50",
    units_sold: "40",
    safe_consume_by: "2026-07-09T22:00",
  });

  const availableInventory = inventory.filter((item) => item.status === "Available" && item.surplus_quantity > 0);
  const normalizedSurplusSearch = surplusSearch.trim().toLowerCase();
  const filteredAvailableInventory = availableInventory.filter((item) => {
    if (!normalizedSurplusSearch) return true;

    const restaurant = findRestaurant(restaurantRecords, item.restaurant_id);
    const searchableText = [
      item.inventory_id,
      item.item_name,
      item.surplus_quantity,
      item.units_produced,
      item.units_sold,
      item.safe_consume_by,
      formatDateTime(item.safe_consume_by),
      item.status,
      restaurant.business_name,
      restaurant.address,
      restaurant.postal_code,
      restaurant.contact_email,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSurplusSearch);
  });
  const activeVolunteer =
    volunteerRecords.find((volunteer) => volunteer.volunteer_id === activeVolunteerId) ?? volunteerRecords[0] ?? volunteers[0];
  const activePartnerOrganization = findPartnerOrganization(partnerOrganizations, activeVolunteer.organization_id);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    const loadSupabaseData = async () => {
      setDatabaseMessage("Loading live data from Supabase...");

      const [restaurantsResult, partnersResult, volunteersResult, inventoryResult, pickupsResult] = await Promise.all([
        supabase.from("restaurants").select("*").order("restaurant_id", { ascending: true }),
        supabase.from("partner_organizations").select("*").order("organization_id", { ascending: true }),
        supabase.from("volunteers").select("volunteer_id, volunteer_name, organization_id").order("volunteer_id", { ascending: true }),
        supabase.from("daily_inventory").select("*").order("inventory_id", { ascending: false }),
        supabase.from("rescue_pickups").select("*").order("pickup_id", { ascending: false }),
      ]);

      if (cancelled) return;

      if (restaurantsResult.error || partnersResult.error || volunteersResult.error || inventoryResult.error || pickupsResult.error) {
        const message =
          restaurantsResult.error?.message ??
          partnersResult.error?.message ??
          volunteersResult.error?.message ??
          inventoryResult.error?.message ??
          pickupsResult.error?.message;
        setDatabaseMessage(`Supabase read failed: ${message}. Demo data remains visible.`);
        return;
      }

      const loadedRestaurants = (restaurantsResult.data ?? []) as Restaurant[];
      const loadedPartners = (partnersResult.data ?? []) as PartnerOrganization[];
      const loadedVolunteers = (volunteersResult.data ?? []) as Volunteer[];
      setRestaurantRecords(loadedRestaurants.length ? loadedRestaurants : demoRestaurants);
      setPartnerOrganizations(loadedPartners.length ? loadedPartners : demoPartnerOrganizations);
      setVolunteerRecords(loadedVolunteers.length ? loadedVolunteers : volunteers);
      setInventory((inventoryResult.data ?? []) as DailyInventory[]);
      setPickups((pickupsResult.data ?? []) as RescuePickup[]);
      setDatabaseMessage("Supabase connected. Data is loaded and listening for realtime changes.");
    };

    void loadSupabaseData();

    const channel = supabase
      .channel("nourishlink-frontend-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurants" }, () => {
        void loadSupabaseData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_organizations" }, () => {
        void loadSupabaseData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_inventory" }, () => {
        void loadSupabaseData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteers" }, () => {
        void loadSupabaseData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rescue_pickups" }, () => {
        void loadSupabaseData();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setDatabaseMessage("Supabase connected. Realtime sync is active.");
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!restaurantRecords.some((restaurant) => String(restaurant.restaurant_id) === formData.restaurant_id)) {
      setFormData((current) => ({
        ...current,
        restaurant_id: String(restaurantRecords[0]?.restaurant_id ?? 1),
      }));
    }
  }, [formData.restaurant_id, restaurantRecords]);

  useEffect(() => {
    if (!volunteerRecords.some((volunteer) => volunteer.volunteer_id === activeVolunteerId)) {
      setActiveVolunteerId(volunteerRecords[0]?.volunteer_id ?? 1);
    }
  }, [activeVolunteerId, volunteerRecords]);

  const impact = useMemo(() => {
    const rescuedUnits = inventory
      .filter((item) => item.status === "Claimed")
      .reduce((total, item) => total + item.surplus_quantity, 0);
    const completedPickups = pickups.filter((pickup) => pickup.pickup_status === "Completed").length;
    const availableUnits = availableInventory.reduce((total, item) => total + item.surplus_quantity, 0);
    const partnerCount = partnerOrganizations.length;

    return { rescuedUnits, completedPickups, availableUnits, partnerCount };
  }, [availableInventory, inventory, partnerOrganizations.length, pickups]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSurplusSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const unitsProduced = Number(formData.units_produced);
    const unitsSold = Number(formData.units_sold);
    const surplusQuantity = Math.max(unitsProduced - unitsSold, 0);
    const payload = {
      restaurant_id: Number(formData.restaurant_id),
      item_name: formData.item_name.trim(),
      units_produced: unitsProduced,
      units_sold: unitsSold,
      surplus_quantity: surplusQuantity,
      safe_consume_by: formData.safe_consume_by,
    };

    if (!payload.item_name || surplusQuantity <= 0) {
      setSubmitState("error");
      setSubmitMessage("Enter a food item and make sure produced units are higher than sold units.");
      return;
    }

    setSubmitState("sending");
    setSubmitMessage(
      supabase
        ? "Saving surplus record to Supabase..."
        : WEBHOOK_URL
          ? "Sending surplus record to n8n..."
          : "Webhook not configured, saving to local demo state."
    );

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("daily_inventory")
          .insert({ ...payload, status: "Available" })
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setInventory((current) => [data as DailyInventory, ...current]);
        }
      } else if (WEBHOOK_URL) {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}`);
        }
      }

      if (!supabase) {
        const newItem: DailyInventory = {
          inventory_id: Math.max(...inventory.map((item) => item.inventory_id), 100) + 1,
          ...payload,
          status: "Available",
        };

        setInventory((current) => [newItem, ...current]);
      }

      setFormData((current) => ({ ...current, item_name: "", units_produced: "50", units_sold: "40" }));
      setSubmitState("success");
      setSubmitMessage(
        supabase
          ? "Surplus saved to Supabase. Realtime listeners will keep the dashboard synced."
          : WEBHOOK_URL
          ? "Surplus submitted to n8n and mirrored in the demo dashboard."
          : "Saved locally. Add VITE_N8N_ADD_SURPLUS_WEBHOOK to send this to your live workflow."
      );
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Unable to submit surplus record.");
    }
  };

  const claimInventory = async (inventoryId: number) => {
    const nextPickupId = Math.max(...pickups.map((pickup) => pickup.pickup_id), 500) + 1;

    if (supabase) {
      const { data: updatedRows, error: inventoryError } = await supabase
        .from("daily_inventory")
        .update({ status: "Claimed" })
        .eq("inventory_id", inventoryId)
        .eq("status", "Available")
        .select("*");

      if (inventoryError) {
        setDatabaseMessage(`Claim failed: ${inventoryError.message}`);
        return;
      }

      if (!updatedRows?.length) {
        setDatabaseMessage("Claim failed: this food batch may already be claimed.");
        return;
      }

      const { data: pickupData, error: pickupError } = await supabase
        .from("rescue_pickups")
        .insert({
          inventory_id: inventoryId,
          volunteer_id: activeVolunteerId,
          pickup_status: "Dispatched",
        })
        .select("*")
        .single();

      if (pickupError) {
        setDatabaseMessage(`Pickup creation failed: ${pickupError.message}`);
        return;
      }

      setInventory((current) =>
        current.map((item) => (item.inventory_id === inventoryId ? (updatedRows[0] as DailyInventory) : item))
      );
      if (pickupData) {
        setPickups((current) => [pickupData as RescuePickup, ...current]);
      }
      setDatabaseMessage("Pickup claimed in Supabase. Realtime sync is active.");
      return;
    }

    setInventory((current) =>
      current.map((item) => (item.inventory_id === inventoryId ? { ...item, status: "Claimed" } : item))
    );
    setPickups((current) => [
      {
        pickup_id: nextPickupId,
        inventory_id: inventoryId,
        volunteer_id: activeVolunteerId,
        pickup_status: "Dispatched",
        assigned_at: new Date().toISOString(),
      },
      ...current,
    ]);
  };

  const completePickup = async (pickupId: number) => {
    if (supabase) {
      const { data, error } = await supabase
        .from("rescue_pickups")
        .update({ pickup_status: "Completed", completed_at: new Date().toISOString() })
        .eq("pickup_id", pickupId)
        .select("*")
        .single();

      if (error) {
        setDatabaseMessage(`Completion failed: ${error.message}`);
        return;
      }

      setPickups((current) =>
        current.map((pickup) => (pickup.pickup_id === pickupId ? (data as RescuePickup) : pickup))
      );
      setDatabaseMessage("Pickup completed in Supabase. Digital receipt timestamp is logged.");
      return;
    }

    setPickups((current) =>
      current.map((pickup) =>
        pickup.pickup_id === pickupId
          ? { ...pickup, pickup_status: "Completed", completed_at: new Date().toISOString() }
          : pickup
      )
    );
  };

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#17211c]">
      <header className="border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f6f46] text-white">
              <Utensils size={21} />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight">NourishLink</p>
              <p className="text-xs font-bold uppercase tracking-widest text-black/45">B2B Food Rescue Logistics</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-bold text-black/60 md:flex">
            <a href="#surplus" className="hover:text-[#2f6f46]">Surplus</a>
            <a href="#map" className="hover:text-[#2f6f46]">Map</a>
            <a href="#workflow" className="hover:text-[#2f6f46]">AI Workflow</a>
            <a href="#dispatcher" className="hover:text-[#2f6f46]">Telegram</a>
          </nav>
        </div>
      </header>

      <section className="border-b border-black/10 bg-[#17211c] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-white/15 bg-white/8 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#f2c14e]">
              <ShieldCheck size={16} />
              SDG 2 Zero Hunger
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] tracking-normal sm:text-5xl lg:text-6xl">
              Rescue edible surplus before it becomes waste.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Restaurants submit end-of-day inventory, the AI dispatcher checks safe consumption windows, and registered
              volunteers claim nearby pickups through a map-first workflow.
            </p>
            <div className="mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-4">
              <MetricCard label="Available units" value={impact.availableUnits.toString()} tone="gold" />
              <MetricCard label="Units claimed" value={impact.rescuedUnits.toString()} tone="green" />
              <MetricCard label="Receipts locked" value={impact.completedPickups.toString()} tone="white" />
              <MetricCard label="Partner orgs" value={impact.partnerCount.toString()} tone="blue" />
            </div>
            <p className="mt-5 max-w-3xl rounded-lg border border-white/15 bg-white/8 px-4 py-3 text-sm text-white/65">
              {databaseMessage}
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/15 bg-white/8">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-sm font-bold">Live Operations Model</p>
              <p className="text-xs text-white/50">Aligned with your Supabase schema</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/10 text-sm">
              <SchemaTile icon={Building2} title="restaurants" detail="business_name, address, postal_code" />
              <SchemaTile icon={Database} title="daily_inventory" detail="surplus_quantity, safe_consume_by, status" />
              <SchemaTile icon={ShieldCheck} title="partner_organizations" detail="verified charity partners and service areas" />
              <SchemaTile icon={Truck} title="volunteers" detail="telegram_chat_id RBAC gate + organization_id" />
              <SchemaTile icon={FileCheck2} title="rescue_pickups" detail="Dispatched to Completed receipt trail" />
            </div>
          </div>
        </div>
      </section>

      <section id="surplus" className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <RestaurantSurplusForm
          formData={formData}
          submitState={submitState}
          submitMessage={submitMessage}
          restaurants={restaurantRecords}
          onChange={handleInputChange}
          onSubmit={handleSurplusSubmit}
        />

        <div className="space-y-4">
          <SectionHeader
            icon={PackageCheck}
            eyebrow="Volunteer app"
            title="Available surplus near you"
            detail="This list mirrors the query your Telegram AI dispatcher runs against daily_inventory."
          />
          <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3 rounded-md bg-[#f6f7f2] px-3 py-2">
              <Search size={18} className="shrink-0 text-black/35" />
              <input
                value={surplusSearch}
                onChange={(event) => setSurplusSearch(event.target.value)}
                placeholder="Search food, restaurant, postal code, safe consume by..."
                className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-[#17211c] outline-none placeholder:text-black/35"
              />
              {surplusSearch && (
                <button
                  type="button"
                  onClick={() => setSurplusSearch("")}
                  className="rounded-md px-2 py-1 text-xs font-bold text-black/45 hover:bg-white hover:text-[#2f6f46]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between px-1 text-xs font-bold uppercase tracking-widest text-black/40">
              <span>{filteredAvailableInventory.length} matching batches</span>
              <span>{availableInventory.length > 3 ? "Scroll list" : "Live list"}</span>
            </div>
          </div>
          <div className="grid max-h-[790px] gap-4 overflow-y-auto pr-2 [scrollbar-gutter:stable]">
            {filteredAvailableInventory.map((item) => (
              <InventoryCard
                key={item.inventory_id}
                item={item}
                restaurants={restaurantRecords}
                onClaim={claimInventory}
              />
            ))}
            {availableInventory.length === 0 && (
              <EmptyState title="No available surplus right now" detail="New restaurant submissions will appear here." />
            )}
            {availableInventory.length > 0 && filteredAvailableInventory.length === 0 && (
              <EmptyState title="No matching food found" detail="Try searching by food name, restaurant, postal code, quantity, or safe consume by time." />
            )}
          </div>
        </div>
      </section>

      <section id="map" className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <MapPanel googleMapsConfigured={Boolean(GOOGLE_MAPS_KEY)} inventory={inventory} restaurants={restaurantRecords} />

          <div className="space-y-4">
            <SectionHeader
              icon={Route}
              eyebrow="Driver state"
              title="Claimed pickups and receipts"
              detail={`Signed in as ${activeVolunteer.volunteer_name}${activePartnerOrganization ? ` from ${activePartnerOrganization.organization_name}` : ""}. RBAC still lives in n8n using telegram_chat_id.`}
            />
            <div className="flex gap-2 rounded-lg border border-black/10 bg-[#f6f7f2] p-2">
              {volunteerRecords.map((volunteer) => (
                <button
                  key={volunteer.volunteer_id}
                  onClick={() => setActiveVolunteerId(volunteer.volunteer_id)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition ${
                    activeVolunteerId === volunteer.volunteer_id
                      ? "bg-[#2f6f46] text-white"
                      : "text-black/55 hover:bg-white"
                  }`}
                >
                  <span className="block">{volunteer.volunteer_name}</span>
                  <span className="block text-[10px] font-bold opacity-60">
                    {findPartnerOrganization(partnerOrganizations, volunteer.organization_id)?.organization_name ?? "No partner linked"}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid gap-4">
              {pickups
                .filter((pickup) => pickup.volunteer_id === activeVolunteerId)
                .map((pickup) => (
                  <PickupCard
                    key={pickup.pickup_id}
                    pickup={pickup}
                    inventory={inventory}
                    restaurants={restaurantRecords}
                    volunteers={volunteerRecords}
                    partnerOrganizations={partnerOrganizations}
                    onComplete={completePickup}
                  />
                ))}
              {pickups.filter((pickup) => pickup.volunteer_id === activeVolunteerId).length === 0 && (
                <EmptyState title="No pickups assigned" detail="Claim an available batch to create a rescue_pickups row." />
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader
          icon={Bot}
          eyebrow="AI workflow"
          title="How the app connects to your backend"
          detail="The website showcases the product and sends restaurant surplus to n8n. The AI dispatcher handles authenticated volunteer decisions."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <WorkflowStep
            icon={Plus}
            title="1. Restaurant logs stock"
            detail="React form calculates surplus from produced minus sold units."
          />
          <WorkflowStep
            icon={Database}
            title="2. n8n inserts inventory"
            detail="POST /add-surplus writes to daily_inventory in Supabase."
          />
          <WorkflowStep
            icon={Bot}
            title="3. AI checks live food"
            detail="Telegram agent queries only Available and safe batches."
          />
          <WorkflowStep
            icon={FileCheck2}
            title="4. Delivery locks receipt"
            detail="Completed pickups stamp completed_at for proof of delivery."
          />
        </div>
      </section>

      <TelegramDispatcherSection />

      <DenasChatbot />
    </main>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "gold" | "green" | "white" | "blue" }) {
  const toneClass = {
    gold: "text-[#f2c14e]",
    green: "text-[#78c46a]",
    white: "text-white",
    blue: "text-[#77c8f2]",
  }[tone];

  return (
    <div className="rounded-lg border border-white/15 bg-white/8 p-4">
      <p className={`font-display text-3xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/45">{label}</p>
    </div>
  );
}

function SchemaTile({ icon: Icon, title, detail }: { icon: React.ElementType; title: string; detail: string }) {
  return (
    <div className="bg-[#17211c] p-5">
      <Icon className="mb-4 text-[#f2c14e]" size={22} />
      <p className="font-display font-bold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-white/50">{detail}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  detail,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2f6f46]">
        <Icon size={16} />
        {eyebrow}
      </div>
      <h2 className="text-3xl font-semibold tracking-normal text-[#17211c]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">{detail}</p>
    </div>
  );
}

function RestaurantSurplusForm({
  formData,
  submitState,
  submitMessage,
  restaurants,
  onChange,
  onSubmit,
}: {
  formData: {
    restaurant_id: string;
    item_name: string;
    units_produced: string;
    units_sold: string;
    safe_consume_by: string;
  };
  submitState: "idle" | "sending" | "success" | "error";
  submitMessage: string;
  restaurants: Restaurant[];
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const surplus = Math.max(Number(formData.units_produced) - Number(formData.units_sold), 0);

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <SectionHeader
        icon={Building2}
        eyebrow="Restaurant dashboard"
        title="Submit end-of-day surplus"
        detail="This payload is shaped for your n8n add-surplus webhook and daily_inventory table."
      />

      <div className="mt-6 grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-black/45">Restaurant</span>
          <select
            name="restaurant_id"
            value={formData.restaurant_id}
            onChange={onChange}
            className="w-full rounded-md border border-black/10 bg-[#f6f7f2] px-3 py-3 text-sm font-medium outline-none focus:border-[#2f6f46]"
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.restaurant_id} value={restaurant.restaurant_id}>
                {restaurant.business_name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-black/45">Food item</span>
          <input
            name="item_name"
            value={formData.item_name}
            onChange={onChange}
            placeholder="e.g. Curry Chicken"
            className="w-full rounded-md border border-black/10 bg-[#f6f7f2] px-3 py-3 text-sm font-medium outline-none focus:border-[#2f6f46]"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-black/45">Produced</span>
            <input
              name="units_produced"
              type="number"
              min="0"
              value={formData.units_produced}
              onChange={onChange}
              className="w-full rounded-md border border-black/10 bg-[#f6f7f2] px-3 py-3 text-sm font-medium outline-none focus:border-[#2f6f46]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-black/45">Sold</span>
            <input
              name="units_sold"
              type="number"
              min="0"
              value={formData.units_sold}
              onChange={onChange}
              className="w-full rounded-md border border-black/10 bg-[#f6f7f2] px-3 py-3 text-sm font-medium outline-none focus:border-[#2f6f46]"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-black/45">Safe consume by</span>
          <input
            name="safe_consume_by"
            type="datetime-local"
            value={formData.safe_consume_by}
            onChange={onChange}
            className="w-full rounded-md border border-black/10 bg-[#f6f7f2] px-3 py-3 text-sm font-medium outline-none focus:border-[#2f6f46]"
          />
        </label>
      </div>

      <div className="mt-5 rounded-lg border border-[#f2c14e]/40 bg-[#f2c14e]/12 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-black/45">Computed surplus quantity</p>
        <p className="mt-1 font-display text-4xl font-bold text-[#17211c]">{surplus} units</p>
      </div>

      <button
        type="submit"
        disabled={submitState === "sending"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#2f6f46] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#25583a] disabled:opacity-60"
      >
        <Plus size={17} />
        Submit surplus
      </button>

      {submitMessage && (
        <p
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            submitState === "error"
              ? "bg-red-50 text-red-700"
              : submitState === "success"
                ? "bg-green-50 text-green-700"
                : "bg-black/5 text-black/55"
          }`}
        >
          {submitMessage}
        </p>
      )}
    </form>
  );
}

function InventoryCard({
  item,
  restaurants,
  onClaim,
}: {
  item: DailyInventory;
  restaurants: Restaurant[];
  onClaim: (inventoryId: number) => void;
}) {
  const restaurant = findRestaurant(restaurants, item.restaurant_id);
  const routeUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.address} ${restaurant.postal_code}`
  )}`;

  return (
    <article className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#2f6f46]/10 px-2 py-1 text-xs font-bold text-[#2f6f46]">
              Food ID {item.inventory_id}
            </span>
            <span className="rounded-md bg-[#f2c14e]/20 px-2 py-1 text-xs font-bold text-[#8a650a]">
              {item.surplus_quantity} units
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-normal">{item.item_name}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-black/55">
            <MapPin size={15} />
            {restaurant.business_name}, {restaurant.postal_code}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-red-700">
            <AlertTriangle size={15} />
            Must collect and consume by {formatDateTime(item.safe_consume_by)}
          </p>
        </div>

        <div className="flex gap-2 sm:flex-col">
          <a
            href={routeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm font-bold text-black/65 hover:border-[#2f6f46] hover:text-[#2f6f46]"
          >
            <Navigation size={16} />
            Route
          </a>
          <button
            onClick={() => onClaim(item.inventory_id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#17211c] px-3 py-2 text-sm font-bold text-white hover:bg-[#2f6f46]"
          >
            <Truck size={16} />
            Claim
          </button>
        </div>
      </div>
    </article>
  );
}

function MapPanel({
  googleMapsConfigured,
  inventory,
  restaurants,
}: {
  googleMapsConfigured: boolean;
  inventory: DailyInventory[];
  restaurants: Restaurant[];
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">(
    googleMapsConfigured ? "loading" : "idle"
  );
  const [mapMessage, setMapMessage] = useState(
    googleMapsConfigured ? "Loading Google Maps..." : "Demo map shown until Google Maps API key is added"
  );

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return;

    let cancelled = false;

    const initialiseMap = async () => {
      try {
        setMapStatus("loading");
        setMapMessage("Loading Google Maps...");
        await loadGoogleMaps(GOOGLE_MAPS_KEY);

        if (cancelled || !mapRef.current || !window.google?.maps) return;

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 1.3038, lng: 103.8318 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });

        const bounds = new window.google.maps.LatLngBounds();
        const infoWindow = new window.google.maps.InfoWindow();
        const geocoder = new window.google.maps.Geocoder();

        restaurants.forEach((restaurant, index) => {
          const fallbackPosition = fallbackCoordinates[restaurant.restaurant_id] ?? {
            lat: 1.3038 + index * 0.012,
            lng: 103.8318 + index * 0.014,
          };
          const marker = new window.google.maps.Marker({
            map,
            position: fallbackPosition,
            title: restaurant.business_name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#2f6f46",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          bounds.extend(fallbackPosition);

          const restaurantInventory = inventory.filter(
            (item) => item.restaurant_id === restaurant.restaurant_id && item.status === "Available"
          );
          const inventorySummary = restaurantInventory.length
            ? restaurantInventory.map((item) => `${item.item_name}: ${item.surplus_quantity} units`).join("<br />")
            : "No available surplus in demo state";
          const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${restaurant.address} ${restaurant.postal_code}`
          )}`;

          marker.addListener("click", () => {
            infoWindow.setContent(`
              <div style="font-family: Inter, Arial, sans-serif; max-width: 230px;">
                <strong style="font-size: 14px;">${restaurant.business_name}</strong>
                <p style="margin: 6px 0; color: #4b5563;">${restaurant.address}<br />${restaurant.postal_code}</p>
                <p style="margin: 6px 0; color: #17211c;">${inventorySummary}</p>
                <a href="${routeUrl}" target="_blank" rel="noreferrer" style="color: #2f6f46; font-weight: 700;">Open route</a>
              </div>
            `);
            infoWindow.open({ anchor: marker, map });
          });

          geocoder.geocode(
            { address: `${restaurant.address} ${restaurant.postal_code} Singapore` },
            (results: any, status: string) => {
              if (cancelled || status !== "OK" || !results?.[0]?.geometry?.location) return;
              marker.setPosition(results[0].geometry.location);
              bounds.extend(results[0].geometry.location);
              map.fitBounds(bounds, 64);
            }
          );
        });

        map.fitBounds(bounds, 64);
        setMapStatus("ready");
        setMapMessage("Google Maps is connected. Restaurant pins are generated from address and postal code.");
      } catch (error) {
        setMapStatus("error");
        setMapMessage(error instanceof Error ? error.message : "Google Maps could not be loaded.");
      }
    };

    initialiseMap();

    return () => {
      cancelled = true;
    };
  }, [googleMapsConfigured, inventory]);

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-[#17211c] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="font-display text-lg font-bold">Surplus map handoff</p>
          <p className="text-xs text-white/50">
            {mapMessage}
          </p>
        </div>
        <Map className="text-[#f2c14e]" />
      </div>
      <div className="relative min-h-[420px] bg-[#20372b]">
        {googleMapsConfigured ? (
          <>
            <div ref={mapRef} className="absolute inset-0" />
            {mapStatus !== "ready" && (
              <div className="absolute left-5 top-5 rounded-lg border border-white/15 bg-black/45 px-4 py-3 text-sm font-bold backdrop-blur">
                {mapStatus === "error" ? "Map error" : "Loading map"}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px)] bg-[size:56px_56px]" />
            </div>
            {restaurants.map((restaurant, index) => (
              <div
                key={restaurant.restaurant_id}
                className="absolute rounded-lg border border-white/20 bg-white px-3 py-2 text-[#17211c] shadow-lg"
                style={{
                  left: `${18 + index * 24}%`,
                  top: `${54 - index * 15}%`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2f6f46] text-white">
                    <MapPin size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-bold">{restaurant.business_name}</p>
                    <p className="text-[11px] text-black/45">{restaurant.postal_code}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/15 bg-black/35 p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-bold">
                <ExternalLink size={16} />
                Google Maps integration plan
              </p>
              <p className="mt-2 text-xs leading-5 text-white/65">
                Add VITE_GOOGLE_MAPS_API_KEY to render live Google Maps pins. For production, store latitude and
                longitude in restaurants after the first geocode.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PickupCard({
  pickup,
  inventory,
  restaurants,
  volunteers,
  partnerOrganizations,
  onComplete,
}: {
  pickup: RescuePickup;
  inventory: DailyInventory[];
  restaurants: Restaurant[];
  volunteers: Volunteer[];
  partnerOrganizations: PartnerOrganization[];
  onComplete: (pickupId: number) => void;
}) {
  const item = inventory.find((inventoryItem) => inventoryItem.inventory_id === pickup.inventory_id);
  const restaurant = item ? findRestaurant(restaurants, item.restaurant_id) : restaurants[0] ?? demoRestaurants[0];
  const volunteer = volunteers.find((record) => record.volunteer_id === pickup.volunteer_id);
  const partnerOrganization = findPartnerOrganization(partnerOrganizations, volunteer?.organization_id);
  const isCompleted = pickup.pickup_status === "Completed";

  return (
    <article className="rounded-lg border border-black/10 bg-[#f6f7f2] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-black/8 px-2 py-1 text-xs font-bold">Pickup #{pickup.pickup_id}</span>
            <span
              className={`rounded-md px-2 py-1 text-xs font-bold ${
                isCompleted ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {pickup.pickup_status}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-normal">{item?.item_name ?? "Inventory batch"}</h3>
          <p className="mt-1 text-sm text-black/55">{restaurant.business_name}</p>
          <p className="mt-1 text-sm text-black/55">
            {volunteer?.volunteer_name ?? "Volunteer"}{partnerOrganization ? ` · ${partnerOrganization.organization_name}` : ""}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/40">
            <Clock3 size={14} />
            Assigned {formatDateTime(pickup.assigned_at)}
          </p>
        </div>
        <button
          onClick={() => onComplete(pickup.pickup_id)}
          disabled={isCompleted}
          className="flex items-center justify-center gap-2 rounded-md bg-[#2f6f46] px-4 py-3 text-sm font-bold text-white hover:bg-[#25583a] disabled:bg-black/15 disabled:text-black/40"
        >
          <CheckCircle2 size={17} />
          {isCompleted ? "Receipt logged" : "Complete delivery"}
        </button>
      </div>
    </article>
  );
}

function WorkflowStep({ icon: Icon, title, detail }: { icon: React.ElementType; title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-[#2f6f46]/10 text-[#2f6f46]">
        <Icon size={20} />
      </div>
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-black/55">{detail}</p>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 bg-white/60 p-8 text-center">
      <p className="font-display font-bold">{title}</p>
      <p className="mt-1 text-sm text-black/45">{detail}</p>
    </div>
  );
}

function TelegramDispatcherSection() {
  const dispatcherSteps = [
    {
      title: "Telegram Trigger",
      detail: "Volunteer messages the bot from Telegram. n8n receives the update event.",
    },
    {
      title: "RBAC verification",
      detail: "Postgres checks telegram_chat_id against the volunteers table before AI access is allowed.",
    },
    {
      title: "AI dispatch agent",
      detail: "The agent queries Available surplus and helps the driver claim safe food batches.",
    },
    {
      title: "Receipt completion",
      detail: "Delivery confirmation updates rescue_pickups to Completed and stamps completed_at.",
    },
  ];

  return (
    <section id="dispatcher" className="border-t border-black/10 bg-[#f6f7f2]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-lg border border-black/10 bg-[#17211c] p-6 text-white shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#2AABEE] text-white">
            <Send size={23} />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-normal">Telegram dispatcher bot</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            This is the secure volunteer operations channel. The website should open the Telegram bot, while n8n keeps
            the bot token, OpenRouter key, and Postgres credentials safely outside the frontend.
          </p>

          {TELEGRAM_BOT_URL ? (
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2AABEE] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1d97d6] sm:w-auto"
            >
              <Send size={17} />
              Open Telegram Dispatcher
            </a>
          ) : (
            <div className="mt-6 rounded-lg border border-[#f2c14e]/40 bg-[#f2c14e]/10 p-4">
              <p className="text-sm font-bold text-[#f2c14e]">Telegram URL not configured</p>
              <p className="mt-2 text-xs leading-5 text-white/65">
                Add VITE_TELEGRAM_BOT_URL to .env.local, for example https://t.me/your_bot_username?start=volunteer
              </p>
            </div>
          )}
        </div>

        <div>
          <SectionHeader
            icon={ShieldCheck}
            eyebrow="Secure volunteer channel"
            title="How the Telegram bot fits into the project"
            detail="Denas's FAQ chatbot answers public website questions. This Telegram bot is the authenticated dispatch channel for real pickup operations."
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {dispatcherSteps.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-[#2f6f46]">Step {index + 1}</p>
                <h3 className="mt-3 font-display text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/55">{step.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-black/10 bg-white p-5">
            <p className="font-display text-base font-bold">Recommended repo evidence</p>
            <p className="mt-2 text-sm leading-6 text-black/55">
              Export this n8n workflow and save it as n8n-workflows/telegram-dispatcher.json. Denas can export his FAQ
              chatbot separately as n8n-workflows/faq-chatbot.json.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DenasChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi, I am Denas. I can brief you on NourishLink, SDG 2, food safety, RBAC, the n8n workflow, and volunteer pickups.",
    },
  ]);
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<"idle" | "sending">("idle");

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || chatState === "sending") return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setChatState("sending");

    try {
      let answer = getLocalDenasAnswer(trimmedMessage);

      if (CHATBOT_WEBHOOK_URL) {
        const response = await fetch(CHATBOT_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmedMessage,
            history: nextMessages.map(({ role, content }) => ({ role, content })),
            assistant: "Denas",
            project: "NourishLink",
          }),
        });

        if (!response.ok) {
          throw new Error(`Chatbot webhook returned ${response.status}`);
        }

        const webhookAnswer = (await extractChatbotAnswer(response)).trim();
        if (webhookAnswer) {
          answer = webhookAnswer;
        }
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `${error instanceof Error ? error.message : "The chatbot webhook could not be reached."} Local answer: ${getLocalDenasAnswer(trimmedMessage)}`,
        },
      ]);
    } finally {
      setChatState("idle");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <section className="border-t border-black/10 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <div>
          <SectionHeader
            icon={Bot}
            eyebrow="Denas chatbot"
            title="Project FAQ assistant"
            detail={
              CHATBOT_WEBHOOK_URL
                ? "Connected to the dedicated n8n chatbot webhook."
                : "Local FAQ mode is active until VITE_N8N_CHATBOT_WEBHOOK is configured."
            }
          />
          <div className="mt-5 grid gap-2">
            {denasQuickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                disabled={chatState === "sending"}
                className="rounded-md border border-black/10 bg-[#f6f7f2] px-4 py-3 text-left text-sm font-bold text-black/65 transition hover:border-[#2f6f46] hover:text-[#2f6f46] disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-black/10 bg-[#17211c] text-white shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold">Denas</p>
              <p className="text-xs text-white/50">NourishLink FAQ, safety, RBAC, SDG 2</p>
            </div>
            <Bot className="text-[#f2c14e]" />
          </div>

          <div className="flex h-[390px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[86%] rounded-lg px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-[#f2c14e] text-[#17211c]"
                        : "bg-white/10 text-white/80"
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
              ))}
              {chatState === "sending" && (
                <div className="flex justify-start">
                  <p className="rounded-lg bg-white/10 px-4 py-3 text-sm font-bold text-white/55">Denas is thinking...</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/10 p-4">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about the project..."
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-white px-3 py-3 text-sm font-medium text-[#17211c] outline-none focus:border-[#f2c14e]"
              />
              <button
                type="submit"
                disabled={chatState === "sending" || !input.trim()}
                aria-label="Send chatbot message"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#2f6f46] text-white transition hover:bg-[#25583a] disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
