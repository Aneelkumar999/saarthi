"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getToken, isAuthenticated } from "@/lib/auth";
import { createServiceRequest, fetchMyServiceRequests } from "@/lib/api";
import { useIsClient } from "@/lib/use-is-client";
import { Send, Clock, CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";

interface ServiceRequest {
  id: number;
  service_name: string;
  service_type: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

const SERVICE_OPTIONS = [
  { name: "Trade License", type: "trade_license", description: "Apply for GHMC trade license for your business" },
  { name: "Birth Certificate", type: "birth_certificate", description: "Register and obtain birth certificate" },
  { name: "Marriage Certificate", type: "marriage_certificate", description: "Register marriage and get certificate" },
  { name: "Property Registration", type: "property_registration", description: "Register property sale deed" },
  { name: "Income Certificate", type: "income_certificate", description: "Get income certificate from Revenue Dept" },
  { name: "Caste Certificate", type: "caste_certificate", description: "Get caste/community certificate" },
  { name: "FSSAI Registration", type: "fssai_registration", description: "Food business safety license" },
  { name: "Driving License", type: "driving_license", description: "Apply for learner/permanent DL" },
  { name: "GST Registration", type: "gst_registration", description: "Register for Goods & Services Tax" },
  { name: "UDYAM / MSME", type: "udyam_registration", description: "Register small business under MSME" },
  { name: "PM SVANidhi", type: "pm_svanidhi", description: "Street vendor loan scheme" },
  { name: "Rythu Bandhu", type: "rythu_bandhu", description: "Farmer investment support scheme" },
  { name: "Building Plan Approval", type: "building_plan", description: "Get building plan sanctioned by GHMC" },
  { name: "Fire NOC", type: "fire_noc", description: "Fire safety no objection certificate" },
  { name: "Other", type: "other", description: "Any other government service" },
];

function statusIcon(status: string) {
  if (status === "approved" || status === "completed") return <CheckCircle2 size={16} className="text-emerald-500" />;
  if (status === "rejected") return <XCircle size={16} className="text-red-500" />;
  return <Clock size={16} className="text-amber-500" />;
}

function statusColor(status: string) {
  if (status === "approved" || status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

export default function ServiceRequestsPage() {
  const isClient = useIsClient();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState(SERVICE_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isClient || !isAuthenticated()) return;
    const token = getToken();
    if (!token) return;
    fetchMyServiceRequests(token)
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isClient]);

  async function handleSubmit() {
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await createServiceRequest(token, {
        service_name: selectedService.name,
        service_type: selectedService.type,
        description,
      });
      setMessage("Service request submitted! Admin will review and process it.");
      setShowForm(false);
      setDescription("");
      const updated = await fetchMyServiceRequests(token);
      setRequests(Array.isArray(updated) ? updated : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Government services"
        title="Service Requests"
        description="Submit requests for government services. Our admin team will process your application and handle it on your behalf."
      />

      {message && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-700">{message}</div>
      )}

      <div className="mb-6">
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Send size={16} /> {showForm ? "Cancel" : "New Service Request"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <h2 className="text-xl font-black text-navy mb-4">Submit Service Request</h2>
          <p className="text-sm text-slate-500 mb-6">Select the government service you need. Our admin will process the application on your behalf.</p>
          
          <div className="grid gap-3 md:grid-cols-3 mb-6">
            {SERVICE_OPTIONS.map((svc) => (
              <button
                key={svc.type}
                onClick={() => setSelectedService(svc)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedService.type === svc.type
                    ? "border-saffron bg-saffron/5 ring-2 ring-saffron/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-bold text-navy text-sm">{svc.name}</p>
                <p className="text-xs text-slate-500 mt-1">{svc.description}</p>
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="text-sm font-bold text-slate-700" htmlFor="description">Additional Details</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
              placeholder="Describe your requirement, any specific details, or documents you have ready..."
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-black text-navy mb-4">My Service Requests</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No service requests yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Service Request" above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {statusIcon(req.status)}
                      <h3 className="font-bold text-navy">{req.service_name}</h3>
                    </div>
                    {req.description && (
                      <p className="mt-1 text-sm text-slate-500">{req.description}</p>
                    )}
                    {req.admin_notes && (
                      <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
                        <strong>Admin:</strong> {req.admin_notes}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Submitted {new Date(req.created_at).toLocaleDateString()}
                      {req.processed_at && ` · Processed ${new Date(req.processed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
