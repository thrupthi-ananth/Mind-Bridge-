import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Smile, 
  Frown, 
  Meh, 
  Moon, 
  Zap, 
  Utensils, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { User, CheckIn } from '../types';
import { cn, calculateRiskScore } from '../lib/utils';
import { analyzeJournal } from '../services/gemini';
import { SUPPORTIVE_MESSAGES, getRandomMessage } from '../lib/messages';

interface CheckInFormProps {
  user: User;
  onComplete: () => void;
  onCancel: () => void;
}

const getMoodFeedback = (mood: number) => {
  if (mood >= 8) return { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: <Smile className="w-10 h-10" />, label: 'Radiant' };
  if (mood >= 6) return { color: 'text-blue-600', bg: 'bg-blue-100', icon: <Smile className="w-10 h-10" />, label: 'Steady' };
  if (mood >= 4) return { color: 'text-amber-600', bg: 'bg-amber-100', icon: <Meh className="w-10 h-10" />, label: 'Balanced' };
  return { color: 'text-rose-600', bg: 'bg-rose-100', icon: <Frown className="w-10 h-10" />, label: 'Heavy' };
};

export default function CheckInForm({ user, onComplete, onCancel }: CheckInFormProps) {
  const [step, setStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [supportiveMessage] = useState(() => getRandomMessage(SUPPORTIVE_MESSAGES));
  const [formData, setFormData] = useState<Partial<CheckIn>>({
    user_id: user.id,
    mood: 5,
    anxiety: 5,
    stress: 5,
    sleep_duration: 7,
    sleep_quality: 5,
    energy: 5,
    appetite: 5,
    social_withdrawal: 1,
    panic_symptoms: 0,
    hopelessness: 0,
    self_harm_ideation: 0,
    journal_text: '',
  });

  const steps = [
    { title: "How's your mood?", icon: <Smile className="w-6 h-6" /> },
    { title: "Anxiety & Stress", icon: <AlertCircle className="w-6 h-6" /> },
    { title: "Sleep & Energy", icon: <Moon className="w-6 h-6" /> },
    { title: "Daily Life", icon: <Users className="w-6 h-6" /> },
    { title: "Safety Check", icon: <CheckCircle2 className="w-6 h-6" /> },
    { title: "Journal", icon: <X className="w-6 h-6" /> },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      submitCheckIn();
    }
  };

  const submitCheckIn = async () => {
    setIsAnalyzing(true);
    const riskScore = calculateRiskScore(formData);
    
    let sentiment = '';
    let themes = '[]';

    if (formData.journal_text && formData.journal_text.trim().length > 10) {
      try {
        const analysis = await analyzeJournal(formData.journal_text);
        sentiment = analysis.sentiment;
        themes = JSON.stringify(analysis.themes);
      } catch (err) {
        console.error("AI Analysis failed:", err);
      }
    }

    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          risk_score: riskScore,
          sentiment,
          themes
        }),
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateField = (field: keyof CheckIn, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-600">
          <X className="w-5 h-5" />
        </button>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 w-6 rounded-full transition-all",
                i === step ? "bg-emerald-600 w-10" : i < step ? "bg-emerald-200" : "bg-stone-100"
              )} 
            />
          ))}
        </div>
        <div className="w-9" />
      </div>

      <div className="p-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 relative z-10"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg",
                  getMoodFeedback(formData.mood || 5).bg,
                  getMoodFeedback(formData.mood || 5).color
                )}
              >
                {getMoodFeedback(formData.mood || 5).icon}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Check-in Complete</h2>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className={cn("text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full", getMoodFeedback(formData.mood || 5).bg, getMoodFeedback(formData.mood || 5).color)}>
                    Mood: {getMoodFeedback(formData.mood || 5).label} ({formData.mood})
                  </span>
                </div>
                <p className="text-stone-600 text-lg max-w-xs mx-auto leading-relaxed italic">
                  "{supportiveMessage}"
                </p>
              </motion.div>

              {/* Background Decoration */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.05 }}
                className={cn("absolute inset-0 -z-10 rounded-full blur-3xl", getMoodFeedback(formData.mood || 5).bg)}
                style={{ transform: 'scale(2)' }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-stone-900 mb-8">{steps[step].title}</h2>

              {step === 0 && (
              <div className="space-y-8">
                <div className="flex justify-between items-center px-2">
                  <Frown className="w-8 h-8 text-stone-300" />
                  <Meh className="w-8 h-8 text-stone-300" />
                  <Smile className="w-8 h-8 text-emerald-500" />
                </div>
                <input 
                  type="range" min="1" max="10" step="1"
                  className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  value={formData.mood}
                  onChange={(e) => updateField('mood', parseInt(e.target.value))}
                />
                <div className="text-center">
                  <span className="text-5xl font-black text-emerald-600">{formData.mood}</span>
                  <p className="text-stone-400 text-sm mt-2 font-medium uppercase tracking-widest">Mood Score</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Anxiety Level</label>
                  <input 
                    type="range" min="1" max="10" step="1"
                    className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    value={formData.anxiety}
                    onChange={(e) => updateField('anxiety', parseInt(e.target.value))}
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-stone-400">
                    <span>CALM</span>
                    <span>VERY ANXIOUS</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Stress Level</label>
                  <input 
                    type="range" min="1" max="10" step="1"
                    className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    value={formData.stress}
                    onChange={(e) => updateField('stress', parseInt(e.target.value))}
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-stone-400">
                    <span>RELAXED</span>
                    <span>OVERWHELMED</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <Moon className="w-5 h-5 text-blue-600 mb-2" />
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Sleep (Hrs)</label>
                    <input 
                      type="number" 
                      className="w-full bg-transparent text-2xl font-bold outline-none"
                      value={formData.sleep_duration}
                      onChange={(e) => updateField('sleep_duration', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <Zap className="w-5 h-5 text-yellow-600 mb-2" />
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Energy</label>
                    <input 
                      type="number" min="1" max="10"
                      className="w-full bg-transparent text-2xl font-bold outline-none"
                      value={formData.energy}
                      onChange={(e) => updateField('energy', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Sleep Quality</label>
                  <input 
                    type="range" min="1" max="10" step="1"
                    className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    value={formData.sleep_quality}
                    onChange={(e) => updateField('sleep_quality', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Social Withdrawal</label>
                  <input 
                    type="range" min="1" max="10" step="1"
                    className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    value={formData.social_withdrawal}
                    onChange={(e) => updateField('social_withdrawal', parseInt(e.target.value))}
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-stone-400">
                    <span>SOCIAL</span>
                    <span>ISOLATED</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Appetite Changes</label>
                  <input 
                    type="range" min="1" max="10" step="1"
                    className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    value={formData.appetite}
                    onChange={(e) => updateField('appetite', parseInt(e.target.value))}
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-stone-400">
                    <span>NORMAL</span>
                    <span>SIGNIFICANT CHANGE</span>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-4">
                  <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">Important</p>
                  <p className="text-sm text-red-800">Please be honest. This information is private and helps detect if you need urgent help.</p>
                </div>
                
                {[
                  { id: 'panic_symptoms', label: 'Panic Symptoms', color: 'accent-orange-500' },
                  { id: 'hopelessness', label: 'Feelings of Hopelessness', color: 'accent-stone-700' },
                  { id: 'self_harm_ideation', label: 'Thoughts of Self-Harm', color: 'accent-red-600' },
                ].map((item) => (
                  <div key={item.id}>
                    <label className="block text-sm font-bold text-stone-700 mb-3">{item.label}</label>
                    <input 
                      type="range" min="0" max="10" step="1"
                      className={cn("w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer", item.color)}
                      value={formData[item.id as keyof CheckIn] as number}
                      onChange={(e) => updateField(item.id as keyof CheckIn, parseInt(e.target.value))}
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-stone-400">
                      <span>NONE</span>
                      <span>SEVERE</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Journal (Optional)</label>
                <textarea 
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none h-48 resize-none text-stone-700"
                  placeholder="Anything else on your mind today? Writing it down can help..."
                  value={formData.journal_text || ''}
                  onChange={(e) => updateField('journal_text', e.target.value)}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

        {!showSuccess && (
          <div className="mt-12 flex items-center justify-between">
            {step > 0 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-stone-400 font-bold hover:text-stone-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div />}
            
            <button 
              onClick={handleNext}
              disabled={isAnalyzing}
              className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  {step === steps.length - 1 ? "Complete Check-in" : "Next"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
