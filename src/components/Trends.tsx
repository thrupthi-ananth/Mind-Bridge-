import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { CheckIn, VoiceSession } from '../types';
import { cn } from '../lib/utils';
import { Brain, MessageSquare, Mic, Sparkles } from 'lucide-react';

interface TrendsProps {
  checkIns: CheckIn[];
  voiceSessions: VoiceSession[];
}

const CHART_HEIGHT = 160;

export default function Trends({ checkIns, voiceSessions }: TrendsProps) {
  const data = [...checkIns].reverse().slice(-14).map(c => ({
    date: format(new Date(c.created_at!), 'MMM d'),
    mood: c.mood,
    anxiety: c.anxiety,
    stress: c.stress,
    sleep: c.sleep_duration,
    energy: c.energy,
    overall: Math.round((c.mood + (10 - c.anxiety) + (10 - c.stress) + c.energy) / 4)
  }));

  const latestCheckIn = checkIns[0];
  const latestVoiceSession = voiceSessions[0];

  const allThemes = checkIns
    .filter(c => c.themes)
    .flatMap(c => JSON.parse(c.themes || '[]'))
    .reduce((acc: Record<string, number>, theme: string) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {});

  const topThemes = (Object.entries(allThemes) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const averageMood = data.length > 0 
    ? (data.reduce((acc, curr) => acc + curr.mood, 0) / data.length).toFixed(1)
    : 0;

  const moodTrend = data.length > 1
    ? data[data.length - 1].mood - data[0].mood
    : 0;

  const ChartSection = ({ title, dataKey, color, domain, height = 160 }: { title: string, dataKey: string, color: string, domain: [number, number], height?: number }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-stone-800 ml-1">{title}</h3>
      <div style={{ height: `${height}px` }} className="w-full bg-white/50 rounded-xl p-2 border border-stone-100">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 500 }}
              dy={5}
            />
            <YAxis 
              domain={domain} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 500 }}
              ticks={domain[1] === 12 ? [0, 3, 6, 9, 12] : domain[1] === 5 ? [0, 2, 5] : [0, 2, 4, 6, 8, 10]}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={3} 
              dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <header className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-stone-900">Your Trends</h2>
        <p className="text-stone-500 text-sm">Insights from your last {data.length} check-ins</p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Avg Mood</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-900">{averageMood}</span>
            <span className="text-xs text-emerald-600 font-medium">/ 10</span>
          </div>
        </div>
        <div className="bg-stone-100 border border-stone-200 p-4 rounded-3xl">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Trend</p>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-3xl font-bold",
              moodTrend > 0 ? "text-emerald-600" : moodTrend < 0 ? "text-rose-600" : "text-stone-600"
            )}>
              {moodTrend > 0 ? `+${moodTrend}` : moodTrend}
            </span>
            <span className="text-xs text-stone-500 font-medium">points</span>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-serif font-bold text-stone-900">AI Insights</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Journal Sentiment & Themes */}
          {latestCheckIn && latestCheckIn.sentiment && (
            <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Latest Journal Analysis</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                  {latestCheckIn.sentiment}
                </div>
                <p className="text-sm text-stone-600 italic">"{latestCheckIn.journal_text.slice(0, 100)}..."</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {JSON.parse(latestCheckIn.themes || '[]').map((theme: string, i: number) => (
                  <span key={i} className="bg-stone-50 text-stone-500 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-stone-100">
                    #{theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Voice Session Analysis */}
          {latestVoiceSession && (
            <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Latest Voice Session</span>
              </div>
              <div className="mb-4">
                <p className="text-sm font-bold text-stone-800 mb-1">Mood Analysis</p>
                <p className="text-sm text-stone-600 leading-relaxed">{latestVoiceSession.mood_analysis}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800 mb-2">Key Takeaways</p>
                <ul className="space-y-2">
                  {JSON.parse(latestVoiceSession.key_takeaways || '[]').map((takeaway: string, i: number) => (
                    <li key={i} className="flex gap-2 text-xs text-stone-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      {takeaway}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recurring Themes */}
          {topThemes.length > 0 && (
            <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Recurring Themes</span>
              </div>
              <div className="space-y-4">
                {topThemes.map(([theme, count], i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{theme}</span>
                      <span className="text-stone-400">{count} occurrences</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${(count / checkIns.length) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <ChartSection 
          title="Overall Mood Trend" 
          dataKey="mood" 
          color="#4a7c59" 
          domain={[0, 10]} 
          height={240}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartSection 
            title="Anxiety" 
            dataKey="anxiety" 
            color="#d4a373" 
            domain={[0, 10]} 
          />
          <ChartSection 
            title="Stress" 
            dataKey="stress" 
            color="#bc4749" 
            domain={[0, 10]} 
          />
          <ChartSection 
            title="Sleep (hours)" 
            dataKey="sleep" 
            color="#457b9d" 
            domain={[0, 12]} 
          />
          <ChartSection 
            title="Energy" 
            dataKey="energy" 
            color="#4a7c59" 
            domain={[0, 10]} 
          />
        </div>
      </div>
    </div>
  );
}

