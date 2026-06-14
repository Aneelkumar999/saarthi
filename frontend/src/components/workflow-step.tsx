"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, LockKeyhole, MapPin, Upload, Check, ExternalLink, Building2, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createMockDocument, saveDocument, getDocuments } from "@/lib/journey";
import { getToken, getStoredUser } from "@/lib/auth";
import { submitToGovPortal } from "@/lib/api";
import Link from "next/link";

const statusIcon = {
  Ready: CheckCircle2,
  "Blocked by Step 1": LockKeyhole,
  Pending: Clock3,
  Optional: MapPin
};

function getUploadedDocTypes(): Set<string> {
  const docs = getDocuments();
  return new Set(docs.map((d) => d.type.toLowerCase()));
}

function getDocTypeFromName(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes("aadhaar")) return "Aadhaar";
  if (lower.includes("pan")) return "PAN";
  if (lower.includes("rent") || lower.includes("agreement")) return "Rental Agreement";
  if (lower.includes("photo") || lower.includes("passport photo")) return "Photo";
  if (lower.includes("bank")) return "Bank Passbook";
  if (lower.includes("income")) return "Income Certificate";
  if (lower.includes("caste") || lower.includes("community") || lower.includes("category")) return "Caste Certificate";
  if (lower.includes("birth")) return "Birth Certificate";
  if (lower.includes("marriage")) return "Marriage Certificate";
  if (lower.includes("property") || lower.includes("land") || lower.includes("survey") || lower.includes("pattadar") || lower.includes("title") || lower.includes("encumbrance") || lower.includes("sale")) return "Property Document";
  if (lower.includes("vehicle")) return "Vehicle Document";
  if (lower.includes("medical")) return "Medical Certificate";
  if (lower.includes("bonafide") || lower.includes("degree") || lower.includes("marksheet") || lower.includes("academic")) return "Education Certificate";
  if (lower.includes("salary")) return "Salary Slip";
  if (lower.includes("noc")) return "NOC";
  if (lower.includes("layout") || lower.includes("building") || lower.includes("plan")) return "Building Plan";
  if (lower.includes("food") || lower.includes("menu")) return "Food Business Document";
  if (lower.includes("safety") || lower.includes("fire")) return "Safety Certificate";
  if (lower.includes("crop")) return "Crop Details";
  if (lower.includes("mobile")) return "Mobile Number Proof";
  if (lower.includes("signature")) return "Signature";
  if (lower.includes("voter") || lower.includes("epic")) return "Voter ID";
  if (lower.includes("address")) return "Address Proof";
  if (lower.includes("age")) return "Age Proof";
  if (lower.includes("id proof") || lower.includes("parent")) return "ID Proof";
  if (lower.includes("form")) return "Application Form";
  if (lower.includes("receipt") || lower.includes("acknowledgement") || lower.includes("challan")) return "Receipt";
  if (lower.includes("witness") || lower.includes("invitation")) return "Supporting Document";
  if (lower.includes("test") || lower.includes("learner")) return "License Document";
  if (lower.includes("gas")) return "Gas Connection Proof";
  if (lower.includes("staff")) return "Staff Document";
  if (lower.includes("insurance")) return "Insurance Document";
  return "Document";
}

type WorkflowStepData = {
  id: number;
  title: string;
  dept: string;
  status: string;
  days: string;
  documents: string[];
  portal_id?: string | null;
  portal_name?: string | null;
};

export function WorkflowStep({ step, onUpload }: { step: WorkflowStepData; onUpload?: () => void }) {
  const Icon = statusIcon[step.status as keyof typeof statusIcon] ?? Clock3;
  const uploadedTypes = getUploadedDocTypes();

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ref: string; url: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  async function handlePortalSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = getToken();
      if (!token) { setSubmitError("Please login first"); setSubmitting(false); return; }
      const user = getStoredUser();
      const result = await submitToGovPortal(token, step.portal_id!, step.title, {
        applicant_name: user?.name || "Citizen",
        service: step.title,
        department: step.dept,
      });
      setSubmitResult({ ref: result.application_ref, url: result.tracking_url });
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function handleUpload(docName: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg,.doc,.docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const docType = getDocTypeFromName(docName);
      let document = createMockDocument(file.name);
      document = { ...document, type: docType, name: docName };
      saveDocument(document);
      onUpload?.();
      window.dispatchEvent(new CustomEvent("doc-uploaded"));
      setExpandedDoc(null);
    };
    input.click();
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-saffron" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream text-saffron">
              <Icon size={21} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-400">Step {step.id}</p>
              <h3 className="text-xl font-black text-navy">{step.title}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600">{step.dept}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {step.documents.map((doc) => {
              const docType = getDocTypeFromName(doc);
              const isUploaded = uploadedTypes.has(docType.toLowerCase());
              const isExpanded = expandedDoc === doc;
              return (
                <div key={doc} className="relative">
                  <button
                    onClick={() => setExpandedDoc(isExpanded ? null : doc)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      isUploaded
                        ? "bg-teal-50 text-telangana border border-teal-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-saffron hover:text-white hover:border-saffron cursor-pointer"
                    }`}
                  >
                    {isUploaded ? <Check size={12} /> : <Upload size={12} />}
                    {doc}
                  </button>
                  {isExpanded && (
                    <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                      <p className="text-xs font-bold text-navy mb-2">{doc}</p>
                      {isUploaded ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-telangana font-semibold">
                            <Check size={12} /> Uploaded
                          </div>
                          <Link
                            href="/documents"
                            className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-telangana hover:bg-teal-100 transition"
                          >
                            <FileText size={12} /> View in Documents
                          </Link>
                          <Link
                            href="/forms"
                            className="flex items-center gap-1.5 rounded-lg bg-saffron/10 px-3 py-2 text-xs font-bold text-saffron hover:bg-saffron/20 transition"
                          >
                            <ExternalLink size={12} /> Apply with this document
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500">This document is not uploaded yet.</p>
                          <button
                            onClick={() => handleUpload(doc)}
                            className="flex w-full items-center gap-1.5 rounded-lg bg-saffron px-3 py-2 text-xs font-bold text-white hover:bg-saffron/90 transition"
                          >
                            <Upload size={12} /> Upload now
                          </button>
                          <Link
                            href="/documents"
                            className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                          >
                            <ExternalLink size={12} /> Go to Documents page
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <p className="font-black text-navy">{step.status}</p>
          <p className="mt-1 text-slate-500">Estimated {step.days}</p>
        </div>
      </div>
      {step.portal_id && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {submitResult ? (
            <div className="rounded-xl bg-teal-50 p-3 text-sm">
              <p className="font-semibold text-teal-800 flex items-center gap-1.5">
                <Check size={16} /> Submitted to {step.portal_name}
              </p>
              <p className="mt-1 text-teal-600">Ref: {submitResult.ref}</p>
              <a href={submitResult.url} target="_blank" rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-navy underline">
                Track on portal <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Building2 size={16} />
                <span>Submit via <strong>{step.portal_name}</strong></span>
              </div>
              <div className="flex gap-2">
                <a href={`https://www.meeseva.telangana.gov.in`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Open Portal <ExternalLink size={12} />
                </a>
                <Button variant="secondary" className="rounded-xl px-4 py-1.5 text-xs" onClick={handlePortalSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Now"}
                </Button>
              </div>
            </div>
          )}
          {submitError && <p className="mt-2 text-xs font-semibold text-red-500">{submitError}</p>}
        </div>
      )}
    </Card>
  );
}
