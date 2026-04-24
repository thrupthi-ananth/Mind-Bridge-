import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Phone, 
  Users, 
  MapPin, 
  AlertCircle,
  CheckCircle2,
  Heart,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

interface SafetyPlanProps {
  user: User;
}

export default function SafetyPlan({ user }: SafetyPlanProps) {
  const safetySteps = [
    {
      title: "Warning Signs",
      description: "Thoughts, moods, or behaviors that tell me a crisis might be starting.",
      items: ["Feeling trapped", "Increased isolation", "Difficulty sleeping", "Intense anxiety"],
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
      color: "bg-amber-50 border-amber-100"
    },
    {
      title: "Calming Actions",
      description: "Things I can do on my own to take my mind off my problems.",
      items: ["Deep breathing (4-7-8)", "Listening to calm music", "Taking a short walk", "Journaling in MindBridge"],
      icon: <Heart className="w-5 h-5 text-emerald-600" />,
      color: "bg-emerald-50 border-emerald-100"
    },
    {
      title: "Support People",
      description: "People I can talk to when I'm struggling.",
      items: [user.emergency_contact_name || "Emergency Contact", "Close friend or family member", "My therapist (upcoming)"],
      icon: <Users className="w-5 h-5 text-blue-600" />,
      color: "bg-blue-50 border-blue-100"
    },
    {
      title: "Safe Environment",
      description: "How I can make my space safer.",
      items: ["Remove harmful objects", "Go to a public place", "Stay with a trusted person"],
      icon: <Shield className="w-5 h-5 text-stone-600" />,
      color: "bg-stone-50 border-stone-200"
    }
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">My Safety Plan</h2>
        <p className="text-stone-500 mt-1">A personalized guide to help you stay safe during difficult moments.</p>
      </section>

      <div className="space-y-4">
        {safetySteps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn("p-6 rounded-3xl border", step.color)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                {step.icon}
              </div>
              <div>
                <h3 className="font-bold text-stone-900">{step.title}</h3>
                <p className="text-xs text-stone-500">{step.description}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {step.items.map((item, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-stone-300" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="bg-stone-900 rounded-3xl p-6 text-white">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-emerald-400" />
          Professional Resources
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
            <div>
              <p className="font-bold">Crisis Text Line</p>
              <p className="text-xs text-stone-400">Text HOME to 741741</p>
            </div>
            <button className="bg-white text-stone-900 px-4 py-2 rounded-xl text-xs font-bold">Text Now</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
            <div>
              <p className="font-bold">988 Suicide & Crisis Lifeline</p>
              <p className="text-xs text-stone-400">Call or text 988</p>
            </div>
            <button className="bg-white text-stone-900 px-4 py-2 rounded-xl text-xs font-bold">Call Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
