"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadDocument } from "@/lib/api";
import { createMockDocument, getDocuments, saveDocument, type SavedDocument } from "@/lib/journey";
import { useIsClient } from "@/lib/use-is-client";

export default function DocumentsPage() {
  const isClient = useIsClient();
  const [result, setResult] = useState<string>("");
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>(() => isClient ? getDocuments() : []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayDocs = isClient ? savedDocs : [];

  async function onFileChange(file?: File) {
    if (!file) return;
    setResult("Processing OCR...");
    let document = createMockDocument(file.name);

    try {
      const response = await uploadDocument(file);
      const extracted = response.extracted_data?.extracted_fields ?? {};
      document = {
        ...document,
        fields: {
          ...document.fields,
          name: extracted.name && extracted.name !== "Extracted from OCR" ? extracted.name : document.fields.name,
          idNumber: extracted.id_number && extracted.id_number !== "Pending verification" ? extracted.id_number : document.fields.idNumber
        }
      };
      setResult(JSON.stringify(response.extracted_data ?? response, null, 2));
    } catch {
      setResult(JSON.stringify({ message: "Mock OCR complete", document }, null, 2));
    }

    saveDocument(document);
    setSavedDocs(getDocuments());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Secure document vault" title="Upload once, reuse across services" description="OCR extracts profile fields from Aadhaar, PAN, certificates, and agreements, then asks the citizen to verify before auto-fill." />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <UploadCloud className="mx-auto text-saffron" size={42} />
            <h2 className="mt-4 text-xl font-black text-navy">Upload Aadhaar, PAN, certificates</h2>
            <p className="mt-2 text-sm text-slate-500">PNG/JPG/PDF demo upload. Backend OCR route is used when available.</p>
            <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-saffron px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">
              Select document
              <input type="file" className="hidden" ref={fileInputRef} onChange={(event) => onFileChange(event.target.files?.[0])} />
            </label>
          </div>
          {result && <pre className="mt-5 max-h-64 overflow-auto rounded-2xl bg-navy p-4 text-xs leading-6 text-white">{result}</pre>}
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-navy">Checklist status</h2>
            <Button variant="outline" onClick={() => downloadChecklist(displayDocs)}>Download checklist</Button>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Document</th><th className="p-4">Status</th><th className="p-4">Extracted Fields</th><th className="p-4">Confidence</th></tr></thead>
              <tbody>
                {(displayDocs.length ? displayDocs : [
                  { id: "empty-aadhaar", name: "Aadhaar", type: "Aadhaar", state: "Missing", fields: {}, confidence: "-", createdAt: "" },
                  { id: "empty-pan", name: "PAN", type: "PAN", state: "Missing", fields: {}, confidence: "-", createdAt: "" },
                  { id: "empty-rental", name: "Rental Agreement", type: "Rental Agreement", state: "Missing", fields: {}, confidence: "-", createdAt: "" }
                ]).map((doc) => <tr key={doc.id} className="border-t border-slate-100"><td className="p-4 font-bold text-navy">{doc.type}</td><td className="p-4">{doc.state}</td><td className="p-4 text-slate-500">{Object.keys(doc.fields).join(", ") || "Upload required"}</td><td className="p-4 text-telangana">{doc.confidence}</td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function downloadChecklist(docs: SavedDocument[]) {
  const required = ["Aadhaar", "PAN", "Rental Agreement"];
  const uploaded = new Set(docs.map((doc) => doc.type));
  const lines = [
    "Saarthi AI Document Checklist",
    "",
    ...required.map((item) => `${uploaded.has(item) ? "[x]" : "[ ]"} ${item}`),
    "",
    "Uploaded documents:",
    ...(docs.length ? docs.map((doc) => `- ${doc.type}: ${doc.state}, confidence ${doc.confidence}`) : ["- None yet"])
  ];
  downloadText("saarthi-document-checklist.txt", lines.join("\n"));
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
