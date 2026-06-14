"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { WorkflowStep } from "@/components/workflow-step";
import { Card } from "@/components/ui/card";
import { generateRoadmap, getRoadmap, saveRoadmap, getDocuments, type SavedRoadmap, type SavedDocument } from "@/lib/journey";
import { useIsClient } from "@/lib/use-is-client";
import { FileText, Check, Clock, AlertTriangle } from "lucide-react";

function getClientRoadmap(): SavedRoadmap {
  const saved = getRoadmap();
  if (saved) return saved;
  const fallback = generateRoadmap("I want to open a tea shop in Hyderabad");
  saveRoadmap(fallback);
  return fallback;
}

export default function WorkflowPage() {
  const isClient = useIsClient();
  const roadmap = isClient ? getClientRoadmap() : null;
  const [docRefreshKey, setDocRefreshKey] = useState(0);

  useEffect(() => {
    function handleDocUpload() {
      setDocRefreshKey((k) => k + 1);
    }
    window.addEventListener("doc-uploaded", handleDocUpload);
    return () => window.removeEventListener("doc-uploaded", handleDocUpload);
  }, []);

  const uploadedDocs = isClient ? getDocuments() : [];
  const uniqueNeededDocs = roadmap ? [...new Set(roadmap.steps.flatMap((s) => s.documents))] : [];

  if (!roadmap) {
    return <AppShell><p className="font-bold text-slate-600">Loading roadmap...</p></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Approval dependency engine" title={roadmap.title} description={`Generated for: ${roadmap.goal}. Upload documents from each step, then review your auto-filled form.`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6" key={docRefreshKey}>
          {roadmap.steps.map((step) => (
            <WorkflowStep key={`${step.id}-${docRefreshKey}`} step={step} onUpload={() => setDocRefreshKey((k) => k + 1)} />
          ))}

          <Card>
            <div className="flex items-center gap-3">
              <FileText className="text-saffron" size={22} />
              <h2 className="text-xl font-black text-navy">Uploaded Documents</h2>
              <span className="ml-auto rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-telangana">{uploadedDocs.length} files</span>
            </div>
            {uploadedDocs.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No documents uploaded yet. Click the upload buttons above to add documents.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3">Document</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedDocs.map((doc: SavedDocument) => (
                      <tr key={doc.id} className="border-t border-slate-100">
                        <td className="p-3 font-semibold text-navy">{doc.name}</td>
                        <td className="p-3 text-slate-600">{doc.type}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${doc.state === "Verified" ? "bg-teal-50 text-telangana" : "bg-amber-50 text-amber-700"}`}>
                            {doc.state === "Verified" ? <Check size={10} /> : <Clock size={10} />}
                            {doc.state}
                          </span>
                        </td>
                        <td className="p-3 text-telangana font-bold">{doc.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <h2 className="text-xl font-black text-navy">Timeline estimate</h2>
          <p className="mt-4 text-5xl font-black text-saffron">{roadmap.timeline}</p>
          <p className="text-sm font-semibold text-slate-500">working days</p>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p><strong>Fastest path:</strong> {roadmap.fastestPath}</p>
            <p><strong>Schemes:</strong> {roadmap.schemes.join(", ")}</p>
            <p><strong>Telugu:</strong> {roadmap.teluguHint}</p>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-navy">Document progress</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-telangana transition-all"
                  style={{ width: `${uniqueNeededDocs.length > 0 ? (uploadedDocs.length / uniqueNeededDocs.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-black text-telangana">{uploadedDocs.length}/{uniqueNeededDocs.length}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {uniqueNeededDocs.slice(0, 6).map((doc) => {
              const isUploaded = uploadedDocs.some((d) => doc.toLowerCase().includes(d.type.toLowerCase()) || d.type.toLowerCase().includes(doc.toLowerCase().split(" ")[0]));
              return (
                <div key={doc} className={`flex items-center gap-2 rounded-xl p-2 text-xs ${isUploaded ? "bg-teal-50 text-telangana" : "bg-slate-50 text-slate-500"}`}>
                  {isUploaded ? <Check size={12} /> : <AlertTriangle size={12} className="text-amber-500" />}
                  <span className={isUploaded ? "font-semibold" : ""}>{doc}</span>
                </div>
              );
            })}
            {uniqueNeededDocs.length > 6 && <p className="text-xs text-slate-400">+{uniqueNeededDocs.length - 6} more documents</p>}
          </div>

          <div className="mt-6 grid gap-3">
            <Link href="/forms" className="rounded-2xl bg-saffron px-5 py-3 text-center text-sm font-bold text-white">Open Auto-Filled Form</Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
