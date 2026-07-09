import { motion } from "motion/react";
import { MapPin, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { OrganizationInfo } from "../lib/authStore.ts";

interface OrgGridProps {
  onSelect: (org: OrganizationInfo) => void;
  organizationsList: OrganizationInfo[];
}

export default function OrgGrid({ onSelect, organizationsList }: OrgGridProps) {
  return (
    <section className="py-24 bg-white rounded-t-[40px] shadow-2xl overflow-hidden mt-[-40px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-charcoal">Active Food Requests</h2>
            <p className="text-gray-500 text-sm">{organizationsList.length} orphanages and shelters need support today.</p>
          </div>
          <div className="flex gap-2">
             {["Urgent", "Children's Homes", "Food Banks"].map((tag) => (
                <span key={tag} className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-sdg-mustard hover:text-white transition-colors">
                   {tag}
                </span>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {organizationsList.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`border rounded-3xl p-8 bg-warm-white transition-all group cursor-pointer ${
                org.progress < 30 ? "border-sdg-mustard ring-4 ring-sdg-mustard/5" : "border-gray-100"
              }`}
              onClick={() => onSelect(org)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                   {org.id % 4 === 1 ? "🏘️" : org.id % 4 === 2 ? "🥗" : org.id % 4 === 3 ? "🍼" : "🥘"}
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full ${
                  org.progress < 30 ? "text-red-500 bg-red-50 animate-pulse" : "text-leaf-green bg-leaf-green/10"
                }`}>
                  {org.progress < 30 ? "URGENT ⚠️" : "VERIFIED ✓"}
                </span>
              </div>

              <h3 className="font-bold text-xl mb-1 text-charcoal group-hover:text-sdg-mustard transition-colors">{org.name}</h3>
              <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                {org.description}
              </p>

              {org.contactPersonName && (
                <div className="space-y-1.5 mb-6 text-[11px] text-charcoal/70 bg-gray-100/40 p-3 rounded-2xl border border-charcoal/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-charcoal/40">Contact:</span>
                    <span className="font-bold text-charcoal">{org.contactPersonName}</span>
                  </div>
                  {org.websiteUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-charcoal/40">Website:</span>
                      <a 
                        href={org.websiteUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-leaf-green hover:underline font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {org.websiteUrl.replace("https://", "")}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-charcoal/40">
                  <span>Progress Goal</span>
                  <span className={org.progress < 30 ? "text-red-500" : "text-sdg-mustard"}>{org.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${org.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full ${org.progress < 30 ? "bg-red-500" : "bg-sdg-mustard"}`} 
                  />
                </div>
                <p className="text-[10px] text-gray-400 italic font-medium">Need: {org.need}</p>
              </div>

              <button className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
                org.progress < 30 
                  ? "bg-sdg-mustard text-white shadow-lg shadow-sdg-mustard/20" 
                  : "bg-white border border-leaf-green text-leaf-green hover:bg-leaf-green hover:text-white"
              }`}>
                {org.progress < 30 ? "Support Immediately" : "Give Support"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
