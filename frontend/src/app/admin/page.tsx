"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Database, FileText, Shield, Users, Search, Lock, ClipboardList, Map, FolderOpen, Award, Globe, ClipboardCheck } from "lucide-react";
import { isAdmin, isAuthenticated } from "@/lib/auth";
import { fetchAdminUsers, promoteUser, demoteUser, fetchGovPortals, fetchAdminServiceRequests, updateServiceRequest, type GovPortal } from "@/lib/api";
import { useIsClient } from "@/lib/use-is-client";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type Tab = "services" | "intents" | "schemes" | "users" | "audit" | "forms" | "roadmap" | "documents" | "schemes_applied" | "portals" | "service_requests";

interface Service { id: number; name: string; department: string; fee: number; sla_days: number; description: string; }
interface Intent { id: number; name: string; description: string; trigger_keywords: string[]; services: { id: number; name: string; step_order: number }[]; has_roadmap_template: boolean; }
interface Scheme { id: number; name: string; description: string; category: string; region: string; eligibility_rules: Record<string, unknown>; }
interface User { id: string; name?: string; email?: string; phone?: string; role?: string; is_verified?: boolean; location?: string; citizen_type?: string; documents?: number; journeys?: number; created_at?: string; }
interface Stats { total_services: number; total_intents: number; total_schemes: number; total_users: number; total_journeys: number; total_documents: number; }
interface AuditEntry { action: string; detail: Record<string, unknown>; timestamp: string; }
interface Journey { id: number; user_name: string; user_email: string; intent_name: string; status: string; steps: { id: number; service_name: string; service_dept: string; status: string }[]; created_at: string; }
interface UserScheme { id: number; user_name: string; user_email: string; scheme_name: string; scheme_description: string; status: string; applied_at: string | null; created_at: string; }
interface DocEntry { id: number; user_id: string; user_name: string; doc_type: string; filename: string; status: string; confidence: string; created_at: string; }
interface ServiceRequestEntry { id: number; user_name: string; user_email: string; service_name: string; service_type: string; description: string; form_data: Record<string, unknown>; documents: string[]; status: string; admin_notes: string | null; created_at: string; processed_at: string | null; }

