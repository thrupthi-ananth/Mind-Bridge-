import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Home, 
  BarChart2, 
  ShieldAlert, 
  FileText, 
  Settings, 
  PlusCircle,
  AlertCircle,
  Phone,
  LogOut,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { User, CheckIn, ChatMessage, VoiceSession } from './types';

// Components
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CheckInForm from './components/CheckInForm';
import Chat from './components/Chat';
import SafetyPlan from './components/SafetyPlan';
import Trends from './components/Trends';
import ClinicianReport from './components/ClinicianReport';
import CrisisSupport from './components/CrisisSupport';
import VoiceSupport from './components/VoiceSupport';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showCrisis, setShowCrisis] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('mindora_user_id');
    if (storedUserId) {
      fetchUser(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (id: string) => {
    try {
      const res = await fetch(`/api/user/${id}`);
      const data = await res.json();
      if (data) {
        setUser(data);
        fetchCheckIns(id);
        fetchVoiceSessions(id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckIns = async (id: string) => {
    try {
      const res = await fetch(`/api/check-ins/${id}`);
      const data = await res.json();
      setCheckIns(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVoiceSessions = async (id: string) => {
    try {
      const res = await fetch(`/api/voice-sessions/${id}`);
      const data = await res.json();
      setVoiceSessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOnboardingComplete = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('mindora_user_id', newUser.id);
    setActiveTab('home');
  };

  const handleCheckInComplete = () => {
    if (user) fetchCheckIns(user.id);
    setActiveTab('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-emerald-600 animate-pulse mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Loading MindBridge...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard user={user} checkIns={checkIns} onAddCheckIn={() => setActiveTab('checkin')} onViewReport={() => setActiveTab('report')} onChat={() => setActiveTab('chat')} onChatVoice={() => setActiveTab('voice')} />;
      case 'checkin': return <CheckInForm user={user} onComplete={handleCheckInComplete} onCancel={() => setActiveTab('home')} />;
      case 'chat': return <Chat user={user} />;
      case 'voice': return <VoiceSupport user={user} onComplete={() => user && fetchVoiceSessions(user.id)} />;
      case 'safety': return <SafetyPlan user={user} />;
      case 'trends': return <Trends checkIns={checkIns} voiceSessions={voiceSessions} />;
      case 'report': return <ClinicianReport user={user} checkIns={checkIns} />;
      default: return <Dashboard user={user} checkIns={checkIns} onAddCheckIn={() => setActiveTab('checkin')} onViewReport={() => setActiveTab('report')} onChat={() => setActiveTab('chat')} onChatVoice={() => setActiveTab('voice')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] flex flex-col font-sans text-stone-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">MindBridge</h1>
        </div>
        
        <button 
          onClick={() => setShowCrisis(true)}
          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 border border-red-100 hover:bg-red-100 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Crisis Help
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-2 py-2 z-40">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <NavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<Home className="w-5 h-5" />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={<MessageCircle className="w-5 h-5" />} 
            label="Chat" 
          />
          <NavButton 
            active={activeTab === 'voice'} 
            onClick={() => setActiveTab('voice')} 
            icon={<Mic className="w-5 h-5" />} 
            label="Voice" 
          />
          <div className="relative -top-6">
            <button 
              onClick={() => setActiveTab('checkin')}
              className="bg-emerald-600 text-white p-4 rounded-full shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </div>
          <NavButton 
            active={activeTab === 'trends'} 
            onClick={() => setActiveTab('trends')} 
            icon={<BarChart2 className="w-5 h-5" />} 
            label="Trends" 
          />
          <NavButton 
            active={activeTab === 'report'} 
            onClick={() => setActiveTab('report')} 
            icon={<FileText className="w-5 h-5" />} 
            label="Report" 
          />
        </div>
      </nav>

      {/* Crisis Modal */}
      <AnimatePresence>
        {showCrisis && (
          <CrisisSupport onClose={() => setShowCrisis(false)} user={user} />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors",
        active ? "text-emerald-600" : "text-stone-400 hover:text-stone-600"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
