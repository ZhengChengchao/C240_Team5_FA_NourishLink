import { motion } from "motion/react";
import { Heart, Menu, X, LogOut, Award, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { User } from "../lib/authStore.ts";

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  currentUser?: User | null;
  onLogout?: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Navbar({ currentTab, setTab, currentUser, onLogout, theme, onToggleTheme }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", id: "home" },
    { name: "Give", id: "give" },
    ...(currentUser ? [] : [{ name: "Get Help", id: "get-help" }]),
    { name: "Our Impact", id: "impact" },
  ];

  return (
    <nav className="fixed w-full z-50 bg-warm-white/80 backdrop-blur-md border-b border-sdg-mustard/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab("home")}>
            <div className="w-10 h-10 bg-sdg-mustard rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-charcoal">
              NourishLink <span className="text-leaf-green">NGO</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`text-sm font-medium transition-colors hover:text-sdg-mustard relative py-2 ${
                  currentTab === item.id ? "text-leaf-green animate-pulse" : "text-charcoal/70"
                }`}
              >
                {item.name}
              </button>
            ))}
            
            {currentUser ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setTab("get-help")}
                  className="flex items-center gap-2.5 bg-white border border-charcoal/5 px-4 py-2 rounded-full text-xs font-bold hover:border-sdg-mustard/30 transition-all cursor-pointer"
                >
                  <img src={currentUser.avatar} alt="Profile" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  <span className="text-charcoal pr-1 max-w-[110px] truncate">{currentUser.name.split(" ")[0]}</span>
                </button>
                {onLogout && (
                  <button 
                    onClick={() => { onLogout(); setTab("home"); }}
                    title="Logout"
                    className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setTab("get-help")}
                className="bg-charcoal text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-sdg-mustard transition-all cursor-pointer animate-fade-in"
              >
                Partner Login / Sign Up
              </button>
            )}

            {/* Theme Toggle Button */}
            <button 
              onClick={onToggleTheme}
              className="p-2.5 rounded-full hover:bg-charcoal/5 border border-transparent hover:border-charcoal/10 text-charcoal/70 transition-all cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Toggle Theme"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} className="text-sdg-mustard" /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <button 
              onClick={onToggleTheme}
              className="p-2 rounded-full hover:bg-charcoal/5 text-charcoal/70 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Toggle Theme"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} className="text-sdg-mustard" /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-charcoal hover:text-sdg-mustard p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <motion.div
        initial={false}
        animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        className="md:hidden overflow-hidden bg-warm-white border-b border-sdg-mustard/10"
      >
        <div className="px-4 pt-2 pb-6 space-y-2 font-display">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-charcoal hover:bg-sdg-mustard/10 hover:text-sdg-mustard transition-colors"
            >
              {item.name}
            </button>
          ))}
          
          {currentUser ? (
            <div className="pt-4 border-t border-charcoal/5 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-bold text-sm text-charcoal">{currentUser.name}</p>
                  <p className="text-[10px] text-charcoal/40 uppercase tracking-wider">{currentUser.role}</p>
                </div>
              </div>
              <button 
                onClick={() => { onLogout?.(); setIsOpen(false); setTab("home"); }}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setTab("get-help");
                setIsOpen(false);
              }}
              className="w-full bg-charcoal text-white px-6 py-4 rounded-xl font-bold text-center active:scale-95 transition-transform cursor-pointer"
            >
              Partner Login / Sign Up
            </button>
          )}
        </div>
      </motion.div>
    </nav>
  );
}
