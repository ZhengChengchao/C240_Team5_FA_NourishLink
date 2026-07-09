import { Heart, Instagram, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="px-10 py-8 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-wrap justify-center md:justify-start gap-8 opacity-40">
          <span className="text-[10px] font-bold tracking-widest uppercase">UN Global Compact</span>
          <span className="text-[10px] font-bold tracking-widest uppercase font-sans">Verified by ImpactCheck</span>
          <span className="text-[10px] font-bold tracking-widest uppercase">Stripe Secure</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">© 2026 NourishLink Foundation. Together for SDG 2.</p>
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-charcoal/20">
                <Linkedin size={14} />
             </div>
             <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-charcoal/20">
                <Github size={14} />
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
