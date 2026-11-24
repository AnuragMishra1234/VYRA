import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  Minimize2,
  Maximize2,
  RefreshCw,
  Compass,
  Activity,
  Satellite,
  HelpCircle,
} from 'lucide-react';
import { askVyraBot } from '../../services/api';

const QUICK_QUESTIONS = [
  'Why did VYRA switch to HYBRID mode?',
  'How does the 6-state EKF work?',
  'Why is XGBoost used for forecasting?',
  'What happens during a 20s GNSS outage?',
  'How does VYRA compare to Reactive Switching?',
  'What do ATE, RMSE, and Peak Error mean?',
];

export default function VyraBot({ currentTelemetry, activeScenario = 'NORMAL' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am **VYRA-BOT**, your project-aware AI research assistant. I have full knowledge of VYRA's Extended Kalman Filter equations, XGBoost action-conditioned models, anti-chattering policies, and IO-VNBD benchmark results.\n\nAsk me anything about the algorithms or current live telemetry!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText = null) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsLoading(true);

    // Assemble current live context for context-aware responses
    const liveContext = {
      current_mode: currentTelemetry?.selected_mode || 'HYBRID',
      is_outage: currentTelemetry?.is_outage || false,
      gnss_quality: currentTelemetry?.gnss_quality !== undefined ? currentTelemetry.gnss_quality : 0.95,
      predicted_error: currentTelemetry?.current_error_m || 0.42,
      scenario: activeScenario,
    };

    try {
      const res = await askVyraBot(textToSend, liveContext);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.answer || "I received your question. Let's inspect the telemetry and formulation.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Encountered an issue communicating with the assistant engine. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: 'Chat history reset. How can I assist with your navigation demonstration?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Simple formatting helper for markdown bold and bullet points
  const renderMessageContent = (text) => {
    return text.split('\n').map((line, lineIdx) => {
      // Bold rendering
      const parts = line.split(/(\*\*.*?\*\*|\$.*?\$|`.*?`)/g);
      return (
        <p key={lineIdx} className={line.startsWith('- ') ? 'ml-3 list-disc' : 'mb-1.5'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">
                  {part.slice(1, -1)}
                </code>
              );
            }
            if (part.startsWith('$') && part.endsWith('$')) {
              return (
                <span key={pIdx} className="font-mono text-cyan-200">
                  {part.slice(1, -1)}
                </span>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <aside aria-label="VYRA-BOT Floating Assistant" className="fixed bottom-5 right-5 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-blue-400/40"
          title="Open VYRA-BOT Navigation Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold font-mono tracking-wider flex items-center gap-1.5">
              <span>VYRA-BOT</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-blue-950/80 rounded border border-blue-300/30 font-sans">
                AI
              </span>
            </div>
            <div className="text-[10px] text-cyan-200">Ask about EKF, XGBoost & Outages</div>
          </div>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div
          className={`flex flex-col bg-[#080d1a]/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl rounded-2xl transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'w-[calc(100vw-32px)] sm:w-[680px] h-[82vh] max-h-[800px]'
              : 'w-[calc(100vw-32px)] sm:w-[420px] h-[540px]'
          }`}
          style={{ maxWidth: 'calc(100vw - 24px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-mono text-white tracking-wide">VYRA-BOT</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    ONLINE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                  <span>Mode: {currentTelemetry?.selected_mode || 'HYBRID'}</span>
                  <span>•</span>
                  <span>Q: {(currentTelemetry?.gnss_quality || 0.95).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                title="Reset Chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                title={isExpanded ? 'Restore size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Question Chips */}
          <div className="px-3 py-2 bg-slate-950/50 border-b border-slate-800/60 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Prompts:
            </span>
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-cyan-200 border border-slate-700/60 hover:border-blue-500/50 whitespace-nowrap transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800/90 rounded-bl-none'
                  }`}
                >
                  <div className="break-words font-sans text-xs">
                    {renderMessageContent(msg.text)}
                  </div>
                  <div
                    className={`text-[9px] mt-1 font-mono text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] font-mono text-slate-400 ml-1.5">Consulting VYRA Research Knowledge Base...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about navigation mode, outages, EKF..."
              className="flex-1 bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 text-white placeholder-slate-400 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex items-center justify-center shadow-lg shadow-blue-600/30"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
