/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";

export type UserRole = "donor" | "organization";

export interface User {
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  orgId?: number; // Linked if organization
  badges?: string[];
  goalAmount?: number; // Donor personal monthly goal
}

export interface Donation {
  id: string;
  userEmail: string;
  orgId: number;
  orgName: string;
  date: string;
  type: "food" | "money";
  foodType?: string;
  quantity?: string;
  amount?: number;
  frequency?: "one-time" | "monthly";
  status: "Pending Verification" | "In Transit" | "Delivered" | "Processed";
}

export interface OrgRequest {
  id: string;
  orgId: number;
  title: string;
  quantity: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "open" | "fulfilled";
  createdAt: string;
}

export interface OrganizationInfo {
  id: number;
  name: string;
  type: string;
  location: string;
  description: string;
  need: string;
  progress: number;
  image: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  websiteUrl?: string;
}

// Initial default organizations matching OrgGrid.tsx
const DEFAULT_ORGANIZATIONS: OrganizationInfo[] = [
  {
    id: 1,
    name: "Hope Children's Home",
    type: "Orphanage",
    location: "Nairobi, Kenya",
    description: "Caring for 85 orphans with a focus on education and balanced nutrition.",
    need: "Fresh Vegetables & Soy Milk",
    progress: 65,
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=400&auto=format&fit=crop",
    contactPersonName: "Florence Kioko",
    contactPersonEmail: "florence@hopechildrenshome.org",
    websiteUrl: "https://hopechildrenshome.org",
  },
  {
    id: 2,
    name: "Metro Food Alliance",
    type: "Food Bank",
    location: "Chicago, USA",
    description: "Daily meal distribution for the city's unsheltered population.",
    need: "Dry Goods & Canned Protein",
    progress: 88,
    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=400&auto=format&fit=crop",
    contactPersonName: "David Vance",
    contactPersonEmail: "david@metrofoodalliance.org",
    websiteUrl: "https://metrofoodalliance.org",
  },
  {
    id: 3,
    name: "Golden Years Refuge",
    type: "Elderly Care",
    location: "Bangkok, Thailand",
    description: "Specialized nutritional care for abandoned elders in the community.",
    need: "Soft Foods & Supplements",
    progress: 42,
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=400&auto=format&fit=crop",
    contactPersonName: "Apinya Somsak",
    contactPersonEmail: "apinya@goldenyearsrefuge.org",
    websiteUrl: "https://goldenyearsrefuge.org",
  },
  {
    id: 4,
    name: "Sunrise Community Kitchen",
    type: "Public Kitchen",
    location: "London, UK",
    description: "Warm meals for low-income families and displaced people.",
    need: "Grains, Oil & Spices",
    progress: 20,
    image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=400&auto=format&fit=crop",
    contactPersonName: "Sarah Jenkins",
    contactPersonEmail: "sarah@sunrisekitchen.org",
    websiteUrl: "https://sunrisekitchen.org",
  },
];

// Initial default organization custom requests
const DEFAULT_REQUESTS: OrgRequest[] = [
  {
    id: "req-1",
    orgId: 1,
    title: "Fresh spinach & cabbage crates",
    quantity: "5 crates",
    urgency: "high",
    status: "open",
    createdAt: "2026-05-18",
  },
  {
    id: "req-2",
    orgId: 1,
    title: "Soy milk containers",
    quantity: "30 cartons",
    urgency: "medium",
    status: "open",
    createdAt: "2026-05-19",
  },
  {
    id: "req-3",
    orgId: 2,
    title: "Canned tuna/chicken boxes",
    quantity: "15 cartons",
    urgency: "critical",
    status: "open",
    createdAt: "2026-05-15",
  },
  {
    id: "req-4",
    orgId: 3,
    title: "Soft high-protein nutrition drinks",
    quantity: "100 packs",
    urgency: "critical",
    status: "open",
    createdAt: "2026-05-17",
  },
  {
    id: "req-5",
    orgId: 4,
    title: "Refined canola oil canisters",
    quantity: "10 canisters (5L)",
    urgency: "low",
    status: "open",
    createdAt: "2026-05-19",
  }
];

// Helper to load/save JSON from localStorage
const getLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
};

const setLocal = <T>(key: string, val: T): void => {
  localStorage.setItem(key, JSON.stringify(val));
};

