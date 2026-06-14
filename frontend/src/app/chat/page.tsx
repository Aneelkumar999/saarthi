"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Mic, Send, User } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendChatMessage } from "@/lib/api";
import { generateRoadmap, normalizeApiRoadmap, saveRoadmap, type SavedRoadmap } from "@/lib/journey";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Namaskaram. Tell me your goal in simple words. I will create a step-by-step government service roadmap." }
  ]);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<SavedRoadmap | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submitMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((current) => [...current, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const result = await sendChatMessage(userMessage);
      const apiRoadmap = normalizeApiRoadmap(userMessage, result.roadmap);
      const finalRoadmap = apiRoadmap ?? generateRoadmap(userMessage);
      saveRoadmap(finalRoadmap);
      setRoadmap(finalRoadmap);
      setMessages((current) => [...current, { role: "assistant", content: buildRoadmapText(finalRoadmap, result.response) }]);
    } catch {
      const generatedRoadmap = generateRoadmap(userMessage);
      saveRoadmap(generatedRoadmap);
      setRoadmap(generatedRoadmap);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: buildRoadmapText(generatedRoadmap)
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader eyebrow="AI navigator" title="Ask Saarthi in natural language" description="The chat interface converts citizen goals into workflows, dependencies, documents, forms, and scheme recommendations." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="flex min-h-[34rem] flex-col p-0">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-black text-navy">Citizen Assistant</h2>
            <p className="text-sm text-slate-500">English and Telugu-ready conversation layer</p>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-white"><Bot size={19} /></span>}
                <div className={`max-w-[82%] rounded-3xl px-5 py-4 leading-7 ${message.role === "user" ? "bg-saffron text-white" : "bg-slate-100 text-slate-700"}`}>{message.content}</div>
                {message.role === "user" && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream text-saffron"><User size={19} /></span>}
              </div>
            ))}
            {loading && <p className="text-sm font-semibold text-slate-500">Saarthi is generating a grounded roadmap...</p>}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && submitMessage()}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-saffron"
                placeholder="Type your goal..."
              />
              <Button type="button" variant="outline" className="px-4" aria-label="Voice input" onClick={() => alert("Voice input coming soon!")}><Mic size={19} /></Button>
              <Button type="button" onClick={submitMessage} className="gap-2"><Send size={18} /> Send</Button>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-black text-navy">Current roadmap</h3>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            {(roadmap ? [
              `Intent: ${roadmap.intent}`,
              `Location: ${roadmap.location}`,
              `Timeline: ${roadmap.timeline} working days`,
              `Departments: ${Array.from(new Set(roadmap.steps.map((step) => step.dept))).join(", ")}`,
              `Schemes: ${roadmap.schemes.join(", ")}`
            ] : [
              "Ask a question to generate a roadmap",
              "Example: I want a birth certificate",
              "Example: I want to open a tea shop in Hyderabad"
            ]).map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-3 font-semibold">{item}</p>)}
          </div>
          {roadmap && (
            <Link href="/workflow" className="mt-4 block rounded-2xl bg-navy px-5 py-3 text-center text-sm font-bold text-white">
              Open Workflow
            </Link>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function buildRoadmapText(roadmap: SavedRoadmap, aiNote?: string) {
  return `I created a dedicated roadmap for: ${roadmap.goal}\n\nIntent: ${roadmap.intent}\nLocation: ${roadmap.location}\nTimeline: ${roadmap.timeline} working days\n\nRequired services:\n${roadmap.steps.map((step) => `${step.id}. ${step.title} - ${step.dept}`).join("\n")}\n\nSchemes: ${roadmap.schemes.length ? roadmap.schemes.join(", ") : "No direct scheme match yet"}\n\nUpload documents next so I can auto-fill the first form.${aiNote ? `\n\nAI note: ${aiNote}` : ""}`;
}
