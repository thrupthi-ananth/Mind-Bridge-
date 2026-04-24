import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  ChevronRight, 
  MessageSquare, 
  Activity, 
  Shield, 
  Clock,
  CheckCircle2,
  FileText,
  Mic
} from 'lucide-react';
import { User, CheckIn } from '../types';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';
import { MOTIVATIONAL_QUOTES, WELCOME_MESSAGES, getRandomMessage } from '../lib/messages';

interface DashboardProps {
  user: User;
  checkIns: CheckIn[];
  onAddCheckIn: () => void;
  onViewReport: () => void;
  onChat: () => void;
  onChatVoice: () => void;
}

export default function Dashboard({ user, checkIns, onAddCheckIn, onViewReport, onChat, onChatVoice }: DashboardProps) {
  const lastCheckIn = checkIns[0];
  const daysToAppointment = user.appointment_date 
    ? differenceInDays(new Date(user.appointment_date), new Date()) 
    : null;

  const welcomeMessage = React.useMemo(() => getRandomMessage(WELCOME_MESSAGES), []);
  const dailyQuote = React.useMemo(() => getRandomMessage(MOTIVATIONAL_QUOTES), []);

  const moodColor = lastCheckIn 
    ? lastCheckIn.mood >= 8 ? 'text-emerald-600' : lastCheckIn.mood >= 5 ? 'text-amber-600' : 'text-rose-600'
    : 'text-stone-400';

  const averageMood = checkIns.length > 0 
    ? Math.round(checkIns.reduce((acc, curr) => acc + curr.mood, 0) / checkIns.length)
    : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">
            {getGreeting()}, {user.preferred_name || user.name}
          </h2>
          <p className="text-stone-500 mt-1">{welcomeMessage}</p>
        </div>
        {lastCheckIn && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-white/50",
              lastCheckIn.mood >= 8 ? "bg-emerald-100" : lastCheckIn.mood >= 5 ? "bg-amber-100" : "bg-rose-100"
            )}
          >
            <Activity className={cn("w-6 h-6", moodColor)} />
          </motion.div>
        )}
      </section>

      {/* Appointment Countdown */}
      {daysToAppointment !== null && (
        <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">
              <Calendar className="w-3 h-3" />
              Upcoming Appointment
            </div>
            <p className="text-2xl font-bold">
              {daysToAppointment > 0 
                ? `${daysToAppointment} days to go` 
                : daysToAppointment === 0 ? 'Today is the day' : 'Appointment passed'}
            </p>
            <p className="text-emerald-100 text-sm mt-1">
              {format(new Date(user.appointment_date), 'MMMM do, yyyy')}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Clock className="w-8 h-8" />
          </div>
        </div>
      )}

      {/* Weekly Mood Summary */}
      {averageMood !== null && (
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Weekly Mood</h3>
              <p className="text-2xl font-bold text-stone-900">
                {averageMood >= 8 ? 'Radiant' : averageMood >= 5 ? 'Steady' : 'Heavy'}
              </p>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl",
              averageMood >= 8 ? "bg-emerald-50 text-emerald-600" : 
              averageMood >= 5 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
            )}>
              {averageMood}
            </div>
          </div>
          
          {/* Simple Mood Bar */}
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${averageMood * 10}%` }}
              className={cn(
                "h-full rounded-full",
                averageMood >= 8 ? "bg-emerald-500" : 
                averageMood >= 5 ? "bg-amber-500" : "bg-rose-500"
              )}
            />
          </div>
          <p className="text-[10px] text-stone-400 mt-2 font-medium">
            Based on your last {checkIns.length} check-ins
          </p>
          
          {/* Background Glow */}
          <div className={cn(
            "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 rounded-full",
            averageMood >= 8 ? "bg-emerald-500" : 
            averageMood >= 5 ? "bg-amber-500" : "bg-rose-500"
          )} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onAddCheckIn}
          className="bg-white p-4 rounded-3xl border border-stone-200 text-left hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
        >
          <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Check-in</h3>
          <p className="text-[10px] text-stone-500 mt-1">Log symptoms</p>
        </button>

        <button 
          onClick={onChat}
          className="bg-white p-4 rounded-3xl border border-stone-200 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
        >
          <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">AI Chat</h3>
          <p className="text-[10px] text-stone-500 mt-1">Get support</p>
        </button>

        <button 
          onClick={onChatVoice}
          className="bg-white p-4 rounded-3xl border border-stone-200 text-left hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
        >
          <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Voice Chat</h3>
          <p className="text-[10px] text-stone-500 mt-1">Real-time talk</p>
        </button>

        <button 
          onClick={onViewReport}
          className="bg-white p-4 rounded-3xl border border-stone-200 text-left hover:border-purple-200 hover:bg-purple-50/30 transition-all group"
        >
          <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Report</h3>
          <p className="text-[10px] text-stone-500 mt-1">For doctor</p>
        </button>
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Recent Check-ins</h3>
          <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
        </div>

        {checkIns.length > 0 ? (
          <div className="space-y-3">
            {checkIns.slice(0, 3).map((checkIn, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    animate={i === 0 ? { 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 0px rgba(0,0,0,0)",
                        checkIn.mood > 7 ? "0 0 0 4px rgba(16, 185, 129, 0.1)" : 
                        checkIn.mood > 4 ? "0 0 0 4px rgba(245, 158, 11, 0.1)" : "0 0 0 4px rgba(239, 68, 68, 0.1)",
                        "0 0 0 0px rgba(0,0,0,0)"
                      ]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                      checkIn.mood > 7 ? "bg-emerald-50 text-emerald-600" : 
                      checkIn.mood > 4 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                    )}
                  >
                    {checkIn.mood}
                  </motion.div>
                  <div>
                    <p className="font-bold text-stone-900">
                      {format(new Date(checkIn.created_at!), 'EEEE')}
                    </p>
                    <p className="text-xs text-stone-500">
                      {format(new Date(checkIn.created_at!), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {checkIn.risk_score > 50 && (
                    <div className="bg-red-100 text-red-600 p-1 rounded-md">
                      <Shield className="w-3 h-3" />
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-stone-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stone-100/50 border-2 border-dashed border-stone-200 rounded-3xl p-8 text-center">
            <p className="text-stone-400 text-sm">No check-ins yet. Start your first one today.</p>
          </div>
        )}
      </section>

      {/* Daily Tip / Quote */}
      <div className="bg-stone-900 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-3">
          <Shield className="w-3 h-3" />
          Daily Support
        </div>
        <p className="text-lg font-serif italic leading-relaxed">
          "{dailyQuote.split(' — ')[0]}"
        </p>
        {dailyQuote.includes(' — ') && (
          <p className="text-stone-500 text-xs mt-4">— {dailyQuote.split(' — ')[1]}</p>
        )}
      </div>
    </div>
  );
}
