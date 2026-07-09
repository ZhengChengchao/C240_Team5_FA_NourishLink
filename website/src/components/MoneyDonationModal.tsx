import { motion, AnimatePresence } from "motion/react";
import { X, DollarSign, CreditCard, Wallet, ChevronRight, ChevronLeft, Heart } from "lucide-react";
import React, { useState } from "react";

interface MoneyDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (details: { type: "money"; amount: number; frequency: string }) => void;
  orgName: string;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function MoneyDonationModal({ isOpen, onClose, onSuccess, orgName }: MoneyDonationModalProps) {
  const [step, setStep] = useState(1);
  const [frequency, setFrequency] = useState("one-time");
  const [amount, setAmount] = useState<string>("25");
  const [isCustomAmount, setIsCustomAmount] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      type: "money",
      amount: parseFloat(amount) || 0,
      frequency,
    });
    onClose();
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-warm-white">
          <div>
            <h3 className="text-2xl font-serif text-charcoal">Financial Gift</h3>
            <p className="text-xs text-charcoal/50 uppercase font-bold tracking-widest">Supporting {orgName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Frequency Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-2xl w-full">
                  <button 
                    onClick={() => setFrequency("one-time")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      frequency === "one-time" ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/70"
                    }`}
                  >
                    Give Once
                  </button>
                  <button 
                    onClick={() => setFrequency("monthly")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      frequency === "monthly" ? "bg-leaf-green text-white shadow-sm" : "text-charcoal/40 hover:text-charcoal/70"
                    }`}
                  >
                    Give Monthly
                  </button>
                </div>

                {/* Amount Selection */}
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/40 ml-1">Select Amount (USD)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => {
                          setAmount(amt.toString());
                          setIsCustomAmount(false);
                        }}
                        className={`py-4 rounded-xl font-display font-bold text-lg border-2 transition-all ${
                          !isCustomAmount && amount === amt.toString() 
                            ? "bg-sdg-mustard border-sdg-mustard text-white" 
                            : "bg-white border-charcoal/5 text-charcoal hover:border-sdg-mustard/30"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative mt-4">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={20} />
                    <input 
                      type="number"
                      placeholder="Custom Amount"
                      className={`w-full pl-12 pr-4 py-4 bg-warm-white border-2 rounded-2xl outline-none transition-all ${
                        isCustomAmount ? "border-sdg-mustard" : "border-charcoal/5"
                      }`}
                      onFocus={() => setIsCustomAmount(true)}
                      value={isCustomAmount ? amount : ""}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-leaf-green/5 p-6 rounded-2xl border border-leaf-green/10 flex items-center gap-4">
                   <div className="w-12 h-12 bg-leaf-green/10 rounded-full flex items-center justify-center text-leaf-green shrink-0">
                      <Heart className="fill-leaf-green" size={20} />
                   </div>
                   <p className="text-xs font-medium text-charcoal/70 leading-relaxed italic">
                      "A donation of ${amount || '0'} provides approximately {Math.max(1, Math.floor(Number(amount) / 2))} nutritionally balanced meals for {orgName}."
                   </p>
                </div>

                <button 
                  onClick={handleNext}
                  disabled={!amount || Number(amount) <= 0}
                  className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-sdg-mustard disabled:opacity-30 disabled:hover:bg-charcoal transition-all"
                >
                  Continue to Payment
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-warm-white p-6 rounded-3xl border border-charcoal/5 flex justify-between items-center mb-8">
                   <div>
                      <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Total Donation</p>
                      <p className="text-3xl font-display font-black text-charcoal">${amount} <span className="text-xs font-normal opacity-40">{frequency === "monthly" ? "/ monthly" : "once"}</span></p>
                   </div>
                   <button onClick={handleBack} className="text-sdg-mustard text-xs font-bold uppercase tracking-widest hover:underline">Change</button>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/40 ml-1">Payment Method</label>
                  <div className="space-y-3">
                    <button className="w-full p-5 rounded-2xl border-2 border-charcoal/5 flex items-center justify-between group hover:border-sdg-mustard transition-colors">
                      <div className="flex items-center gap-4">
                        <CreditCard className="text-charcoal/30 group-hover:text-sdg-mustard" />
                        <span className="font-bold">Credit or Debit Card</span>
                      </div>
                      <ChevronRight size={18} className="text-charcoal/20" />
                    </button>
                    <button className="w-full p-5 rounded-2xl border-2 border-charcoal/5 flex items-center justify-between group hover:border-blue-600 transition-colors">
                      <div className="flex items-center gap-4">
                        <Wallet className="text-charcoal/30 group-hover:text-blue-600" />
                        <span className="font-bold">PayPal</span>
                      </div>
                      <ChevronRight size={18} className="text-charcoal/20" />
                    </button>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <button 
                    onClick={handleSubmit}
                    className="w-full bg-leaf-green text-white py-5 rounded-2xl font-bold hover:bg-leaf-green/90 shadow-xl shadow-leaf-green/20 transition-all"
                  >
                    Complete Donation
                  </button>
                  <p className="text-[10px] text-center text-charcoal/30 font-bold uppercase tracking-widest px-8">
                    Your payment is secure and encrypted. Tax receipts will be sent to your email.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
