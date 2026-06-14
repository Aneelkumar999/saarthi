"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { fetchGovPortals, type GovPortal } from "@/lib/api";
import { useIsClient } from "@/lib/use-is-client";
import { ExternalLink, Globe, Key, Unlock, CheckCircle2, XCircle } from "lucide-react";

const authIcon: Record<string, typeof Globe> = {
  api_key: Key,
  oauth2: Unlock,
  public: Globe,
};

export default function PortalsPage() {
  const isClient = useIsClient();
  const [portals, setPortals] = useState<GovPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isClient) return;
    fetchGovPortals()
      .then(setPortals)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load portals"))
      .finally(() => setLoading(false));
  }, [isClient]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Government API Gateway"
        title="Integrated Government Portals"
        description="Submit applications, check status, and fetch documents directly from connected government portals."
      />
      {loading && <p className="font-bold text-slate-600">Loading portals...</p>}
      {error && <p className="font-bold text-red-500">{error}</p>}
      {!loading && !error && portals.length === 0 && (
        <p className="text-slate-500">No government portals configured.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {portals.map((portal) => {
          const AuthIcon = authIcon[portal.auth_type] || Globe;
          return (
            <Card key={portal.id} className="flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy">{portal.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{portal.id}</p>
                </div>
                {portal.status === "connected" ? (
                  <CheckCircle2 size={20} className="shrink-0 text-teal-500" />
                ) : (
                  <XCircle size={20} className="shrink-0 text-slate-300" />
                )}
              </div>
              <p className="mt-3 text-sm text-slate-600">{portal.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <AuthIcon size={14} />
                <span className="font-semibold capitalize">{portal.auth_type.replace("_", " ")}</span>
              </div>
              <div className="mt-4 flex-1">
                <p className="text-xs font-bold text-navy">Supported Services ({portal.supported_services.length})</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {portal.supported_services.map((svc) => (
                    <span key={svc} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{svc}</span>
                  ))}
                </div>
              </div>
              <a
                href={portal.base_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron hover:underline"
              >
                Visit Portal <ExternalLink size={14} />
              </a>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
