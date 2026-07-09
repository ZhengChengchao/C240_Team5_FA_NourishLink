import { motion, AnimatePresence } from "motion/react";
import { X, Apple, Package, Calendar, MapPin, Truck, ChevronRight, ChevronLeft } from "lucide-react";
import React, { useState } from "react";

interface FoodDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (details: { type: "food"; foodType: string; quantity: string }) => void;
  orgName: string;
}

export default function FoodDonationModal({ isOpen, onClose, onSuccess, orgName }: FoodDonationModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    foodType: "",
    quantity: "",
    method: "drop-off",
    address: "",
    date: "",
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      type: "food",
      foodType: formData.foodType,
      quantity: formData.quantity,
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
            <h3 className="text-2xl font-serif text-charcoal">Donate Food</h3>
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
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-charcoal/40 ml-1">What are you donating?</label>
                    <div className="relative">
                      <Apple className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={20} />
                      <input 
                        type="text" 
                        placeholder="e.g. 20kg Rice, Fresh Tomatoes"
                        className="w-full pl-12 pr-4 py-4 bg-warm-white border border-charcoal/5 rounded-2xl focus:border-sdg-mustard outline-none transition-colors"
                        value={formData.foodType}
                        onChange={(e) => setFormData({...formData, foodType: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-charcoal/40 ml-1">Quantity / Estimated Weight</label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={20} />
                      <input 
                        type="text" 
                        placeholder="e.g. 3 boxes, 50 lbs"
                        className="w-full pl-12 pr-4 py-4 bg-warm-white border border-charcoal/5 rounded-2xl focus:border-sdg-mustard outline-none transition-colors"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleNext}
                  disabled={!formData.foodType || !formData.quantity}
                  className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-sdg-mustard disabled:opacity-30 disabled:hover:bg-charcoal transition-all"
                >
                  Continue to Delivery
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
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormData({...formData, method: "drop-off"})}
                    className={`p-6 rounded-2xl border-2 transition-all text-left space-y-2 ${
                      formData.method === "drop-off" ? "border-leaf-green bg-leaf-green/5" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <MapPin className={formData.method === "drop-off" ? "text-leaf-green" : "text-charcoal/30"} size={24} />
                    <p className="font-bold">Self Drop-off</p>
                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-tight">Directly to the NGO</p>
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, method: "pickup"})}
                    className={`p-6 rounded-2xl border-2 transition-all text-left space-y-2 ${
                      formData.method === "pickup" ? "border-sdg-mustard bg-sdg-mustard/5" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <Truck className={formData.method === "pickup" ? "text-sdg-mustard" : "text-charcoal/30"} size={24} />
                    <p className="font-bold">Request Pickup</p>
                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-tight">Volunteer curated</p>
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-charcoal/40 ml-1">
                      {formData.method === "pickup" ? "Pickup Address" : "Estimated Arrival Date"}
                    </label>
                    <div className="relative">
                      {formData.method === "pickup" ? (
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={20} />
                      ) : (
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={20} />
                      )}
                      <input 
                        type={formData.method === "pickup" ? "text" : "date"}
                        placeholder={formData.method === "pickup" ? "Enter your full address" : ""}
                        className="w-full pl-12 pr-4 py-4 bg-warm-white border border-charcoal/5 rounded-2xl focus:border-sdg-mustard outline-none transition-colors"
                        value={formData.method === "pickup" ? formData.address : formData.date}
                        onChange={(e) => setFormData({...formData, [formData.method === "pickup" ? "address" : "date"]: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleBack}
                    className="p-5 border-2 border-charcoal/10 rounded-2xl text-charcoal hover:bg-gray-50 shrink-0"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={handleSubmit}
                    className="flex-1 bg-leaf-green text-white py-5 rounded-2xl font-bold hover:bg-leaf-green/90 shadow-xl shadow-leaf-green/20 transition-all"
                  >
                    Confirm Food Donation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
