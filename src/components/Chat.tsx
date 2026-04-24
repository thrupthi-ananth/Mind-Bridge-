import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, Shield, AlertCircle, Loader2, Mic, Volume2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { getChatResponse, generateSpeech, transcribeAudio } from '../services/gemini';

interface ChatProps {
  user: User;
}

export default function Chat({ user }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/chat/${user.id}`);
      const data = await res.json();
      if (data.length === 0) {
        const initialMessage: ChatMessage = {
          user_id: user.id,
          role: 'model',
          content: `Hi ${user.preferred_name || user.name}, I'm Compass. I'm here to support you while you wait for your appointment. How are you feeling right now?`
        };
        setMessages([initialMessage]);
      } else {
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isTyping) return;

    const userMsg: ChatMessage = { user_id: user.id, role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setIsTyping(true);

    try {
      // Save user message
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMsg),
      });

      // Get AI response
      const responseText = await getChatResponse(messages, messageText);
      const aiMsg: ChatMessage = { user_id: user.id, role: 'model', content: responseText || "I'm sorry, I'm having trouble responding right now. Please try again." };
      
      setMessages(prev => [...prev, aiMsg]);
      
      // Save AI message
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMsg),
      });
    } catch (err: any) {
      console.error(err);
      const isQuotaError = err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
      const errorMessage = isQuotaError 
        ? "I'm sorry, I've reached my message limit for now. Please try again in a little while, or check your API key settings."
        : "I'm having a bit of trouble connecting right now. Could you try sending that again?";
      
      const aiMsg: ChatMessage = { 
        user_id: user.id, 
        role: 'model', 
        content: errorMessage 
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudio(base64Audio);
            if (transcription) {
              setInput(transcription);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playTTS = async (text: string, id: number) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
      return;
    }
    
    try {
      setPlayingAudioId(id);
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.onended = () => setPlayingAudioId(null);
        audio.play();
      }
    } catch (err) {
      console.error(err);
      setPlayingAudioId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
        <div className="bg-emerald-600 p-2 rounded-xl">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-stone-900 text-sm">Compass Companion</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Always here to listen</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex gap-3 mb-6">
          <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Compass is an AI support tool. It cannot diagnose or provide medical advice. If you're in crisis, please use the <strong>Crisis Help</strong> button above.
          </p>
        </div>

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex w-full",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed relative group",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-100" 
                : "bg-stone-100 text-stone-800 rounded-tl-none"
            )}>
              {msg.content}
              
              {msg.role === 'model' && (
                <button 
                  onClick={() => playTTS(msg.content, i)}
                  className={cn(
                    "absolute -right-8 top-2 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100",
                    playingAudioId === i ? "bg-emerald-100 text-emerald-600" : "bg-stone-100 text-stone-400 hover:text-stone-600"
                  )}
                >
                  {playingAudioId === i ? <Volume2 className="w-3 h-3 animate-pulse" /> : <Volume2 className="w-3 h-3" />}
                </button>
              )}
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-stone-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
              <span className="text-xs text-stone-400 font-medium">Compass is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-stone-100">
        <div className="relative flex items-center gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "p-3 rounded-2xl transition-all",
              isRecording ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-stone-100 text-stone-400 hover:text-stone-600"
            )}
          >
            {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isTranscribing ? "Transcribing audio..." : "Type your message..."}
              disabled={isTranscribing}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-4 pr-12 py-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-stone-700 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping || isTranscribing}
              className={cn(
                "absolute right-2 p-2.5 rounded-xl transition-all",
                input.trim() && !isTyping ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-400"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

