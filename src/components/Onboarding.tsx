import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Shield, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

interface OnboardingProps {
  onComplete: (user: User) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<User>>({
    id: Math.random().toString(36).substring(7),
    history_self_harm: false,
    history_panic: false,
    history_depression: false,
    history_crisis: false,
    consent_given: false,
  });

  const steps = [
    { title: "Welcome to MindBridge", description: "A safe space while you wait for your first appointment." },
    { title: "Safety First", description: "Important disclaimer and consent." },
    { title: "About You", description: "Let's get to know you a bit better." },
    { title: "Your Care", description: "Why are you seeking support?" },
    { title: "Health History", description: "This helps us provide better support." },
  ];

  const isStepValid = () => {
    if (step === 1) return formData.consent_given;
    if (step === 2) {
      return (
        formData.name?.trim() && 
        formData.preferred_name?.trim() && 
        formData.age_range && 
        formData.appointment_date
      );
    }
    if (step === 3) {
      return (
        formData.care_reason?.trim() && 
        formData.emergency_contact_name?.trim() && 
        formData.emergency_contact_phone?.trim()
      );
    }
    return true;
  };

  const handleNext = () => {
    if (!isStepValid()) return;
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      saveUser();
    }
  };

  const saveUser = async () => {
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onComplete(formData as User);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateField = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 overflow-hidden">
        <div className="h-2 bg-stone-100">
          <motion.div 
            className="h-full bg-emerald-600"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-stone-900 mb-2">{steps[step].title}</h2>
              <p className="text-stone-500 mb-8">{steps[step].description}</p>

              {step === 0 && (
                <div className="space-y-6 py-4">
                  <div className="flex items-center gap-4 text-stone-700">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                      <Heart className="w-6 h-6" />
                    </div>
                    <p className="font-medium">Emotional support when you need it most.</p>
                  </div>
                  <div className="flex items-center gap-4 text-stone-700">
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                      <Shield className="w-6 h-6" />
                    </div>
                    <p className="font-medium">Secure and private symptom tracking.</p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-bold mb-1">Medical Disclaimer</p>
                      <p>MindBridge is a support tool, NOT a replacement for professional medical care, diagnosis, or treatment. In an emergency, always call 911 or your local emergency services.</p>
                    </div>
                  </div>
                  
                  <label className="flex items-start gap-3 p-4 border border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-5 h-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                      checked={formData.consent_given}
                      onChange={(e) => updateField('consent_given', e.target.checked)}
                    />
                    <span className="text-sm text-stone-600">
                      I understand that MindBridge is not a clinical service and I consent to storing my data for the purpose of generating a clinician report.
                    </span>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      placeholder="Your name"
                      value={formData.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Preferred Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      placeholder="What should we call you?"
                      value={formData.preferred_name || ''}
                      onChange={(e) => updateField('preferred_name', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Age Range</label>
                      <select 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        value={formData.age_range || ''}
                        onChange={(e) => updateField('age_range', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="18-24">18-24</option>
                        <option value="25-34">25-34</option>
                        <option value="35-44">35-44</option>
                        <option value="45-54">45-54</option>
                        <option value="55+">55+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Appt Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        value={formData.appointment_date || ''}
                        onChange={(e) => updateField('appointment_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Reason for Care</label>
                    <textarea 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none h-32 resize-none"
                      placeholder="Briefly describe what you're experiencing..."
                      value={formData.care_reason || ''}
                      onChange={(e) => updateField('care_reason', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Emergency Contact</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="Name"
                        value={formData.emergency_contact_name || ''}
                        onChange={(e) => updateField('emergency_contact_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Contact Phone</label>
                      <input 
                        type="tel" 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="Phone"
                        value={formData.emergency_contact_phone || ''}
                        onChange={(e) => updateField('emergency_contact_phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-sm text-stone-500 mb-4">Have you ever experienced any of the following?</p>
                  {[
                    { id: 'history_depression', label: 'Severe Depression' },
                    { id: 'history_panic', label: 'Panic Attacks' },
                    { id: 'history_self_harm', label: 'Thoughts of Self-Harm' },
                    { id: 'history_crisis', label: 'Crisis Events' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateField(item.id as keyof User, !formData[item.id as keyof User])}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                        formData[item.id as keyof User] 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                          : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                      )}
                    >
                      <span className="font-medium">{item.label}</span>
                      {formData[item.id as keyof User] && <CheckCircle2 className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between">
            {step > 0 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="text-stone-400 font-semibold hover:text-stone-600 transition-colors"
              >
                Back
              </button>
            ) : <div />}
            
            <button 
              onClick={handleNext}
              disabled={!isStepValid()}
              className={cn(
                "bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95",
                !isStepValid() ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-700 shadow-lg shadow-emerald-100"
              )}
            >
              {step === steps.length - 1 ? "Get Started" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
