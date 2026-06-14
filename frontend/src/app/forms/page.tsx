"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildFormFields, getDocuments, getRoadmap, type SavedDocument, type SavedRoadmap } from "@/lib/journey";
import { useIsClient } from "@/lib/use-is-client";
import { Check, FileText, Download, Upload } from "lucide-react";

export default function FormsPage() {
  const isClient = useIsClient();
  const roadmap: SavedRoadmap | null = isClient ? getRoadmap() : null;
  const docs: SavedDocument[] = isClient ? getDocuments() : [];
  const formFields = buildFormFields(roadmap, docs);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    () => Object.fromEntries(formFields.map((f) => [f.label, f.value]))
  );

  const requiredFields = formFields.filter((f) => f.required);
  const filledRequired = requiredFields.filter((f) => fieldValues[f.label]);
  const allDocTypes = new Set(docs.map((d) => d.type.toLowerCase()));
  const neededDocs = roadmap ? roadmap.steps.flatMap((s) => s.documents) : [];
  const uniqueNeededDocs = [...new Set(neededDocs)];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Form auto-fill"
        title={roadmap ? `${roadmap.steps[0]?.title} — Application Form` : "Generate a roadmap first"}
        description={roadmap ? `Auto-filled from your uploaded documents. Review and complete the remaining fields before downloading.` : "Go to the chat and describe your goal to generate a roadmap with a service-specific form."}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-navy">{roadmap?.steps[0]?.title ?? "No service selected"}</h2>
                <p className="text-sm text-slate-500">
                  {filledRequired.length}/{requiredFields.length} required fields filled
                  {filledRequired.length === requiredFields.length ? " — Ready to download" : ` — ${requiredFields.length - filledRequired.length} fields remaining`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => downloadChecklist(roadmap, docs)} className="gap-2">
                  <Download size={16} /> Download Checklist
                </Button>
                <Button onClick={() => downloadFilledForm(roadmap, formFields, fieldValues)} className="gap-2">
                  <Download size={16} /> Download Form
                </Button>
              </div>
            </div>

            {filledRequired.length < requiredFields.length && (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <strong>Action needed:</strong> Fill in the empty fields below, then download the completed form.
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {formFields.map((field) => (
                <label key={field.label} className={`block rounded-2xl border p-4 ${fieldValues[field.label] ? "border-teal-200 bg-teal-50/30" : field.required ? "border-amber-200 bg-amber-50/30" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">{field.label}</span>
                    {field.required && <span className="text-xs font-bold text-amber-600">Required</span>}
                  </div>
                  <input
                    className="mt-2 w-full rounded-xl bg-white px-3 py-3 font-semibold text-navy outline-none border border-slate-200 focus:border-saffron"
                    value={fieldValues[field.label] ?? ""}
                    onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.label]: e.target.value }))}
                    placeholder={field.value ? "" : `Enter ${field.label.toLowerCase()}...`}
                  />
                  <span className="mt-2 block text-xs text-telangana">
                    {field.source ? `${field.source} — ${field.confidence}` : "Not yet filled"}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black text-navy">Document Checklist</h2>
            <p className="mt-2 text-sm text-slate-500">Documents needed for this service</p>
            <div className="mt-4 space-y-2">
              {uniqueNeededDocs.map((doc) => {
                const isUploaded = [...allDocTypes].some((t) => doc.toLowerCase().includes(t) || t.includes(doc.toLowerCase()));
                return (
                  <div key={doc} className={`flex items-center gap-3 rounded-xl p-3 text-sm ${isUploaded ? "bg-teal-50 text-telangana" : "bg-slate-50 text-slate-600"}`}>
                    {isUploaded ? <Check size={16} className="shrink-0" /> : <Upload size={16} className="shrink-0 text-slate-400" />}
                    <span className={isUploaded ? "font-semibold" : ""}>{doc}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/workflow" className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-navy hover:bg-slate-50">
              <Upload size={16} /> Upload Documents
            </Link>
          </Card>

          <Card>
            <h2 className="text-xl font-black text-navy">How it works</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex gap-3"><FileText size={16} className="mt-0.5 shrink-0 text-saffron" /><p><strong>Step 1:</strong> Generate a roadmap in chat by describing your goal.</p></div>
              <div className="flex gap-3"><Upload size={16} className="mt-0.5 shrink-0 text-saffron" /><p><strong>Step 2:</strong> Upload documents (Aadhaar, PAN, etc.) from the workflow page.</p></div>
              <div className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0 text-saffron" /><p><strong>Step 3:</strong> Review auto-filled fields and complete any missing ones.</p></div>
              <div className="flex gap-3"><Download size={16} className="mt-0.5 shrink-0 text-saffron" /><p><strong>Step 4:</strong> Download the filled form and submit to the department.</p></div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black text-navy">Related Services</h2>
            <div className="mt-4 grid gap-3">
              {roadmap?.schemes?.slice(0, 3).map((scheme) => (
                <div key={scheme} className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-navy">{scheme}</div>
              ))}
              <Link href="/schemes" className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-bold text-navy">View All Schemes</Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function downloadChecklist(roadmap: SavedRoadmap | null, docs: SavedDocument[]) {
  const neededDocs = roadmap ? [...new Set(roadmap.steps.flatMap((s) => s.documents))] : [];
  const docTypes = new Set(docs.map((d) => d.type.toLowerCase()));

  const lines = [
    "=".repeat(60),
    "  SAARTHI AI - DOCUMENT CHECKLIST",
    "=".repeat(60),
    "",
    `Service: ${roadmap?.steps[0]?.title ?? "Government Service"}`,
    `Goal: ${roadmap?.goal ?? ""}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "-".repeat(60),
    "  REQUIRED DOCUMENTS",
    "-".repeat(60),
    "",
    ...neededDocs.map((doc) => {
      const lower = doc.toLowerCase();
      const uploaded = [...docTypes].some((dt) => dt.includes(lower.split(" ")[0]) || lower.includes(dt));
      return `  ${uploaded ? "[x]" : "[ ]"} ${doc}`;
    }),
    "",
    "-".repeat(60),
    "  UPLOADED DOCUMENTS",
    "-".repeat(60),
    "",
    ...(docs.length ? docs.map((d) => `  [x] ${d.type} — ${d.name} (${d.confidence})`) : ["  No documents uploaded yet"]),
    "",
    "=".repeat(60),
    "  Generated by Saarthi AI",
    "=".repeat(60),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "saarthi-document-checklist.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function downloadFilledForm(
  roadmap: SavedRoadmap | null,
  fields: ReturnType<typeof buildFormFields>,
  fieldValues: Record<string, string>
) {
  const title = roadmap?.steps[0]?.title ?? "Government Service";
  const dept = roadmap?.steps[0]?.dept ?? "Relevant Department";
  const location = roadmap?.location ?? "Telangana";
  const goal = roadmap?.goal ?? "";

  const lines = [
    "=".repeat(60),
    "           SAARTHI AI — GOVERNMENT APPLICATION FORM",
    "=".repeat(60),
    "",
    `Service: ${title}`,
    `Department: ${dept}`,
    `Location: ${location}`,
    `Application For: ${goal}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "-".repeat(60),
    "  APPLICANT DETAILS",
    "-".repeat(60),
    "",
    ...fields.filter((f) => f.required).map((f) => `  ${f.label}: ${fieldValues[f.label] || "____________________"}`),
    "",
    "-".repeat(60),
    "  ADDITIONAL INFORMATION",
    "-".repeat(60),
    "",
    ...fields.filter((f) => !f.required).map((f) => `  ${f.label}: ${fieldValues[f.label] || "____________________"}`),
    "",
    "-".repeat(60),
    "  REQUIRED DOCUMENTS",
    "-".repeat(60),
    "",
    ...((roadmap?.steps.flatMap((s) => s.documents) ?? []).filter((v, i, a) => a.indexOf(v) === i)).map((doc) => `  [ ] ${doc}`),
    "",
    "-".repeat(60),
    "  WORKFLOW STEPS",
    "-".repeat(60),
    "",
    ...(roadmap?.steps ?? []).map((s) => `  ${s.id}. ${s.title} (${s.dept}) — ${s.days}`),
    "",
    "-".repeat(60),
    "  APPLICANT DECLARATION",
    "-".repeat(60),
    "",
    "  I hereby declare that the information provided above is true",
    "  and correct to the best of my knowledge.",
    "",
    "  Signature: ____________________     Date: ____________________",
    "",
    "=".repeat(60),
    "  Generated by Saarthi AI — Your Government Service Navigator",
    "=".repeat(60),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `saarthi-${title.toLowerCase().replace(/\s+/g, "-")}-form.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
