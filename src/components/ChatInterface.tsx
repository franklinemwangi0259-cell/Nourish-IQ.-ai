import React from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';
import { ChatMessage } from '../types';
import Markdown from 'react-markdown';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  isThinkingMode: boolean;
  setIsThinkingMode: (val: boolean) => void;
  isSearchMode: boolean;
  setIsSearchMode: (val: boolean) => void;
  chatMessages: ChatMessage[];
  isChatting: boolean;
  shouldSpeakResponse: boolean;
  setShouldSpeakResponse: (val: boolean) => void;
  isListening: boolean;
  chatInput: string;
  setChatInput: (val: string) => void;
  sendMessage: (prompt: string) => void;
  handleSpeak: (text: string) => void;
  handleFeedback: (idx: number, type: 'positive' | 'negative') => void;
  toggleListening: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isThinkingMode,
  setIsThinkingMode,
  isSearchMode,
  setIsSearchMode,
  chatMessages,
  isChatting,
  shouldSpeakResponse,
  setShouldSpeakResponse,
  isListening,
  chatInput,
  setChatInput,
  sendMessage,
  handleSpeak,
  handleFeedback,
  toggleListening,
}) => {
  return (
    <motion.div 
      key="chat" 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      className="flex flex-col h-[calc(100vh-180px)] py-4"
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="https://i.postimg.cc/NM8Pdy2b/logo.png" 
              alt="Nourish IQ Logo" 
              className="w-full h-full object-contain drop-shadow-lg" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }} 
            />
            <div className="hidden w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <LucideIcons.Brain size={24} />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white tracking-tight">Nourish IQ</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">AI Assistant Online</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsThinkingMode(!isThinkingMode);
              if (!isThinkingMode) setIsSearchMode(false);
            }}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
              isThinkingMode ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "glass-card text-slate-500"
            )}
          >
            <LucideIcons.Brain size={18} />
          </button>
          <button 
            onClick={() => {
              setIsSearchMode(!isSearchMode);
              if (!isSearchMode) setIsThinkingMode(false);
            }}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
              isSearchMode ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "glass-card text-slate-500"
            )}
          >
            <LucideIcons.Search size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-4">
        {chatMessages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "items-start")}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
              msg.role === 'user' ? "bg-slate-800 text-slate-400" : "bg-emerald-500 text-white"
            )}>
              {msg.role === 'user' ? <LucideIcons.User size={18} /> : <LucideIcons.Brain size={18} />}
            </div>
            <div className={cn(
              "px-5 py-3.5 rounded-[1.5rem] text-sm leading-relaxed shadow-lg relative group",
              msg.role === 'user' 
                ? "tech-card border-white/5 text-slate-100 rounded-tr-none" 
                : "tech-card border-emerald-500/20 text-slate-200 rounded-tl-none bg-emerald-500/5 backdrop-blur-md"
            )}>
              <div className="markdown-body text-slate-200">
                <Markdown>{msg.content}</Markdown>
              </div>
              {msg.role === 'model' && (
                <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleSpeak(msg.content)}
                    className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
                    title="Speak response"
                  >
                    <LucideIcons.Volume2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleFeedback(i, 'positive')}
                    className={cn(
                      "p-1.5 transition-colors",
                      msg.feedback === 'positive' ? "text-emerald-500" : "text-slate-500 hover:text-emerald-400"
                    )}
                    title="Helpful"
                  >
                    <LucideIcons.ThumbsUp size={14} />
                  </button>
                  <button 
                    onClick={() => handleFeedback(i, 'negative')}
                    className={cn(
                      "p-1.5 transition-colors",
                      msg.feedback === 'negative' ? "text-red-500" : "text-slate-500 hover:text-red-400"
                    )}
                    title="Not helpful"
                  >
                    <LucideIcons.ThumbsDown size={14} />
                  </button>
                </div>
              )}
              <div className={cn("text-[9px] font-bold uppercase tracking-widest mt-2 opacity-40 flex justify-between items-center", msg.role === 'user' ? "text-right" : "")}>
                <span>{format(new Date(msg.timestamp), 'HH:mm')}</span>
                {msg.feedback && (
                  <motion.span 
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "ml-2",
                      msg.feedback === 'positive' ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    Feedback received
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {chatMessages.length === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 mt-4"
          >
            {[
              "What should I eat for lunch?",
              "Give me a high protein snack idea",
              "How much water should I drink?",
              "Analyze my recent meals"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setChatInput(prompt);
                  sendMessage(prompt);
                }}
                className="px-4 py-2 bg-slate-800/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 text-xs rounded-full border border-white/5 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        )}
        
        {isChatting && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-[80%]"
          >
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
              <LucideIcons.Brain size={18} />
            </div>
            <div className="px-5 py-3.5 glass-card text-slate-200 rounded-[1.5rem] rounded-tl-none text-sm shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              </div>
              <span className="text-xs text-slate-400 ml-2">{isSearchMode ? "Searching..." : isThinkingMode ? "Thinking deeply..." : "Typing..."}</span>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-4 px-2 no-scrollbar">
        {[
          { label: "Habit Advice", prompt: "Analyze my habits and give me some motivational advice for habit formation." },
          { label: "Nutrition Trends", prompt: "What are the latest nutrition trends I should know about?" },
          { label: "Meal Ideas", prompt: "Based on my history, what should I eat for my next meal?" },
          { label: "Streak Tips", prompt: "How can I maintain my habit streaks more effectively?" }
        ].map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q.prompt)}
            className="whitespace-nowrap px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-all"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="mt-4 glass-card rounded-3xl p-2 flex gap-2 border border-white/10 shadow-2xl">
        <button 
          onClick={() => setShouldSpeakResponse(!shouldSpeakResponse)}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
            shouldSpeakResponse ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" : "bg-slate-800/50 text-slate-500 hover:text-emerald-400"
          )}
          title="Toggle Voice Output"
        >
          <LucideIcons.Volume2 size={20} />
        </button>
        <button 
          onClick={toggleListening}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
            isListening ? "bg-red-500 text-white animate-pulse shadow-red-500/20" : "bg-slate-800/50 text-slate-500 hover:text-emerald-400"
          )}
          title="Voice Input"
        >
          {isListening ? <LucideIcons.MicOff size={20} /> : <LucideIcons.Mic size={20} />}
        </button>
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Ask NORI AI about your nutrition..." 
            className="w-full bg-transparent px-2 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-600" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { 
              if (e.key === 'Enter') { 
                sendMessage(chatInput); 
                setChatInput(''); 
              } 
            }} 
          />
        </div>
        <button 
          onClick={() => {
            sendMessage(chatInput);
            setChatInput('');
          }}
          disabled={!chatInput.trim() || isChatting}
          className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
        >
          <LucideIcons.Send size={20} />
        </button>
      </div>
    </motion.div>
  );
};
