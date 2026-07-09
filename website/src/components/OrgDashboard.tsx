/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Building2, 
  MapPin, 
  Bell, 
  Plus, 
  Package, 
  DollarSign, 
  Check, 
  X, 
  AlertTriangle, 
  Calendar, 
  LogOut 
} from "lucide-react";
import { User, OrgRequest, Donation, OrganizationInfo } from "../lib/authStore.ts";

interface OrgDashboardProps {
  user: User;
  onLogout: () => void;
  requests: OrgRequest[];
  donations: Donation[];
  organizations: OrganizationInfo[];
  onCreateRequest: (title: string, quantity: string, urgency: "low" | "medium" | "high" | "critical") => void;
  onToggleRequestStatus: (id: string) => void;
  onDeleteRequest: (id: string) => void;
}

export default function OrgDashboard({
  user,
  onLogout,
  requests,
  donations,
  organizations,
  onCreateRequest,
  onToggleRequestStatus,
  onDeleteRequest
}: OrgDashboardProps) {
  // Find matching organization
  const matchingOrg = organizations.find(o => o.id === user.orgId);
  const orgName = matchingOrg?.name || "NourishLink Partner";
  const orgLocation = matchingOrg?.location || "Global Chapter";
  const orgType = matchingOrg?.type || "Support NGO";

  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqQty, setNewReqQty] = useState("");
  const [newReqUrgency, setNewReqUrgency] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter requests matching this NGO
  const myRequests = requests.filter(r => r.orgId === user.orgId);

  // Filter donations received by this organization
  const myDonationReceipts = donations.filter(d => d.orgId === user.orgId);

  // Stats
  const totalReceivedMoney = myDonationReceipts
    .filter(d => d.type === "money" && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const physicalShipmentCount = myDonationReceipts.filter(d => d.type === "food").length;

  const handlePublishRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReqTitle.trim() && newReqQty.trim()) {
      onCreateRequest(newReqTitle.trim(), newReqQty.trim(), newReqUrgency);
      setNewReqTitle("");
      setNewReqQty("");
      setNewReqUrgency("medium");
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Organization Header Banner */}
      <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-charcoal/5 shadow-xl md:flex items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sdg-mustard opacity-5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-24 h-24 bg-sdg-mustard/10 rounded-3xl flex items-center justify-center text-5xl">
            🏘️
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif text-charcoal">{orgName}</h1>
              <span className="px-3 py-1 bg-sdg-mustard/10 text-sdg-mustard text-[10px] font-extrabold uppercase tracking-wider rounded-full">
                {orgType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-charcoal/40 text-sm mt-2">
              <MapPin size={16} />
              <span>{orgLocation}</span>
              <span className="mx-2">•</span>
              <span>ID: NGO-00{user.orgId || 1}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex gap-4 relative z-10">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 border-2 border-charcoal/10 rounded-2xl text-charcoal hover:border-red-500 hover:text-red-500 text-sm font-bold transition-all"
          >
            <LogOut size={16} />
            Logout Coord
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-charcoal text-white rounded-[2.5rem] p-8 space-y-4 shadow-xl flex flex-col justify-between">
          <p className="text-xs uppercase font-extrabold tracking-wider text-white/40">Urgent Open Requests</p>
          <h2 className="text-6xl font-serif text-white">
            {myRequests.filter(r => r.status === "open").length}
          </h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-extrabold">Active listing live on public feeds</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-charcoal/5 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase font-extrabold tracking-wider text-charcoal/30">Total Funds Sponsored</p>
            <h3 className="text-6xl font-serif text-charcoal">${totalReceivedMoney}</h3>
          </div>
          <p className="text-[10px] text-charcoal/40 uppercase tracking-widest font-bold mt-4">Transferred immediately to core commissary</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-charcoal/5 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase font-extrabold tracking-wider text-charcoal/30">Physical Deliveries Fulfilled</p>
            <h3 className="text-6xl font-serif text-charcoal">{physicalShipmentCount}</h3>
          </div>
          <p className="text-[10px] text-charcoal/40 uppercase tracking-widest font-bold mt-4">Verified by logistics volunteers</p>
        </div>
      </div>

      {/* Main Grid: Management section vs Received items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Manage Requests Form/List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-3xl font-serif text-charcoal">Active Resource Requests</h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-charcoal text-white p-3 rounded-xl hover:bg-sdg-mustard transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <Plus size={16} />
              Add Request
            </button>
          </div>

          {showAddForm && (
            <form 
              onSubmit={handlePublishRequest}
              className="bg-white border-2 border-sdg-mustard/20 p-8 rounded-3xl space-y-4 shadow-lg"
            >
              <h4 className="text-lg font-bold text-charcoal font-serif">Post New Resource Requirement</h4>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Resource Name / Supply Details</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rice sacks or infant formula cans" 
                  value={newReqTitle}
                  onChange={(e) => setNewReqTitle(e.target.value)}
                  className="w-full bg-warm-white border border-charcoal/5 rounded-xl px-4 py-3 text-sm focus:border-sdg-mustard outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Target Quantity</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 50 kg or 10 crates" 
                    value={newReqQty}
                    onChange={(e) => setNewReqQty(e.target.value)}
                    className="w-full bg-warm-white border border-charcoal/5 rounded-xl px-4 py-3 text-sm focus:border-sdg-mustard outline-none transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Priority Index</label>
                  <select 
                    value={newReqUrgency}
                    onChange={(e) => setNewReqUrgency(e.target.value as any)}
                    className="w-full bg-warm-white border border-charcoal/5 rounded-xl px-4 py-3 text-sm focus:border-sdg-mustard outline-none transition-colors"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 hover:bg-gray-100 rounded-xl text-xs font-bold text-charcoal/60"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-leaf-green text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  Publish and Alert Donors
                </button>
              </div>
            </form>
          )}

          {myRequests.length === 0 ? (
            <div className="p-12 text-center bg-white border border-charcoal/5 rounded-[2.5rem] shadow-sm">
               <Package className="mx-auto text-charcoal/10 mb-4" size={48} />
               <p className="text-charcoal/50 font-serif text-lg">No resource requests currently active.</p>
               <p className="text-xs text-charcoal/30 mt-1">Publish items needed urgently for orphan nutrition, meal logistics, or commodities.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div 
                  key={req.id} 
                  className={`bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between gap-4 transition-all ${
                    req.status === "fulfilled" ? "opacity-60 border-gray-100" : "border-charcoal/5 hover:border-sdg-mustard/20"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${req.status === "fulfilled" ? "line-through text-charcoal/40" : "text-charcoal"}`}>
                        {req.title}
                      </p>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        req.urgency === "critical" ? "bg-red-100 text-red-600" :
                        req.urgency === "high" ? "bg-orange-100 text-orange-600" :
                        req.urgency === "medium" ? "bg-sdg-mustard/15 text-sdg-mustard" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {req.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/50">Requested count: <span className="font-bold">{req.quantity}</span></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onToggleRequestStatus(req.id)}
                      title={req.status === "fulfilled" ? "Mark as Open" : "Mark as Fulfilled"}
                      className={`p-2.5 rounded-xl transition-colors ${
                        req.status === "fulfilled" 
                          ? "bg-leaf-green text-white hover:bg-leaf-green/80" 
                          : "bg-gray-100 text-charcoal hover:bg-leaf-green/10 hover:text-leaf-green"
                      }`}
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteRequest(req.id)}
                      title="Delete requirement"
                      className="p-2.5 hover:bg-red-50 hover:text-red-500 text-charcoal/30 rounded-xl transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Donor Contributions Feed */}
        <div className="space-y-6">
          <h3 className="text-3xl font-serif text-charcoal">Fulfillments Received</h3>

          {myDonationReceipts.length === 0 ? (
            <div className="p-12 text-center bg-white border border-charcoal/5 rounded-[2.5rem] shadow-sm">
               <Bell className="mx-auto text-charcoal/10 mb-4 animate-bounce-slow" size={48} />
               <p className="text-charcoal/50 font-serif text-lg text-slate-400">No donor matches yet.</p>
               <p className="text-xs text-charcoal/30 mt-1">Incoming physical/monetary contributions sent by public donors will appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myDonationReceipts.map((d) => (
                <div 
                  key={d.id} 
                  className="bg-white p-6 rounded-3xl border border-charcoal/5 shadow-sm flex justify-between items-center hover:shadow-md transition-all"
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      d.type === "money" ? "bg-sdg-mustard/10 text-sdg-mustard" : "bg-leaf-green/10 text-leaf-green"
                    }`}>
                      {d.type === "money" ? <DollarSign size={20} /> : <Package size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-sm">Matching Match Receipt</p>
                        <span className="text-[8px] font-extrabold uppercase bg-gray-100 px-1.5 py-0.5 rounded text-charcoal/40 font-mono">
                          {d.id}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal/60 mt-1">
                        Anonymous Giver sponsored{" "}
                        {d.type === "money" 
                          ? <span className="font-bold text-sdg-mustard">${d.amount}</span> 
                          : <span className="font-bold text-leaf-green">{d.quantity} {d.foodType}</span>
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-charcoal/40">
                      <Calendar size={12} />
                      <span>{d.date}</span>
                    </div>
                    <span className="text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-leaf-green/10 text-leaf-green">
                      Success
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
