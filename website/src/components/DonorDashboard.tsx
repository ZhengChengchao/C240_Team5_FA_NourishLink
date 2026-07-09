/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  Heart, 
  Award, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Plus, 
  DollarSign, 
  Package, 
  Edit3, 
  LogOut 
} from "lucide-react";
import { motion } from "motion/react";
import { User, Donation } from "../lib/authStore.ts";

interface DonorDashboardProps {
  user: User;
  onLogout: () => void;
  donations: Donation[];
  onUpdateGoal: (amount: number) => void;
}

export default function DonorDashboard({ user, onLogout, donations, onUpdateGoal }: DonorDashboardProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(user.goalAmount?.toString() || "100");

  // Filter donations made by this user
  const myDonations = donations.filter(d => d.userEmail === user.email);

  // Stats calculation
  const totalMoneyDonated = myDonations
    .filter(d => d.type === "money" && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const foodDonationsCount = myDonations.filter(d => d.type === "food").length;

  const currentMonthGoal = user.goalAmount || 100;
  const goalProgress = Math.min(100, Math.round((totalMoneyDonated / currentMonthGoal) * 100));

  const handleSaveGoal = () => {
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0) {
      onUpdateGoal(val);
      setIsEditingGoal(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header Profile Section */}
      <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-charcoal/5 shadow-xl md:flex items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-leaf-green opacity-5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative group">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-24 h-24 rounded-full object-cover border-4 border-leaf-green/20 group-hover:border-leaf-green transition-colors"
            />
            <div className="absolute -bottom-1 -right-1 bg-leaf-green text-white p-2 rounded-full shadow-lg">
              <Award size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif text-charcoal">{user.name}</h1>
              <span className="px-3 py-1 bg-leaf-green/10 text-leaf-green text-[10px] font-extrabold uppercase tracking-wider rounded-full">
                Donor Partner
              </span>
            </div>
            <p className="text-sm text-charcoal/40 mt-1">{user.email}</p>
            <p className="text-xs text-charcoal/60 mt-2 italic font-serif">
              “Nourishing the world, one meal at a time.”
            </p>
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex gap-4 relative z-10">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 border-2 border-charcoal/10 rounded-2xl text-charcoal hover:border-red-500 hover:text-red-500 text-sm font-bold transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Stats and Goal Setting Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Goal Card */}
        <div className="bg-charcoal text-white rounded-[2.5rem] p-8 space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs uppercase font-extrabold tracking-wider text-white/50">Monthly Goal Status</p>
              <button 
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="text-sdg-mustard hover:text-white transition-colors"
              >
                <Edit3 size={18} />
              </button>
            </div>

            {isEditingGoal ? (
              <div className="space-y-3">
                <div className="flex bg-white/10 rounded-xl p-1 items-center border border-white/10">
                  <span className="px-3 text-white/60 font-bold">$</span>
                  <input 
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-white py-2 font-display font-medium"
                    placeholder="100"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveGoal}
                    className="bg-leaf-green text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setIsEditingGoal(false)}
                    className="text-white/40 hover:text-white px-2 py-2 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <h2 className="text-5xl font-serif text-white">
                {goalProgress}% <span className="text-lg font-sans opacity-50 block mt-1">towards ${currentMonthGoal} goal</span>
              </h2>
            )}
          </div>

          <div className="space-y-2">
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sdg-mustard transition-all duration-1000"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-extrabold">
              Total Raised This Month: ${totalMoneyDonated} / ${currentMonthGoal}
            </p>
          </div>
        </div>

        {/* Financial Contribution Stat */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-charcoal/5 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sdg-mustard/10 flex items-center justify-center text-sdg-mustard">
              <DollarSign size={24} />
            </div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-charcoal/30">Total Financial Gift</p>
            <h3 className="text-6xl font-serif text-charcoal leading-none">${totalMoneyDonated}</h3>
          </div>
          <p className="text-xs text-charcoal/50 leading-relaxed font-serif mt-4">
            Directly translates to approximately <span className="font-bold text-leaf-green">{Math.ceil(totalMoneyDonated / 2)}</span> nutritious meals for children and elders.
          </p>
        </div>

        {/* Food Donated Quantity */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-charcoal/5 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-leaf-green/10 flex items-center justify-center text-leaf-green">
              <Package size={24} />
            </div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-charcoal/30">Food Deliveries Provided</p>
            <h3 className="text-6xl font-serif text-charcoal leading-none">{foodDonationsCount}</h3>
          </div>
          <p className="text-xs text-charcoal/50 leading-relaxed font-serif mt-4">
            Includes bulk grain sacks, fresh green crates, and protein canisters sent directly via logistics matching.
          </p>
        </div>
      </div>

      {/* Gamification: Earned Badges Section */}
      <div className="bg-warm-white rounded-[3rem] p-8 md:p-12 border border-charcoal/5">
        <h3 className="text-3xl font-serif text-charcoal mb-6">Your Zero Hunger Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            {
              name: "Pioneer Giver",
              desc: "Joined NourishLink SDG quest on day one.",
              color: "bg-red-500/10 text-red-600 border-red-500/20",
              emoji: "🏅",
              unlocked: user.badges?.includes("Pioneer Giver") || false
            },
            {
              name: "Nourish Ambassador",
              desc: "Advocated for critical logistics routes.",
              color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
              emoji: "🌍",
              unlocked: user.badges?.includes("Nourish Ambassador") || false
            },
            {
              name: "Zero Hunger Champion",
              desc: "Achieved when individual donations exceed $50.",
              color: "bg-sdg-mustard/10 text-sdg-mustard border-sdg-mustard/20",
              emoji: "👑",
              unlocked: user.badges?.includes("Zero Hunger Champion") || totalMoneyDonated >= 50
            },
            {
              name: "Nutrition Architect",
              desc: "Donated bulk physical perishables or vitamins.",
              color: "bg-leaf-green/10 text-leaf-green border-leaf-green/20",
              emoji: "🥬",
              unlocked: user.badges?.includes("Nutrition Architect") || foodDonationsCount > 0
            }
          ].map((b, idx) => (
            <div 
              key={idx} 
              className={`p-6 rounded-3xl border text-center transition-all flex flex-col items-center gap-3 relative ${
                b.unlocked 
                  ? "bg-white border-charcoal/10 shadow-md transform hover:-translate-y-1" 
                  : "bg-gray-100/50 border-gray-100 opacity-40 select-none"
              }`}
            >
              <div className="text-5xl">{b.unlocked ? b.emoji : "🔒"}</div>
              <div>
                <p className="font-bold text-sm text-charcoal">{b.name}</p>
                <p className="text-[10px] text-charcoal/50 mt-1 max-w-[120px] mx-auto leading-normal">{b.desc}</p>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mt-2 ${
                b.unlocked ? "bg-leaf-green/10 text-leaf-green" : "bg-gray-200 text-gray-400"
              }`}>
                {b.unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* History Ledger List */}
      <div className="space-y-6">
        <h3 className="text-3xl font-serif text-charcoal">Your Donation History</h3>
        
        {myDonations.length === 0 ? (
          <div className="p-12 text-center bg-white border border-charcoal/5 rounded-[2.5rem] shadow-sm">
             <Heart className="mx-auto text-charcoal/10 mb-4" size={48} />
             <p className="text-charcoal/50 font-serif text-lg">You haven't made any contributions yet.</p>
             <p className="text-xs text-charcoal/30 mt-1">Select an active organization on the grid below to ignite your tracker!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myDonations.map((d) => (
              <div 
                key={d.id} 
                className="bg-white p-6 rounded-3xl border border-charcoal/5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    d.type === "money" ? "bg-sdg-mustard/10 text-sdg-mustard" : "bg-leaf-green/10 text-leaf-green"
                  }`}>
                    {d.type === "money" ? <DollarSign size={20} /> : <Package size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800">{d.orgName}</p>
                      <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        d.type === "money" ? "bg-sdg-mustard/10 text-sdg-mustard" : "bg-leaf-green/10 text-leaf-green"
                      }`}>
                        {d.type === "money" ? "financial" : "physical cargo"}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/50 mt-1">
                      {d.type === "money" 
                        ? `Donated $${d.amount} (${d.frequency || "one-time"})` 
                        : `Sponsorship of ${d.quantity} ${d.foodType}`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-charcoal/40">
                    <Calendar size={12} />
                    <span>{d.date}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mt-1 ${
                    d.status === "Processed" || d.status === "Delivered"
                      ? "bg-leaf-green/10 text-leaf-green"
                      : "bg-blue-50 text-blue-500 animate-pulse"
                  }`}>
                    {d.status === "Processed" || d.status === "Delivered" ? (
                      <>
                        <CheckCircle size={10} />
                        Completed
                      </>
                    ) : (
                      <>
                        <Clock size={10} />
                        In Delivery
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