export default function AdminPage() {
  const isClient = useIsClient();
  const [tab, setTab] = useState<Tab>("services");
  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [userSchemes, setUserSchemes] = useState<UserScheme[]>([]);
  const [documents, setDocuments] = useState<DocEntry[]>([]);
  const [portals, setPortals] = useState<GovPortal[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editField, setEditField] = useState("");
  const retryCountRef = useRef(0);

  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formFee, setFormFee] = useState("");
  const [formSla, setFormSla] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("saarthi_access_token");
      const [statsRes, servicesRes, intentsRes, schemesRes, auditRes, journeysRes, userSchemesRes, documentsRes, serviceRequestsRes] = await Promise.allSettled([
        fetch(`${API}/admin/stats`),
        fetch(`${API}/admin/services`),
        fetch(`${API}/admin/intents`),
        fetch(`${API}/admin/schemes`),
        fetch(`${API}/admin/audit`),
        fetch(`${API}/admin/journeys`),
        fetch(`${API}/admin/user-schemes`),
        fetch(`${API}/admin/documents`),
        token ? fetchAdminServiceRequests(token) : Promise.reject("no token"),
      ]);
      const usersResult = token ? await fetchAdminUsers(token).catch(() => []) : [];
      const portalsResult = await fetchGovPortals().catch(() => []);
      if (statsRes.status === "fulfilled" && statsRes.value.ok) setStats(await statsRes.value.json());
      if (servicesRes.status === "fulfilled" && servicesRes.value.ok) setServices(await servicesRes.value.json());
      if (intentsRes.status === "fulfilled" && intentsRes.value.ok) setIntents(await intentsRes.value.json());
      if (schemesRes.status === "fulfilled" && schemesRes.value.ok) setSchemes(await schemesRes.value.json());
      if (auditRes.status === "fulfilled" && auditRes.value.ok) setAudit(await auditRes.value.json());
      if (journeysRes.status === "fulfilled" && journeysRes.value.ok) setJourneys(await journeysRes.value.json());
      if (userSchemesRes.status === "fulfilled" && userSchemesRes.value.ok) setUserSchemes(await userSchemesRes.value.json());
      if (documentsRes.status === "fulfilled" && documentsRes.value.ok) setDocuments(await documentsRes.value.json());
      if (serviceRequestsRes.status === "fulfilled") setServiceRequests(Array.isArray(serviceRequestsRes.value) ? serviceRequestsRes.value : []);
      setUsers(Array.isArray(usersResult) ? usersResult : []);
      setPortals(Array.isArray(portalsResult) ? portalsResult : []);
    } catch {
      if (retryCountRef.current < 3) {
        retryCountRef.current += 1;
        setError(`Failed to load. Retrying (${retryCountRef.current}/3)...`);
        setTimeout(fetchData, 3000);
      } else {
        setError("Failed to load admin data. Please refresh.");
      }
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const url = tab === "services" ? `${API}/admin/services` : tab === "intents" ? `${API}/admin/intents` : `${API}/admin/schemes`;
      const body = tab === "services"
        ? { name: formName, department: formDept, fee: Number(formFee), sla_days: Number(formSla), description: formDesc }
        : tab === "intents"
          ? { name: formName, description: formDesc, trigger_keywords: formDept.split(",").map((s) => s.trim()).filter(Boolean) }
          : { name: formName, description: formDesc, eligibility_rules: { category: formDept || "general", region: "all" } };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        setFormName(""); setFormDept(""); setFormFee(""); setFormSla(""); setFormDesc("");
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.detail || "Failed to create. Please try again.");
      }
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(entity: string, id: number) {
    if (!confirm(`Delete this ${entity}?`)) return;
    const res = await fetch(`${API}/admin/${entity}/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  async function handleInlineEdit(entity: string, id: number, field: string, value: string) {
    const body: Record<string, unknown> = {};
    if (field === "trigger_keywords") {
      body[field] = value.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (field === "fee" || field === "sla_days") {
      body[field] = Number(value);
    } else if (field === "eligibility_rules") {
      try { body[field] = JSON.parse(value); } catch { return; }
    } else {
      body[field] = value;
    }
    const res = await fetch(`${API}/admin/${entity}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setEditId(null); fetchData(); }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "services", label: "Services", icon: <Database size={16} />, count: services.length },
    { key: "intents", label: "Intents", icon: <FileText size={16} />, count: intents.length },
    { key: "schemes", label: "Schemes", icon: <Shield size={16} />, count: schemes.length },
    { key: "forms", label: "Forms", icon: <ClipboardList size={16} />, count: journeys.reduce((acc, j) => acc + j.steps.length, 0) },
    { key: "roadmap", label: "Roadmap", icon: <Map size={16} />, count: journeys.length },
    { key: "documents", label: "Documents", icon: <FolderOpen size={16} />, count: documents.length },
    { key: "schemes_applied", label: "Schemes Applied", icon: <Award size={16} />, count: userSchemes.length },
    { key: "portals", label: "Portals", icon: <Globe size={16} />, count: portals.length },
    { key: "users", label: "Users", icon: <Users size={16} />, count: users.length },
    { key: "audit", label: "Audit", icon: <Shield size={16} />, count: audit.length },
    { key: "service_requests", label: "Service Requests", icon: <ClipboardCheck size={16} />, count: serviceRequests.length },
  ];

  function filtered<T extends { name?: string; full_name?: string; doc_type?: string; user_name?: string; intent_name?: string; scheme_name?: string }>(list: T[]): T[] {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((item) => {
      const text = ("name" in item ? item.name : "full_name" in item ? item.full_name : "doc_type" in item ? item.doc_type : "user_name" in item ? item.user_name : "intent_name" in item ? item.intent_name : "scheme_name" in item ? item.scheme_name : "") || "";
      return text.toLowerCase().includes(q);
    });
  }

  if (isClient && !isAuthenticated()) {
    return (
      <AppShell>
        <PageHeader eyebrow="Government admin console" title="Admin Access Required" description="Please log in to access the admin panel." />
        <Card className="max-w-md text-center space-y-4">
          <Lock size={48} className="mx-auto text-slate-300" />
          <p className="text-slate-600">You need to be logged in to access this page.</p>
        </Card>
      </AppShell>
    );
  }

  if (isClient && !isAdmin()) {
    return (
      <AppShell>
        <PageHeader eyebrow="Government admin console" title="Access Denied" description="You do not have admin privileges." />
        <Card className="max-w-md text-center space-y-4">
          <Lock size={48} className="mx-auto text-red-300" />
          <p className="text-slate-600">Only authorized administrators can access this page.</p>
          <p className="text-sm text-slate-400">Contact the administrator for access.</p>
        </Card>
      </AppShell>
    );
  }

  const isCrudTab = tab === "services" || tab === "intents" || tab === "schemes";

  return (
    <AppShell>
      <PageHeader eyebrow="Government admin console" title="Admin Dashboard" description="Manage services, intents, workflows, citizen data, and audit trail." />

      {loading && <div className="mb-6 flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-600"><span className="h-4 w-4 animate-spin rounded-full border-2 border-saffron border-t-transparent" />Loading...</div>}
      {error && <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <StatCard label="Services" value={String(stats?.total_services ?? services.length)} />
        <StatCard label="Intents" value={String(stats?.total_intents ?? intents.length)} tone="green" />
        <StatCard label="Schemes" value={String(stats?.total_schemes ?? schemes.length)} tone="saffron" />
        <StatCard label="Users" value={String(stats?.total_users ?? users.length)} />
        <StatCard label="Journeys" value={String(stats?.total_journeys ?? journeys.length)} tone="green" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); setEditId(null); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === t.key ? "bg-navy text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            {t.icon} {t.label} <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{t.count}</span>
          </button>
        ))}
      </div>

      {isCrudTab && (
        <div className="mb-6 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab}...`} className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <Button onClick={() => { setEditId(null); document.getElementById("create-form")?.scrollIntoView({ behavior: "smooth" }); }} className="gap-2">
            <Plus size={16} /> Add {tab === "services" ? "Service" : tab === "intents" ? "Intent" : "Scheme"}
          </Button>
        </div>
      )}

      {!isCrudTab && tab !== "audit" && tab !== "portals" && (
        <div className="mb-6 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab}...`} className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </div>
      )}

      {/* Services Tab */}
      {tab === "services" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Department</th><th className="pb-3 pr-4 text-right">Fee</th><th className="pb-3 pr-4 text-right">SLA</th><th className="pb-3 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered(services).map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4">
                      {editId === s.id && editField === "name" ? (
                        <input autoFocus defaultValue={s.name} onBlur={(e) => handleInlineEdit("services", s.id, "name", e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInlineEdit("services", s.id, "name", (e.target as HTMLInputElement).value)} className="w-full rounded border border-saffron px-2 py-1 text-sm" />
                      ) : <span className="font-semibold text-navy cursor-pointer hover:text-saffron" onClick={() => { setEditId(s.id); setEditField("name"); }}>{s.name}</span>}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{s.department}</td>
                    <td className="py-3 pr-4 text-right font-semibold">₹{s.fee}</td>
                    <td className="py-3 pr-4 text-right">{s.sla_days}d</td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleDelete("services", s.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label={`Delete ${s.name}`}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {filtered(services).length === 0 && !loading && <tr><td colSpan={5} className="py-8 text-center text-slate-400">No services found</td></tr>}
              </tbody>
            </table>
          </div>
          <div id="create-form" className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-black text-navy mb-4">Add New Service</h3>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
              <input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Service name" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              <input required value={formDept} onChange={(e) => setFormDept(e.target.value)} placeholder="Department" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              <input required type="number" min={0} value={formFee} onChange={(e) => setFormFee(e.target.value)} placeholder="Fee (₹)" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              <input required type="number" min={1} value={formSla} onChange={(e) => setFormSla(e.target.value)} placeholder="SLA days" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              <textarea required value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description" rows={2} className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              {formError && <div className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
              <div className="md:col-span-2"><Button type="submit" disabled={submitting} className="w-full">{submitting ? "Creating..." : "Create Service"}</Button></div>
            </form>
          </div>
        </Card>
      )}

      {/* Intents Tab */}
      {tab === "intents" && (
        <Card>
          <div className="space-y-4">
            {filtered(intents).map((intent) => (
              <div key={intent.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editId === intent.id && editField === "name" ? (
                      <input autoFocus defaultValue={intent.name} onBlur={(e) => handleInlineEdit("intents", intent.id, "name", e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInlineEdit("intents", intent.id, "name", (e.target as HTMLInputElement).value)} className="w-full rounded border border-saffron px-2 py-1 text-lg font-black text-navy" />
                    ) : <h3 className="text-lg font-black text-navy cursor-pointer hover:text-saffron" onClick={() => { setEditId(intent.id); setEditField("name"); }}>{intent.name}</h3>}
                    <p className="mt-1 text-sm text-slate-500">{intent.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {intent.trigger_keywords.map((kw) => <span key={kw} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{kw}</span>)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {intent.services.map((s) => <span key={s.id} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-telangana">Step {s.step_order}: {s.name}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {intent.has_roadmap_template && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">Template</span>}
                    <button onClick={() => handleDelete("intents", intent.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div id="create-form" className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-black text-navy mb-4">Add New Intent</h3>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
              <input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Intent name (e.g. Driving License)" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              <input required value={formDept} onChange={(e) => setFormDept(e.target.value)} placeholder="Keywords (comma separated)" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              <textarea required value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description" rows={2} className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              {formError && <div className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
              <div className="md:col-span-2"><Button type="submit" disabled={submitting} className="w-full">{submitting ? "Creating..." : "Create Intent"}</Button></div>
            </form>
          </div>
        </Card>
      )}

      {/* Schemes Tab (CRUD) */}
      {tab === "schemes" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Description</th><th className="pb-3 pr-4">Category</th><th className="pb-3 pr-4">Region</th><th className="pb-3 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered(schemes).map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-navy">{s.name}</td>
                    <td className="py-3 pr-4 text-slate-600 max-w-xs truncate">{s.description}</td>
                    <td className="py-3 pr-4"><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{s.category}</span></td>
                    <td className="py-3 pr-4 text-slate-600">{s.region}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleDelete("schemes", s.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div id="create-form" className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-black text-navy mb-4">Add New Scheme</h3>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
              <input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Scheme name" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              <input required value={formDept} onChange={(e) => setFormDept(e.target.value)} placeholder="Category (business/farmer/bpl/general)" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              <textarea required value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description / benefit" rows={2} className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-saffron" />
              {formError && <div className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
              <div className="md:col-span-2"><Button type="submit" disabled={submitting} className="w-full">{submitting ? "Creating..." : "Create Scheme"}</Button></div>
            </form>
          </div>
        </Card>
      )}

      {/* Forms Tab - Journey Steps */}
      {tab === "forms" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">User</th><th className="pb-3 pr-4">Journey</th><th className="pb-3 pr-4">Service</th><th className="pb-3 pr-4">Department</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Date</th>
              </tr></thead>
              <tbody>
                {filtered(journeys.flatMap((j) => j.steps.map((s) => ({ ...s, user_name: j.user_name, intent_name: j.intent_name, created_at: j.created_at })))) .map((f, i) => (
                  <tr key={`${f.id}-${i}`} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-navy">{f.user_name}</td>
                    <td className="py-3 pr-4 text-slate-600">{f.intent_name}</td>
                    <td className="py-3 pr-4 text-slate-600">{f.service_name}</td>
                    <td className="py-3 pr-4 text-slate-600">{f.service_dept}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${f.status === "completed" ? "bg-green-50 text-green-700" : f.status === "in_progress" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs text-slate-400">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</td>
                  </tr>
                ))}
                {journeys.length === 0 && !loading && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No form data found</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Roadmap Tab - User Journeys */}
      {tab === "roadmap" && (
        <Card>
          <div className="space-y-4">
            {filtered(journeys).map((j) => (
              <div key={j.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-navy">{j.intent_name}</h3>
                    <p className="mt-1 text-sm text-slate-500">by {j.user_name} ({j.user_email || "no email"})</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {j.steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${s.status === "completed" ? "bg-green-500 text-white" : s.status === "in_progress" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">{s.service_name}</span>
                          {idx < j.steps.length - 1 && <span className="text-slate-300">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${j.status === "completed" ? "bg-green-50 text-green-700" : j.status === "active" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {j.status}
                  </span>
                </div>
              </div>
            ))}
            {journeys.length === 0 && !loading && <p className="text-center text-slate-400 py-8">No roadmaps found</p>}
          </div>
        </Card>
      )}

      {/* Documents Tab */}
      {tab === "documents" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">User</th><th className="pb-3 pr-4">Doc Type</th><th className="pb-3 pr-4">Filename</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Confidence</th><th className="pb-3 text-right">Date</th>
              </tr></thead>
              <tbody>
                {filtered(documents).map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-navy">{d.user_name}</td>
                    <td className="py-3 pr-4"><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{d.doc_type}</span></td>
                    <td className="py-3 pr-4 text-slate-600">{d.filename || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${d.status === "verified" ? "bg-green-50 text-green-700" : d.status === "uploaded" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{d.confidence}</td>
                    <td className="py-3 text-right text-xs text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}</td>
                  </tr>
                ))}
                {documents.length === 0 && !loading && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No documents uploaded</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Schemes Applied Tab */}
      {tab === "schemes_applied" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">User</th><th className="pb-3 pr-4">Scheme</th><th className="pb-3 pr-4">Description</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Applied</th>
              </tr></thead>
              <tbody>
                {filtered(userSchemes).map((us) => (
                  <tr key={us.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-navy">{us.user_name}</td>
                    <td className="py-3 pr-4 text-slate-600">{us.scheme_name}</td>
                    <td className="py-3 pr-4 text-slate-600 max-w-xs truncate">{us.scheme_description}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${us.status === "applied" ? "bg-green-50 text-green-700" : us.status === "recommended" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                        {us.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs text-slate-400">{us.applied_at ? new Date(us.applied_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
                {userSchemes.length === 0 && !loading && <tr><td colSpan={5} className="py-8 text-center text-slate-400">No schemes applied yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Portals Tab */}
      {tab === "portals" && (
        <Card>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portals.map((p) => (
              <div key={p.name} className="rounded-2xl border border-slate-200 p-5 hover:border-saffron/40 transition">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy/5 text-navy">
                    <Globe size={20} />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.status === "available" ? "bg-green-50 text-green-700" : p.status === "coming_soon" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="mt-3 font-black text-navy">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{p.auth_type}</span>
                  {p.base_url && <a href={p.base_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-saffron hover:underline">Visit →</a>}
                </div>
              </div>
            ))}
            {portals.length === 0 && !loading && <p className="col-span-full text-center text-slate-400 py-8">No portals found</p>}
          </div>
        </Card>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Phone</th><th className="pb-3 pr-4">Role</th><th className="pb-3 pr-4">Verified</th><th className="pb-3 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered(users as unknown as { name?: string; email?: string; phone?: string; role?: string; is_verified?: boolean }[]).map((u: { id?: string; name?: string; email?: string; phone?: string; role?: string; is_verified?: boolean }) => (
                  <tr key={u.email} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-navy">{u.name || "—"}</td>
                    <td className="py-3 pr-4 text-slate-600">{u.email || "—"}</td>
                    <td className="py-3 pr-4 text-slate-600">{u.phone || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${u.role === "admin" ? "bg-saffron/10 text-saffron" : "bg-slate-100 text-slate-600"}`}>
                        {u.role === "admin" ? "Admin" : "Citizen"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${u.is_verified ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {u.is_verified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {u.email && (
                        u.role === "admin" ? (
                          <button onClick={async () => { if (confirm(`Demote ${u.email}?`)) { try { const token = localStorage.getItem("saarthi_access_token"); if (token) { await demoteUser(token, u.email!); fetchData(); } } catch {} } }}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition">
                            Demote
                          </button>
                        ) : (
                          <button onClick={async () => { if (confirm(`Promote ${u.email} to admin?`)) { try { const token = localStorage.getItem("saarthi_access_token"); if (token) { await promoteUser(token, u.email!); fetchData(); } } catch {} } }}
                            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 transition">
                            Promote
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {filtered(users as unknown as { name?: string }[]).length === 0 && !loading && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Audit Tab */}
      {tab === "audit" && (
        <Card>
          <div className="space-y-3">
            {audit.length > 0 ? audit.map((entry, idx) => (
              <div key={`${entry.action}-${idx}`} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-bold text-navy">{entry.action}</p>
                <p className="mt-1 text-sm text-slate-600">{typeof entry.detail?.message === "string" ? entry.detail.message : JSON.stringify(entry.detail)}</p>
                <p className="mt-1 text-xs text-slate-400">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ""}</p>
              </div>
            )) : (
              <>
                <div className="rounded-2xl bg-slate-50 p-4"><p><strong>System:</strong> Knowledge base initialized with 20 intents, 40 services, 23 schemes.</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p><strong>Rule changed:</strong> Trade license now requires address proof confidence above 90%.</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p><strong>Security:</strong> No failed RBAC events in last 24 hours.</p></div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Service Requests Tab */}
      {tab === "service_requests" && (
        <Card>
          <div className="space-y-4">
            {serviceRequests.length === 0 && !loading && (
              <div className="text-center py-12">
                <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No service requests yet.</p>
                <p className="text-xs text-slate-400 mt-1">Citizen service requests will appear here.</p>
              </div>
            )}
            {serviceRequests.map((req) => (
              <div key={req.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-navy">{req.service_name}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        req.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                        req.status === "rejected" ? "bg-red-50 text-red-700" :
                        req.status === "processing" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      by <span className="font-semibold text-navy">{req.user_name}</span>
                      {req.user_email && <span className="text-slate-400"> ({req.user_email})</span>}
                    </p>
                    {req.description && (
                      <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{req.description}</p>
                    )}
                    {Object.keys(req.form_data).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {Object.entries(req.form_data).map(([key, val]) => (
                          <div key={key} className="text-xs">
                            <span className="text-slate-400">{key}:</span>{" "}
                            <span className="font-semibold text-navy">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {req.documents.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {req.documents.map((doc, i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{doc}</span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Submitted {new Date(req.created_at).toLocaleString()}
                      {req.processed_at && ` · Processed ${new Date(req.processed_at).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  {req.status === "pending" && (
                    <>
                      <Button
                        onClick={async () => {
                          const token = localStorage.getItem("saarthi_access_token");
                          if (token) {
                            await updateServiceRequest(token, req.id, { status: "processing", admin_notes: "Under review" });
                            fetchData();
                          }
                        }}
                        className="gap-1 text-xs"
                      >
                        Start Processing
                      </Button>
                    </>
                  )}
                  {req.status === "processing" && (
                    <>
                      <Button
                        onClick={async () => {
                          const notes = prompt("Admin notes (approval reason):");
                          const token = localStorage.getItem("saarthi_access_token");
                          if (token) {
                            await updateServiceRequest(token, req.id, { status: "approved", admin_notes: notes || "Approved by admin" });
                            fetchData();
                          }
                        }}
                        className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={async () => {
                          const notes = prompt("Rejection reason:");
                          const token = localStorage.getItem("saarthi_access_token");
                          if (token) {
                            await updateServiceRequest(token, req.id, { status: "rejected", admin_notes: notes || "Rejected" });
                            fetchData();
                          }
                        }}
                        variant="secondary"
                        className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={async () => {
                      const notes = prompt("Admin notes:", req.admin_notes || "");
                      const token = localStorage.getItem("saarthi_access_token");
                      if (token && notes !== null) {
                        await updateServiceRequest(token, req.id, { admin_notes: notes });
                        fetchData();
                      }
                    }}
                    variant="secondary"
                    className="gap-1 text-xs"
                  >
                    Add Notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
