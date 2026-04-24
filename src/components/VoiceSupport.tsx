import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Heart, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ai, SYSTEM_INSTRUCTION, analyzeVoiceSession } from '../services/gemini';
import { LiveServerMessage, Modality } from "@google/genai";
import { User, VoiceSession } from '../types';
import { cn } from '../lib/utils';

interface VoiceSupportProps {
  user: User;
  onComplete?: () => void;
}

export default function VoiceSupport({ user, onComplete }: VoiceSupportProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [modelTranscription, setModelTranscription] = useState<string>("");

  const sessionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setTranscript("");
    setModelTranscription("");
    transcriptRef.current = "";
    try {
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            startAudioCapture();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudio(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              stopPlayback();
            }
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
                const text = message.serverContent.modelTurn.parts[0].text;
                setModelTranscription(prev => prev + " " + text);
                transcriptRef.current += `\nCompass: ${text}`;
            }
            // Capture user transcription if available
            const userText = (message as any).serverContent?.userTurn?.parts?.[0]?.text;
            if (userText) {
              transcriptRef.current += `\nUser: ${userText}`;
            }
          },
          onclose: () => {
            setIsConnected(false);
            stopAudioCapture();
            handleSessionEnd();
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            const isQuotaError = err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
            setError(isQuotaError 
              ? "I've reached my message limit for now. Please try again later or check your API key." 
              : "Connection error. Please try again.");
            setIsConnecting(false);
          }
        }
      });
      sessionRef.current = session;
    } catch (err: any) {
      console.error(err);
      const isQuotaError = err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
      setError(isQuotaError 
        ? "I've reached my message limit for now. Please try again later or check your API key." 
        : "Failed to connect to voice support.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsConnected(false);
    stopAudioCapture();
  };

  const handleSessionEnd = async () => {
    const finalTranscript = transcriptRef.current;
    if (!finalTranscript || finalTranscript.length < 50) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeVoiceSession(finalTranscript);
      
      await fetch('/api/voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          transcript: finalTranscript,
          mood_analysis: analysis.moodAnalysis,
          key_takeaways: JSON.stringify(analysis.keyTakeaways)
        }),
      });
      if (onComplete) onComplete();
    } catch (err) {
      console.error("Failed to analyze voice session:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error("Audio capture error:", err);
      setError("Microphone access denied.");
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
      }
      audioContextRef.current = null;
    }
  };

  const playAudio = async (base64Data: string) => {
    if (!audioContextRef.current) return;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }
    audioQueueRef.current.push(floatData);
    if (!isPlayingRef.current) {
      processQueue();
    }
  };

  const processQueue = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;
    const data = audioQueueRef.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, data.length, 24000);
    buffer.getChannelData(0).set(data);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => processQueue();
    source.start();
  };

  const stopPlayback = () => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
      <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="relative">
          <motion.div 
            animate={isConnected ? { scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
              isConnected ? "bg-emerald-100 text-emerald-600" : "bg-stone-100 text-stone-400"
            )}
          >
            <Heart className={cn("w-16 h-16", isConnected && "animate-pulse")} />
          </motion.div>
          
          {isConnected && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white"
            >
              <Volume2 className="w-4 h-4" />
            </motion.div>
          )}
        </div>

        <div className="max-w-xs">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            {isAnalyzing ? "Analyzing Session..." : isConnected ? "Compass is Listening" : "Voice Support"}
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            {isAnalyzing 
              ? "Please wait while I summarize our conversation and identify key insights."
              : isConnected 
                ? "Speak freely. I'm here to listen and support you in real-time." 
                : "Connect for a real-time voice conversation with Compass."}
          </p>
        </div>

        {isAnalyzing && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          {!isConnected ? (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Conversation
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "p-4 rounded-2xl transition-all border",
                  isMuted ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-stone-50 text-stone-600 border-stone-200"
                )}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button
                onClick={stopSession}
                className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all"
              >
                End Session
              </button>
            </>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="p-4 bg-stone-50 border-t border-stone-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Live Transcription</span>
          </div>
          <p className="text-xs text-stone-600 italic line-clamp-2">
            {modelTranscription || "Waiting for response..."}
          </p>
        </div>
      )}
    </div>
  );
}