export const useAuthManager = () => {
  // Database local states
  const [currentUser, setCurrentUser] = useState<User | null>(() => 
    getLocal<User | null>("nl_current_user", null)
  );

  const [organizations, setOrganizations] = useState<OrganizationInfo[]>(() => 
    getLocal<OrganizationInfo[]>("nl_organizations", DEFAULT_ORGANIZATIONS)
  );

  const [requests, setRequests] = useState<OrgRequest[]>(() => 
    getLocal<OrgRequest[]>("nl_org_requests", DEFAULT_REQUESTS)
  );

  const [donations, setDonations] = useState<Donation[]>(() => 
    getLocal<Donation[]>("nl_donations", [])
  );

  const [usersDb, setUsersDb] = useState<{ [email: string]: { password: string; user: User } }>(() => {
    const defaultDb = {
      "jekytan1602@gmail.com": {
        password: "password",
        user: {
          email: "jekytan1602@gmail.com",
          name: "Jeky Tan",
          role: "donor" as UserRole,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
          badges: ["Pioneer Giver", "Nourish Ambassador"],
          goalAmount: 200,
        }
      },
      "donor@nourish.com": {
        password: "password",
        user: {
          email: "donor@nourish.com",
          name: "Benevolent Donor",
          role: "donor" as UserRole,
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&auto=format&fit=crop",
          badges: ["Zero Hunger Champion"],
          goalAmount: 100,
        }
      },
      "hope@children.org": {
        password: "password",
        user: {
          email: "hope@children.org",
          name: "Hope Children's Home (Admin)",
          role: "organization" as UserRole,
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
          orgId: 1
        }
      },
      "metro@foodalliance.org": {
        password: "password",
        user: {
          email: "metro@foodalliance.org",
          name: "Metro Food Alliance",
          role: "organization" as UserRole,
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
          orgId: 2
        }
      },
      "sunrise@kitchen.org": {
        password: "password",
        user: {
          email: "sunrise@kitchen.org",
          name: "Sunrise Kitchen Coordinator",
          role: "organization" as UserRole,
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
          orgId: 4
        }
      }
    };
    return getLocal("nl_users_db", defaultDb);
  });

  // Keep localStorage synced
  useEffect(() => {
    setLocal("nl_current_user", currentUser);
  }, [currentUser]);

  useEffect(() => {
    setLocal("nl_organizations", organizations);
  }, [organizations]);

  useEffect(() => {
    setLocal("nl_org_requests", requests);
  }, [requests]);

  useEffect(() => {
    setLocal("nl_donations", donations);
  }, [donations]);

  useEffect(() => {
    setLocal("nl_users_db", usersDb);
  }, [usersDb]);

  // Auth API
  const login = (email: string, password_raw: string): { success: boolean; message: string } => {
    const formattedEmail = email.trim().toLowerCase();
    const entry = usersDb[formattedEmail];
    if (!entry) {
      return { success: false, message: "User not found. Register a new account below!" };
    }
    if (entry.password !== password_raw) {
      return { success: false, message: "Incorrect password pin." };
    }
    setCurrentUser(entry.user);
    return { success: true, message: "Successfully authenticated." };
  };

  const register = (
    email: string,
    password_raw: string,
    name: string,
    role: UserRole,
    orgNameIfNew?: string,
    orgTypeIfNew?: string
  ): { success: boolean; message: string } => {
    const formattedEmail = email.trim().toLowerCase();
    if (usersDb[formattedEmail]) {
      return { success: false, message: "A user with this email already exists." };
    }

    let linkedOrgId: number | undefined;

    if (role === "organization") {
      // Create a brand new Organization profile as well
      const newOrgId = Math.max(...organizations.map(o => o.id), 0) + 1;
      linkedOrgId = newOrgId;

      const newOrg: OrganizationInfo = {
        id: newOrgId,
        name: orgNameIfNew || `${name}'s Care Center`,
        type: orgTypeIfNew || "Community Center",
        location: "Local Chapter",
        description: "Verified community service provider catering to localized dietary support groups.",
        need: "Fresh Commodities & Spices",
        progress: 0,
        image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=400&auto=format&fit=crop",
        contactPersonName: name,
        contactPersonEmail: formattedEmail,
        websiteUrl: `https://${(orgNameIfNew || name).toLowerCase().replace(/[^a-z0-9]/g, "") || "carecenter"}.org`,
      };

      setOrganizations(prev => [...prev, newOrg]);
    }

    // Default avatars matching roles
    const avatar = role === "donor"
      ? `https://images.unsplash.com/photo-${Math.random() > 0.5 ? "1534528741775-53994a69daeb" : "1500648767791-00dcc994a43e"}?q=80&w=150&auto=format&fit=crop`
      : "https://images.unsplash.com/photo-1577563906417-007f17c72412?q=80&w=150&auto=format&fit=crop";

    const newUser: User = {
      email: formattedEmail,
      name,
      role,
      avatar,
      orgId: linkedOrgId,
      badges: role === "donor" ? ["First-Time Giver"] : undefined,
      goalAmount: role === "donor" ? 100 : undefined,
    };

    setUsersDb(prev => ({
      ...prev,
      [formattedEmail]: { password: password_raw, user: newUser }
    }));

    setCurrentUser(newUser);
    return { success: true, message: "Account created and logged in!" };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Donation Submission API
  const addDonation = (donationDetails: {
    orgName: string;
    type: "food" | "money";
    foodType?: string;
    quantity?: string;
    amount?: number;
    frequency?: "one-time" | "monthly";
  }) => {
    const matchingOrg = organizations.find(o => o.name === donationDetails.orgName);
    const orgId = matchingOrg ? matchingOrg.id : 1;

    const newDonation: Donation = {
      id: "don-" + Math.random().toString(36).substring(2, 9),
      userEmail: currentUser?.email || "anonymous@nourish.com",
      orgId,
      orgName: donationDetails.orgName,
      date: new Date().toISOString().split("T")[0],
      type: donationDetails.type,
      foodType: donationDetails.foodType,
      quantity: donationDetails.quantity,
      amount: donationDetails.amount,
      frequency: donationDetails.frequency,
      status: donationDetails.type === "money" ? "Processed" : "Pending Verification"
    };

    setDonations(prev => [newDonation, ...prev]);

    // Update Organization progress goals automatically!
    setOrganizations(prevOrgs => 
      prevOrgs.map(org => {
        if (org.id === orgId) {
          let progressBoost = 0;
          if (donationDetails.type === "money" && donationDetails.amount) {
            // Let's say $10 is 5% progress boost
            progressBoost = Math.ceil(donationDetails.amount * 0.5);
          } else if (donationDetails.type === "food" && donationDetails.quantity) {
            // Analyze weight approx, default 15% increase
            progressBoost = 15;
          }
          const nextProgress = Math.min(100, org.progress + progressBoost);
          return { ...org, progress: nextProgress };
        }
        return org;
      })
    );

    // Give some cool responsive achievements badges to simulated user if they do things!
    if (currentUser) {
      const userEmail = currentUser.email;
      const userDonations = [newDonation, ...donations].filter(d => d.userEmail === userEmail);
      const newBadges = [...(currentUser.badges || [])];

      if (userDonations.length >= 3 && !newBadges.includes("Regular Champion")) {
        newBadges.push("Regular Champion");
      }
      if (donationDetails.type === "money" && donationDetails.amount && donationDetails.amount >= 100 && !newBadges.includes("Generous Patron")) {
        newBadges.push("Generous Patron");
      }
      if (donationDetails.type === "food" && !newBadges.includes("Nutrition Architect")) {
        newBadges.push("Nutrition Architect");
      }

      // Sync active state and usersDb
      const updatedUser = { ...currentUser, badges: newBadges };
      setCurrentUser(updatedUser);
      setUsersDb(prev => ({
        ...prev,
        [userEmail]: {
          ...prev[userEmail],
          user: updatedUser
        }
      }));
    }
  };

  // Organization requests APIs
  const createRequest = (title: string, quantity: string, urgency: "low" | "medium" | "high" | "critical") => {
    if (!currentUser || currentUser.role !== "organization" || !currentUser.orgId) return;

    const newRequest: OrgRequest = {
      id: "req-" + Math.random().toString(36).substring(2, 9),
      orgId: currentUser.orgId,
      title,
      quantity,
      urgency,
      status: "open",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setRequests(prev => [newRequest, ...prev]);

    // Also update the organization's main current "need" text dynamically!
    setOrganizations(prevOrgs => 
      prevOrgs.map(org => {
        if (org.id === currentUser.orgId) {
          return { ...org, need: `${title} (${quantity})` };
        }
        return org;
      })
    );
  };

  const toggleRequestStatus = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => {
        if (req.id === requestId) {
          return { ...req, status: req.status === "open" ? "fulfilled" : "open" as any };
        }
        return req;
      })
    );
  };

  const deleteRequest = (requestId: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
  };

  // Update donor financial personal goal
  const updateGoal = (amount: number) => {
    if (!currentUser || currentUser.role !== "donor") return;
    const userEmail = currentUser.email;
    const updatedUser = { ...currentUser, goalAmount: amount };
    setCurrentUser(updatedUser);
    setUsersDb(prev => ({
      ...prev,
      [userEmail]: {
        ...prev[userEmail],
        user: updatedUser
      }
    }));
  };

  // Reset/update password for Forgot Password flow
  const resetPassword = (email: string, password_raw: string): { success: boolean; message: string } => {
    const formattedEmail = email.trim().toLowerCase();
    const entry = usersDb[formattedEmail];
    if (!entry) {
      return { success: false, message: "No registered account found with this email coordinates." };
    }
    setUsersDb(prev => ({
      ...prev,
      [formattedEmail]: {
        ...prev[formattedEmail],
        password: password_raw
      }
    }));
    return { success: true, message: "Your password space coordinates have been updated successfully!" };
  };

  return {
    currentUser,
    organizations,
    requests,
    donations,
    usersDb,
    login,
    register,
    logout,
    addDonation,
    createRequest,
    toggleRequestStatus,
    deleteRequest,
    updateGoal,
    resetPassword
  };
};
