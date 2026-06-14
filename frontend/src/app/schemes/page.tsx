"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Sprout, GraduationCap, Heart, Shield, Users, Check, X, FileText, Download, ChevronRight, AlertTriangle, ExternalLink } from "lucide-react";
import { getDocuments, getRoadmap, saveDocument, createMockDocument, type SavedDocument, type SavedRoadmap } from "@/lib/journey";
import { useIsClient } from "@/lib/use-is-client";

interface Scheme {
  id: number;
  name: string;
  benefit: string;
  category: string;
  region: string;
  description: string;
  eligibility_rules: Record<string, unknown>;
}

interface EligibilityCheck {
  requirement: string;
  met: boolean;
  detail: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

const categories = ["All", "Business", "Farmer", "Student", "BPL", "SC/ST", "General"] as const;

const categoryMeta: Record<string, { icon: React.ElementType; color: string }> = {
  business: { icon: Briefcase, color: "bg-indigo-100 text-indigo-700" },
  farmer: { icon: Sprout, color: "bg-green-100 text-green-700" },
  student: { icon: GraduationCap, color: "bg-amber-100 text-amber-700" },
  bpl: { icon: Heart, color: "bg-rose-100 text-rose-700" },
  "sc/st": { icon: Shield, color: "bg-purple-100 text-purple-700" },
  general: { icon: Users, color: "bg-slate-100 text-slate-700" },
};

const schemeDocuments: Record<string, string[]> = {
  "PM SVANidhi": ["Aadhaar", "Vending certificate / Street vendor ID", "Bank passbook (Aadhaar linked)", "Mobile number"],
  "MUDRA Shishu Loan": ["Aadhaar", "PAN", "Business plan", "Bank passbook", "Address proof", "Passport photos"],
  "MUDRA Kishore Loan": ["Aadhaar", "PAN", "Business plan", "Bank statements (2 years)", "Registration proof", "Quotations for machinery"],
  "MUDRA Tarun Loan": ["Aadhaar", "PAN", "Business plan", "Bank statements (3 years)", "ITR (2 years)", "MSME registration"],
  "PM-KISAN": ["Aadhaar", "Bank passbook (Aadhaar linked)", "Land records / Pattadar passbook", "Mobile number"],
  "Rythu Bandhu": ["Aadhaar", "Bank passbook (Aadhaar linked)", "Land records / Pattadar passbook", "Passbook with survey number"],
  "T-PRIDE Telangana": ["Aadhaar", "Caste certificate", "Income certificate", "Education certificates", "Business plan", "Bank passbook"],
  "PM Jan Dhan Yojana": ["Aadhaar", "Address proof", "Passport photos"],
  "PM Jeevan Jyoti Bima": ["Aadhaar", "Bank passbook", "Nominee details", "Passport photos"],
  "PM Suraksha Bima": ["Aadhaar", "Bank passbook", "Nominee details"],
  "Ayushman Bharat": ["Aadhaar", "Ration card (BPL)", "Family details", "Address proof"],
  "Kalyana Lakshmi": ["Aadhaar (Bride)", "Aadhaar (Groom)", "Caste certificate", "Income certificate", "Marriage photos", "Bank passbook"],
  "Shaadi Mubarak": ["Aadhaar (Bride)", "Aadhaar (Groom)", "Minority certificate", "Income certificate", "Marriage photos", "Bank passbook"],
  "Post Matric Scholarship": ["Aadhaar", "Income certificate", "Bonafide certificate", "Previous marksheets", "Bank passbook (Aadhaar linked)", "Category certificate"],
  "Ration Card - AAY": ["Aadhaar (all family members)", "Address proof", "Income certificate", "Family photo", "Gas connection proof"],
  "Ration Card - PHH": ["Aadhaar (all family members)", "Address proof", "Income certificate", "Family photo"],
  "Ration Card - BPL": ["Aadhaar (all family members)", "Address proof", "Income certificate", "BPL certificate"],
  "Udyog Aadhaar": ["Aadhaar", "PAN", "Business address proof", "Bank details", "Investment proof"],
  "Startup India Seed Fund": ["Aadhaar", "PAN", "DPIIT registration", "Business plan", "Financial projections", "Board resolution"],
  "Skill India Certification": ["Aadhaar", "Address proof", "Age proof", "Passport photos", "Education certificates"],
  "PM Awas Yojana": ["Aadhaar", "Income certificate", "BPL certificate", "Land documents", "Bank passbook", "No house declaration"],
  "Sukanya Samriddhi Yojana": ["Aadhaar (guardian)", "Birth certificate (girl child)", "Address proof", "Passport photos"],
  "Atal Pension Yojana": ["Aadhaar", "Bank passbook", "Mobile number", "Nominee details"],
};

const schemeUrls: Record<string, string> = {
  "PM SVANidhi": "https://pmsvanidhi.mohua.gov.in/",
  "MUDRA Shishu Loan": "https://www.mudra.org.in/",
  "MUDRA Kishore Loan": "https://www.mudra.org.in/",
  "MUDRA Tarun Loan": "https://www.mudra.org.in/",
  "PM-KISAN": "https://pmkisan.gov.in/",
  "Rythu Bandhu": "https://rythubandhu.telangana.gov.in/",
  "T-PRIDE Telangana": "https://telangana.gov.in/",
  "PM Jan Dhan Yojana": "https://www.pmjdby.gov.in/",
  "PM Jeevan Jyoti Bima": "https://jfrjansuraksha.nsdl.com/",
  "PM Suraksha Bima": "https://jfrjansuraksha.nsdl.com/",
  "Ayushman Bharat": "https://abdm.gov.in/",
  "Kalyana Lakshmi": "https://telanganaepass.cgg.gov.in/",
  "Shaadi Mubarak": "https://telanganaepass.cgg.gov.in/",
  "Post Matric Scholarship": "https://scholarships.telangana.gov.in/",
  "Ration Card - AAY": "https://epds.telangana.gov.in/",
  "Ration Card - PHH": "https://epds.telangana.gov.in/",
  "Ration Card - BPL": "https://epds.telangana.gov.in/",
  "Udyog Aadhaar": "https://udyamregistration.gov.in/",
  "Startup India Seed Fund": "https://www.startupindia.gov.in/",
  "Skill India Certification": "https://www.skillindia.gov.in/",
  "PM Awas Yojana": "https://pmaymis.gov.in/",
  "Sukanya Samriddhi Yojana": "https://www.indiapost.gov.in/",
  "Atal Pension Yojana": "https://www.jfrjansuraksha.nsdl.com/",
};

function CategoryBadge({ category }: { category: string }) {
  const key = category.toLowerCase();
  const meta = categoryMeta[key] ?? { icon: Users, color: "bg-slate-100 text-slate-700" };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.color}`}>
      <Icon size={14} />
      {category}
    </span>
  );
}

function checkEligibility(scheme: Scheme, docs: SavedDocument[], roadmap: SavedRoadmap | null): EligibilityCheck[] {
  const rules = scheme.eligibility_rules;
  const docTypes = new Set(docs.map((d) => d.type.toLowerCase()));
  const checks: EligibilityCheck[] = [];

  const requiredDocs = schemeDocuments[scheme.name] || ["Aadhaar", "Address proof"];
  const uploadedAll = requiredDocs.every((rd) => {
    const lower = rd.toLowerCase();
    return [...docTypes].some((dt) => dt.includes(lower.split(" ")[0]) || lower.includes(dt));
  });
  checks.push({
    requirement: "Required documents uploaded",
    met: uploadedAll,
    detail: uploadedAll
      ? `All ${requiredDocs.length} documents uploaded`
      : `Missing documents. Upload from workflow page.`,
  });

  if (rules.category) {
    const cat = String(rules.category);
    const catMatch = cat === "general" || cat === "all";
    checks.push({
      requirement: `Category: ${cat}`,
      met: catMatch,
      detail: catMatch ? "Open to all categories" : `Requires ${cat} category`,
    });
  }

  if (rules.region) {
    const region = String(rules.region);
    const regionMatch = region === "all" || !roadmap?.location || region.toLowerCase() === "telangana";
    checks.push({
      requirement: `Region: ${region}`,
      met: regionMatch,
      detail: regionMatch ? "Available in your region" : `Limited to ${region}`,
    });
  }

  if (rules.max_income) {
    checks.push({
      requirement: `Annual income below ₹${Number(rules.max_income).toLocaleString("en-IN")}`,
      met: false,
      detail: "Income certificate required to verify",
    });
  }

  if (rules.min_investment) {
    checks.push({
      requirement: `Investment between ₹${Number(rules.min_investment).toLocaleString("en-IN")} - ₹${Number(rules.max_investment).toLocaleString("en-IN")}`,
      met: false,
      detail: "Investment proof required",
    });
  }

  if (rules.age_min || rules.age_max) {
    checks.push({
      requirement: `Age ${rules.age_min || 0} - ${rules.age_max || 100} years`,
      met: false,
      detail: "Age proof (Aadhaar/DOB) required to verify",
    });
  }

  if (rules.landholding) {
    const hasLand = docs.some((d) => d.type.toLowerCase().includes("land") || d.type.toLowerCase().includes("pattadar"));
    checks.push({
      requirement: "Land ownership proof",
      met: hasLand,
      detail: hasLand ? "Land record found in uploaded documents" : "Pattadar passbook / land record required",
    });
  }

  if (rules.child_gender === "female") {
    checks.push({
      requirement: "Girl child (birth to 10 years)",
      met: false,
      detail: "Birth certificate of girl child required",
    });
  }

  if (rules.marriage) {
    const hasMarriage = docs.some((d) => d.type.toLowerCase().includes("marriage"));
    checks.push({
      requirement: "Marriage proof",
      met: hasMarriage,
      detail: hasMarriage ? "Marriage certificate found" : "Marriage certificate / photos required",
    });
  }

  if (rules.education_level) {
    const level = String(rules.education_level);
    const hasEdu = docs.some((d) => d.type.toLowerCase().includes("degree") || d.type.toLowerCase().includes("education") || d.type.toLowerCase().includes("marksheet"));
    checks.push({
      requirement: `Education: ${level.replace("_", " ")}`,
      met: hasEdu,
      detail: hasEdu ? "Education certificate found" : "Previous marksheet / bonafide required",
    });
  }

  return checks;
}

export default function SchemesPage() {
  const isClient = useIsClient();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  const docs = isClient ? getDocuments() : [];
  const docTypes = new Set(docs.map((d) => d.type.toLowerCase()));
  const roadmap = isClient ? getRoadmap() : null;

  useEffect(() => {
    fetch(`${API_BASE}/schemes`)
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((data: Scheme[]) => { setSchemes(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = activeCategory === "All" ? schemes : schemes.filter((s) => s.category.toLowerCase() === activeCategory.toLowerCase());

  const categoryCounts = schemes.reduce<Record<string, number>>((acc, s) => {
    const key = s.category.toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  function handleUploadDoc(docName: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg,.doc,.docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      let document = createMockDocument(file.name);
      document = { ...document, type: docName.split(" ")[0], name: docName };
      saveDocument(document);
      setDocRefreshKey((k) => k + 1);
      window.dispatchEvent(new CustomEvent("doc-uploaded"));
    };
    input.click();
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Recommendation engine" title="Government schemes matched to citizen context" description="Check eligibility, required documents, and apply for schemes you qualify for." />

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const count = cat === "All" ? schemes.length : categoryCounts[cat.toLowerCase()] ?? 0;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${isActive ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {cat}
              <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading && <div className="py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" /><p className="mt-4 font-semibold text-slate-500">Loading schemes...</p></div>}
      {error && <Card className="border-rose-200 bg-rose-50"><p className="font-bold text-rose-700">Failed to load: {error}</p></Card>}
      {!loading && !error && filtered.length === 0 && <Card><p className="text-center font-semibold text-slate-500">No schemes found.</p></Card>}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-5 md:grid-cols-3">
          {filtered.map((scheme) => (
            <Card key={scheme.id}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-black text-navy">{scheme.name}</h2>
              </div>
              <div className="mt-3"><CategoryBadge category={scheme.category} /></div>
              <p className="mt-4 font-semibold text-saffron">{scheme.benefit}</p>
              <p className="mt-1 text-xs text-slate-400 uppercase tracking-wide">{scheme.region}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">{scheme.description}</p>
              <div className="mt-6 grid gap-2">
                <Button onClick={() => setSelectedScheme(scheme)} className="w-full gap-2">
                  Check Eligibility <ChevronRight size={16} />
                </Button>
                {schemeUrls[scheme.name] && (
                  <a href={schemeUrls[scheme.name]} target="_blank" rel="noopener noreferrer"
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-bold text-navy hover:bg-slate-50 flex items-center justify-center gap-2">
                    Apply Now <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Eligibility Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedScheme(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-navy">{selectedScheme.name}</h2>
                <p className="mt-1 font-semibold text-saffron">{selectedScheme.benefit}</p>
              </div>
              <button onClick={() => setSelectedScheme(null)} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button>
            </div>

            <div className="mt-4 flex gap-2">
              <CategoryBadge category={selectedScheme.category} />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{selectedScheme.region}</span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">{selectedScheme.description}</p>

            {(() => {
              const checks = checkEligibility(selectedScheme, docs, roadmap);
              const allMet = checks.every((c) => c.met);
              return (
                <>
                  <div className={`mt-6 rounded-2xl p-4 ${allMet ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                    <div className="flex items-center gap-3">
                      {allMet ? <Check size={20} className="text-green-600" /> : <AlertTriangle size={20} className="text-amber-600" />}
                      <p className={`text-lg font-black ${allMet ? "text-green-700" : "text-amber-700"}`}>
                        {allMet ? "You are Eligible!" : "Not Yet Eligible — Check Requirements Below"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-black text-navy">Eligibility Requirements</h3>
                    <div className="mt-3 space-y-2">
                      {checks.map((check, i) => (
                        <div key={i} className={`flex items-start gap-3 rounded-xl p-3 text-sm ${check.met ? "bg-green-50 text-green-800" : "bg-slate-50 text-slate-700"}`}>
                          {check.met ? <Check size={16} className="mt-0.5 shrink-0 text-green-600" /> : <X size={16} className="mt-0.5 shrink-0 text-red-500" />}
                          <div>
                            <p className="font-semibold">{check.requirement}</p>
                            <p className="text-xs opacity-70">{check.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-black text-navy">Required Documents</h3>
                    <div className="mt-3 space-y-2" key={docRefreshKey}>
                      {(schemeDocuments[selectedScheme.name] || ["Aadhaar", "Address proof"]).map((doc) => {
                        const lower = doc.toLowerCase();
                        const uploaded = [...docTypes].some((dt) => dt.includes(lower.split(" ")[0]) || lower.includes(dt));
                        return (
                          <div key={doc} className={`flex items-center gap-3 rounded-xl p-3 text-sm ${uploaded ? "bg-green-50 text-green-800" : "bg-slate-50 text-slate-600"}`}>
                            {uploaded ? <Check size={16} className="shrink-0 text-green-600" /> : <FileText size={16} className="shrink-0 text-slate-400" />}
                            <span className={`flex-1 ${uploaded ? "font-semibold" : ""}`}>{doc}</span>
                            {uploaded ? (
                              <span className="text-xs font-bold text-green-600">Uploaded</span>
                            ) : (
                              <button
                                onClick={() => handleUploadDoc(doc)}
                                className="rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition"
                              >
                                Upload
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="mt-6 flex gap-3">
              <button onClick={() => {
                const requiredDocs = schemeDocuments[selectedScheme.name] || ["Aadhaar", "Address proof"];
                const checks = checkEligibility(selectedScheme, docs, roadmap);
                const allMet = checks.every((c) => c.met);
                const lines = [
                  "=".repeat(60),
                  `  SCHEME ELIGIBILITY CHECKLIST`,
                  "=".repeat(60),
                  "",
                  `Scheme: ${selectedScheme.name}`,
                  `Benefit: ${selectedScheme.benefit}`,
                  `Category: ${selectedScheme.category}`,
                  `Region: ${selectedScheme.region}`,
                  "",
                  "-".repeat(60),
                  "  ELIGIBILITY STATUS",
                  "-".repeat(60),
                  "",
                  allMet ? "  ALL REQUIREMENTS MET - YOU ARE ELIGIBLE" : "  SOME REQUIREMENTS NOT MET - CHECK BELOW",
                  "",
                  ...checks.map((c) => `  ${c.met ? "[x]" : "[ ]"} ${c.requirement} — ${c.detail}`),
                  "",
                  "-".repeat(60),
                  "  REQUIRED DOCUMENTS",
                  "-".repeat(60),
                  "",
                  ...requiredDocs.map((doc) => {
                    const lower = doc.toLowerCase();
                    const uploaded = [...docTypes].some((dt) => dt.includes(lower.split(" ")[0]) || lower.includes(dt));
                    return `  ${uploaded ? "[x]" : "[ ]"} ${doc}`;
                  }),
                  "",
                  "=".repeat(60),
                  "  Generated by Saarthi AI",
                  "=".repeat(60),
                ];
                const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `saarthi-${selectedScheme.name.toLowerCase().replace(/\s+/g, "-")}-checklist.txt`;
                link.click();
                URL.revokeObjectURL(url);
                setSelectedScheme(null);
              }} className="flex-1 rounded-2xl bg-saffron px-5 py-3 text-center text-sm font-bold text-white hover:bg-orange-600 transition flex items-center justify-center gap-2">
                <Download size={16} /> Download Checklist
              </button>
              <button onClick={() => setSelectedScheme(null)} className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-navy hover:bg-slate-50">
                Close
              </button>
            </div>
            {schemeUrls[selectedScheme.name] && (
              <a href={schemeUrls[selectedScheme.name]} target="_blank" rel="noopener noreferrer"
                className="mt-3 block w-full rounded-2xl border-2 border-dashed border-navy bg-navy/5 px-5 py-3 text-center text-sm font-bold text-navy hover:bg-navy/10 transition flex items-center justify-center gap-2">
                Go to Official Portal <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
