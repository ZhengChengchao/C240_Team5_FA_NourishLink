import { motion } from "motion/react";
import { ArrowRight, Utensils, HandHeart } from "lucide-react";

interface HeroProps {
  onDonate: () => void;
  onGetHelp: () => void;
}

export default function Hero({ onDonate, onGetHelp }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-sdg-mustard/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 -z-10 w-1/3 h-1/2 bg-leaf-green/5 blur-3xl rounded-full -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex items-center justify-between gap-16">
          <div className="lg:w-3/5 space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-sdg-mustard/10 text-sdg-mustard rounded-full text-[10px] font-bold uppercase tracking-wider mb-4"
            >
              <span className="w-2 h-2 bg-sdg-mustard rounded-full"></span>
              UN SDG 2: Zero Hunger Initiative
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl font-extrabold leading-[1.1] text-charcoal"
            >
              End Hunger Together.<br />
              <span className="text-leaf-green">Direct & Transparent.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start"
            >
              <button
                onClick={onDonate}
                className="px-8 py-4 bg-sdg-mustard hover:bg-sdg-mustard/90 text-white font-bold rounded-xl shadow-lg shadow-sdg-mustard/20 transition-all"
              >
                I Want to Donate
              </button>
              <button
                onClick={onGetHelp}
                className="px-8 py-4 border-2 border-charcoal text-charcoal font-bold rounded-xl hover:bg-charcoal hover:text-white transition-all"
              >
                Request Food for NGO
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:grid grid-cols-2 gap-4 w-96 shrink-0"
          >
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 font-semibold mb-1 uppercase tracking-widest">Meals Delivered</p>
              <p className="text-4xl font-black text-leaf-green">1.4M+</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 font-semibold mb-1 uppercase tracking-widest">Verified NGOs</p>
              <p className="text-4xl font-black text-sdg-mustard">482</p>
            </div>
            <div className="col-span-2 relative h-48 rounded-2xl overflow-hidden mt-4 group">
               <img 
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop" 
                alt="Community" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                 <p className="text-white text-xs font-bold uppercase tracking-widest">Transparency first</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
