import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  AlertCircle, 
  Shield, 
  Users,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { User } from '../types';

interface CrisisSupportProps {
  onClose: () => void;
  user: User;
}

export default function CrisisSupport({ onClose, user }: CrisisSupportProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-6 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Urgent Help</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
          <section className="text-center space-y-2">
            <p className="text-stone-900 font-bold text-lg">You are not alone.</p>
            <p className="text-stone-500 text-sm">If you are in immediate danger or need someone to talk to right now, please use these resources.</p>
          </section>

          {/* Emergency Contact */}
          {user.emergency_contact_name && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-3xl">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Your Emergency Contact</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900 text-lg">{user.emergency_contact_name}</p>
                  <p className="text-stone-500 text-sm">{user.emergency_contact_phone}</p>
                </div>
                <a 
                  href={`tel:${user.emergency_contact_phone}`}
                  className="bg-red-600 text-white p-4 rounded-2xl shadow-lg shadow-red-100"
                >
                  <Phone className="w-6 h-6" />
                </a>
              </div>
            </div>
          )}

          {/* Hotlines */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Crisis Hotlines</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <a href="tel:988" className="flex items-center justify-between p-5 bg-stone-50 border border-stone-100 rounded-3xl hover:bg-stone-100 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">988 Lifeline</p>
                    <p className="text-xs text-stone-500">Call or text 988 (USA)</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-stone-300" />
              </a>

              <a href="sms:741741" className="flex items-center justify-between p-5 bg-stone-50 border border-stone-100 rounded-3xl hover:bg-stone-100 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Crisis Text Line</p>
                    <p className="text-xs text-stone-500">Text HOME to 741741</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-stone-300" />
              </a>
            </div>
          </div>

          {/* Immediate Steps */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Immediate Safety Steps</h3>
            <div className="space-y-3">
              {[
                { icon: <MapPin className="w-4 h-4" />, text: "Go to a safe, public place if you're not safe at home." },
                { icon: <Shield className="w-4 h-4" />, text: "Remove any objects that could be used to harm yourself." },
                { icon: <Users className="w-4 h-4" />, text: "Call a trusted friend or family member to stay with you." },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-stone-50/50 rounded-2xl text-sm text-stone-700">
                  <div className="mt-0.5 text-stone-400">{step.icon}</div>
                  {step.text}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 text-stone-400 font-bold hover:text-stone-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
