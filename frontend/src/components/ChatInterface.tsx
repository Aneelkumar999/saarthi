"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface({ onIntentFound }: { onIntentFound: (id: number) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Namaste! I am your Saarthi. How can I guide you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        
        if (data.intent_id) {
          onIntentFound(data.intent_id);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I'm having trouble connecting to my services. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Conversational Guide</h3>
        <div className="flex gap-2">
          <button className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl ${
              msg.role === "user" 
                ? "bg-indigo-600 text-white rounded-br-none" 
                : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-3 rounded-2xl rounded-bl-none border border-slate-200">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-slate-50">
        <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <input
            type="text"
            className="flex-1 bg-transparent px-3 py-2 outline-none text-sm"
            placeholder="Type your goal here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setInput("I want to open a tea shop")} className="whitespace-nowrap bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition">☕ Tea Shop</button>
          <button onClick={() => setInput("Apply for birth certificate")} className="whitespace-nowrap bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition">👶 Birth Cert</button>
          <button onClick={() => setInput("Get farm subsidy")} className="whitespace-nowrap bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition">🚜 Farm Subsidy</button>
        </div>
      </div>
    </>
  );
}
