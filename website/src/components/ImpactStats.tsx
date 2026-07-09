import { motion } from "motion/react";
import { Users, Truck, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

const stats = [
  { label: "Meals Delivered", value: 125430, icon: Truck, color: "text-sdg-mustard" },
  { label: "Organizations Assisted", value: 482, icon: Users, color: "text-leaf-green" },
  { label: "Funds Raised", value: 890500, icon: DollarSign, color: "text-blue-600", prefix: "$" },
];

function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalDuration = 2000;
    let incrementTime = (totalDuration / end) * 0.1;

    let timer = setInterval(() => {
      start += Math.ceil(end / 100);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
    </span>
  );
}

export default function ImpactStats() {
  return (
    <section className="py-20 bg-charcoal text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sdg-mustard rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-leaf-green rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif">Measuring Our Global Footprint</h2>
          <p className="text-white/60 max-w-2xl mx-auto font-sans">
            Every gram of food and every cent of donation is tracked. 
            Real-time data powered by trust and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors border border-white/10">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-5xl font-display font-bold tracking-tighter mb-2">
                <CountUp value={stat.value} prefix={stat.prefix} />+
              </p>
              <p className="text-white/50 uppercase tracking-widest text-xs font-bold">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
