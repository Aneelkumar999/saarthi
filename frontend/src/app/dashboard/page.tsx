"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, StatCard } from "@/components/ui/card";
import { getToken, isAuthenticated } from "@/lib/auth";
import { fetchMyDashboard } from "@/lib/api";
import { useIsClient } from "@/lib/use-is-client";

interface Activity {
  type: string;
  title: string;
  status: string;
  timestamp: string;
}

interface DashboardData {
  active_journeys: number;
  completed_journeys: number;
  completed_steps: number;
  total_steps: number;
  uploaded_documents: number;
  schemes_applied: number;
  eligible_schemes: number;
  days_saved: number;
  recent_activities: Activity[];
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function activityIcon(type: string) {
  if (type === "journey") return "🚀";
  if (type === "document") return "📄";
  if (type === "scheme") return "💡";
  if (type === "service_request") return "📋";
  return "📌";
}

function statusColor(status: string) {
  if (status === "active" || status === "verified" || status === "eligible" || status === "approved") return "text-emerald-600 bg-emerald-50";
  if (status === "pending" || status === "uploaded" || status === "recommended") return "text-amber-600 bg-amber-50";
  if (status === "completed" || status === "done") return "text-teal-600 bg-teal-50";
  if (status === "rejected") return "text-red-600 bg-red-50";
  return "text-slate-600 bg-slate-50";
}

export default function DashboardPage() {
  const isClient = useIsClient();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isClient || !isAuthenticated()) {
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) { setLoading(false); return; }
    fetchMyDashboard(token)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [isClient]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Citizen command center"
          title="Track every government journey in one dashboard"
          description="A unified view of workflows, document readiness, scheme eligibility, pending approvals, and next best actions."
        />
        <div className="py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-4xl">📊</div>
          <h2 className="text-xl font-black text-navy">Welcome to Saarthi AI</h2>
          <p className="mt-2 text-slate-500">Start your first government service journey to see your dashboard come alive.</p>
          <p className="mt-1 text-sm text-slate-400">Upload documents, begin workflows, and apply for schemes to track your progress here.</p>
        </div>
      </AppShell>
    );
  }

  const progressPercent = data.total_steps > 0
    ? Math.round((data.completed_steps / data.total_steps) * 100)
    : 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Citizen command center"
        title="Track every government journey in one dashboard"
        description="A unified view of workflows, document readiness, scheme eligibility, pending approvals, and next best actions."
      />

      <div className="grid gap-5 md:grid-cols-4">
        <StatCard label="Active journeys" value={String(data.active_journeys)} />
        <StatCard label="Documents ready" value={String(data.uploaded_documents)} tone="green" />
        <StatCard label="Schemes applied" value={String(data.schemes_applied)} tone="saffron" />
        <StatCard label="Days saved" value={String(data.days_saved)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-black text-navy">Journey progress</h2>
            {data.total_steps > 0 ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                  <span>{data.completed_steps} of {data.total_steps} steps completed</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-saffron to-emerald-500 transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">{data.completed_journeys} journeys completed</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No journeys started yet. Visit the Workflow page to begin.</p>
            )}
          </Card>

          <Card>
            <h2 className="text-2xl font-black text-navy">Recent activities</h2>
            <div className="mt-5 space-y-4">
              {data.recent_activities.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">No activities yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Your journeys, document uploads, and scheme applications will appear here.</p>
                </div>
              )}
              {data.recent_activities.map((activity, i) => (
                <div
                  key={`${activity.type}-${i}`}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{activityIcon(activity.type)}</span>
                    <div>
                      <p className="font-black text-navy">{activity.title}</p>
                      <p className="text-xs text-slate-400">{timeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(activity.status)}`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <h2 className="text-2xl font-black text-navy">Quick stats</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Documents uploaded</p>
              <p className="mt-1 text-3xl font-black text-navy">{data.uploaded_documents}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Schemes available</p>
              <p className="mt-1 text-3xl font-black text-telangana">{data.eligible_schemes}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Schemes applied</p>
              <p className="mt-1 text-3xl font-black text-saffron">{data.schemes_applied}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Time saved</p>
              <p className="mt-1 text-3xl font-black text-emerald-600">{data.days_saved} days</p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
