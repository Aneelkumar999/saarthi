export type RoadmapStep = {
  id: number;
  title: string;
  dept: string;
  status: string;
  days: string;
  documents: string[];
  portal_id?: string | null;
  portal_name?: string | null;
};

export type SavedRoadmap = {
  id: string;
  goal: string;
  intent: string;
  location: string;
  title: string;
  timeline: string;
  fastestPath: string;
  teluguHint: string;
  steps: RoadmapStep[];
  schemes: string[];
  createdAt: string;
};

export type SavedDocument = {
  id: string;
  name: string;
  type: string;
  state: string;
  confidence: string;
  fields: Record<string, string>;
  createdAt: string;
};

const ROADMAP_KEY = "saarthi_current_roadmap";
const DOCS_KEY = "saarthi_saved_documents";

export function generateRoadmap(goal: string): SavedRoadmap {
  const normalized = goal.toLowerCase();

  // 10. Food Truck / Restaurant (check before generic restaurant)
  if (normalized.includes("food truck") || normalized.includes("restaurant") || normalized.includes("hotel") || normalized.includes("mess")) {
    return buildRoadmap(goal, {
      intent: "Food truck or restaurant business",
      location: inferLocation(goal),
      title: "Food truck / Restaurant roadmap",
      timeline: "20-45",
      fastestPath: "Finalize location, then apply for Trade License and FSSAI together to save time.",
      teluguHint: "లొకేషన్ ఫైనలైజ్ చేసి, ట్రేడ్ లైసెన్స్ మరియు FSSAI ఒకేసారి అప్లై చేయండి.",
      schemes: ["PM SVANidhi", "MUDRA Shishu Loan", "Telangana T-PRIDE", "FSSAI Registration Subsidy"],
      steps: [
        step(1, "Finalize Location", "Self / Local Authority", "Ready", "1-3 days", ["Aadhaar", "PAN", "Location details"]),
        step(2, "Trade License", "GHMC / Local Municipal Body", "Pending", "5-7 days", ["Rental agreement", "Photos", "NOC", "Aadhaar"]),
        step(3, "FSSAI License", "Food Safety and Standards Authority", "Pending", "7-15 days", ["Food business details", "ID proof", "Photo", "Layout plan"]),
        step(4, "GST Registration", "Commercial Taxes / GSTN", "Pending", "3-7 days", ["PAN", "Bank details", "Business address"]),
        step(5, "Fire NOC", "Fire Department", "Pending", "5-10 days", ["Building plan", "NOC application", "Safety certificates", "Aadhaar"]),
        step(6, "Business Launch", "All Departments", "Pending", "1-2 days", ["All registered licenses", "Staff Aadhaar"])
      ]
    });
  }

  // 1. Tea Shop / Cafe
  if (normalized.includes("tea") || normalized.includes("cafe") || normalized.includes("canteen")) {
    return buildRoadmap(goal, {
      intent: "Tea shop or cafe business",
      location: inferLocation(goal),
      title: "Tea shop / Cafe roadmap",
      timeline: "15-30",
      fastestPath: "Keep Aadhaar, PAN, shop address proof, and rental agreement ready. Start Shop & Establishment registration first.",
      teluguHint: "ఆధార్, పాన్, షాప్ అడ్రస్ ప్రూఫ్, రెంటల్ అగ్రిమెంట్ సిద్ధం చేయండి. మొదట షాప్ & ఎస్టాబ్లిష్‌మెంట్ రిజిస్ట్రేషన్ ప్రారంభించండి.",
      schemes: ["PM SVANidhi", "MUDRA Shishu Loan", "Telangana T-PRIDE"],
      steps: [
        step(1, "Shop & Establishment Registration", "Telangana Labour Department", "Ready", "2-4 days", ["Aadhaar", "PAN", "Shop address proof", "Passport photos"]),
        step(2, "Trade License", "GHMC / Local Municipal Body", "Blocked by Step 1", "5-7 days", ["Rental agreement", "Photos", "NOC", "Aadhaar"]),
        step(3, "FSSAI Registration", "Food Safety and Standards Authority", "Pending", "7-10 days", ["Food business details", "ID proof", "Applicant photo", "Layout plan"]),
        step(4, "GST Registration", "Commercial Taxes / GSTN", "Pending", "3-7 days", ["PAN", "Bank details", "Business address proof"]),
        step(5, "Open Bank Account", "Bank", "Pending", "3-5 days", ["Aadhaar", "PAN", "Business registration", "Address proof"]),
        step(6, "Start Operations", "Self", "Pending", "1-2 days", ["All registered licenses"])
      ]
    });
  }

  // 8. Farmer Welfare
  if (normalized.includes("farmer") || normalized.includes("agriculture") || normalized.includes("crop") || normalized.includes("subsidy")) {
    return buildRoadmap(goal, {
      intent: "Farmer welfare scheme",
      location: inferLocation(goal),
      title: "Farmer welfare roadmap",
      timeline: "15-45",
      fastestPath: "Ensure Aadhaar-bank linkage and land records (Pattadar passbook) are ready before scheme application.",
      teluguHint: "ఆధార్-బ్యాంక్ లింక్ మరియు భూమి పత్రాలు (పట్టాదార్ పాస్‌బుక్) సిద్ధం చేయండి.",
      schemes: ["Rythu Bandhu", "PM-KISAN", "Crop Insurance (PMFBY)", "Rythu Bima"],
      steps: [
        step(1, "Farmer Registration", "Agriculture Department / DBT Portal", "Ready", "2-5 days", ["Aadhaar", "Pattadar passbook", "Bank passbook", "Mobile number"]),
        step(2, "Land Verification", "Revenue Department", "Pending", "5-10 days", ["Land records", "Survey number", "Pattadar passbook", "Aadhaar"]),
        step(3, "Scheme Check", "Agriculture Department", "Pending", "3-7 days", ["Land record", "Bank details", "Aadhaar-bank link"]),
        step(4, "Apply for Scheme", "DBT / Agriculture Portal", "Pending", "5-15 days", ["Application form", "Land docs", "Bank passbook", "Aadhaar", "Crop details"]),
        step(5, "Verification", "Revenue / Agriculture Officer", "Pending", "7-15 days", ["Application acknowledgement"]),
        step(6, "Benefit Transfer", "Bank / DBT System", "Pending", "3-7 days", ["Aadhaar-bank linked account"])
      ]
    });
  }

  // 2. Small Business / MSME
  if (normalized.includes("business") || normalized.includes("msme") || normalized.includes("udyam") || normalized.includes("enterprise") || normalized.includes("company") || normalized.includes("shop")) {
    return buildRoadmap(goal, {
      intent: "Small business or MSME registration",
      location: inferLocation(goal),
      title: "Small business / MSME roadmap",
      timeline: "10-25",
      fastestPath: "Start with UDYAM Registration using Aadhaar and PAN, then proceed to GST and bank account.",
      teluguHint: "ఆధార్ మరియు పాన్ తో UDYAM రిజిస్ట్రేషన్ ప్రారంభించండి, తర్వాత GST మరియు బ్యాంక్ అకౌంట్.",
      schemes: ["PM SVANidhi", "MUDRA Loan", "MSME Samadhaan", "Udyog Aadhaar"],
      steps: [
        step(1, "UDYAM Registration", "MSME Ministry / UDYAM Portal", "Ready", "1-3 days", ["Aadhaar", "PAN", "Business address", "Bank details"]),
        step(2, "GST Registration", "Commercial Taxes / GSTN", "Pending", "3-7 days", ["PAN", "Business address", "Bank details", "Photos"]),
        step(3, "Open Bank Account", "Bank", "Pending", "3-5 days", ["Aadhaar", "PAN", "Udyam certificate", "Business address"]),
        step(4, "Trade License", "GHMC / Local Municipal Body", "Pending", "5-7 days", ["Rental agreement", "Aadhaar", "Photos", "NOC"])
      ]
    });
  }

  // 3. Birth Certificate
  if (normalized.includes("birth") || normalized.includes("baby") || normalized.includes("newborn")) {
    return buildRoadmap(goal, {
      intent: "Birth certificate",
      location: inferLocation(goal),
      title: "Birth certificate roadmap",
      timeline: "7-21",
      fastestPath: "Keep hospital discharge summary and parent Aadhaar ready before visiting the municipal counter or portal.",
      teluguHint: "ముందుగా హాస్పిటల్ డిశ్చార్జ్ సమరీ మరియు తల్లిదండ్రుల ఆధార్ సిద్ధం చేయండి.",
      schemes: ["Newborn health registration guidance", "MeeSeva certificate support"],
      steps: [
        step(1, "Hospital Verification", "Hospital / Municipality", "Ready", "1-2 days", ["Hospital discharge summary", "Parent Aadhaar", "Birth report"]),
        step(2, "Collect Documents", "Self", "Pending", "1-3 days", ["Parent Aadhaar", "Address proof", "Marriage certificate", "Photos"]),
        step(3, "Apply MeeSeva", "MeeSeva / Municipality", "Pending", "5-14 days", ["Form 1", "Hospital record", "Parent ID", "Address proof"]),
        step(4, "Verification", "Municipality Officer", "Pending", "3-7 days", ["Application acknowledgement"]),
        step(5, "Certificate Issued", "MeeSeva / Municipality", "Pending", "1-5 days", ["Application receipt", "Aadhaar"])
      ]
    });
  }

  // 4. Marriage Certificate
  if (normalized.includes("marriage") || normalized.includes("wedding") || normalized.includes("married")) {
    return buildRoadmap(goal, {
      intent: "Marriage registration",
      location: inferLocation(goal),
      title: "Marriage certificate roadmap",
      timeline: "15-30",
      fastestPath: "Collect age proofs, address proofs, wedding photos, and witness IDs before slot booking.",
      teluguHint: "వయస్సు ప్రూఫ్‌లు, అడ్రస్ ప్రూఫ్‌లు, వివాహ ఫోటోలు మరియు సాక్షుల ఐడీలు ముందుగా సిద్ధం చేయండి.",
      schemes: ["MeeSeva registration assistance"],
      steps: [
        step(1, "Gather Documents", "Self", "Ready", "1-3 days", ["Aadhaar Bride", "Aadhaar Groom", "Age proof", "Address proof"]),
        step(2, "Photos & Affidavit", "Self / Notary", "Pending", "1-2 days", ["Wedding photos", "Affidavit", "Passport photos"]),
        step(3, "Book Appointment", "Sub-Registrar Portal", "Pending", "1-3 days", ["Appointment receipt", "All documents"]),
        step(4, "Visit Sub-Registrar", "Sub-Registrar Office", "Pending", "1-2 days", ["Witness IDs", "Invitation card", "Marriage proof"]),
        step(5, "Certificate Issued", "Sub-Registrar Office", "Pending", "7-15 days", ["Application receipt", "Aadhaar"])
      ]
    });
  }

  // 5. Property Registration
  if (normalized.includes("property") || normalized.includes("land") || normalized.includes("house") || normalized.includes("plot") || normalized.includes("registration")) {
    return buildRoadmap(goal, {
      intent: "Property registration",
      location: inferLocation(goal),
      title: "Property registration roadmap",
      timeline: "15-45",
      fastestPath: "Complete legal verification and stamp duty payment before visiting Sub-Registrar for deed registration.",
      teluguHint: "లీగల్ వెరిఫికేషన్ మరియు స్టాంప్ డ్యూటీ పేమెంట్ పూర్తి చేసి సబ్ రిజిస్ట్రార్ వద్ద డీడ్ రిజిస్ట్రేషన్ చేయండి.",
      schemes: ["Registration Department Portal", "MeeSeva support"],
      steps: [
        step(1, "Legal Verification", "Revenue / Legal Dept", "Ready", "3-7 days", ["Property documents", "Title deed", "Encumbrance cert", "Aadhaar", "PAN"]),
        step(2, "Stamp Duty Payment", "Treasury / e-Stamp", "Pending", "1-3 days", ["Sale agreement", "Valuation report", "PAN", "Bank challan"]),
        step(3, "Prepare Sale Deed", "Advocate / Self", "Pending", "3-5 days", ["Stamp duty receipt", "Property docs", "ID proofs"]),
        step(4, "Sub-Registrar Appointment", "Sub-Registrar Portal", "Pending", "1-3 days", ["Appointment receipt", "Sale deed", "Photos", "Witness IDs"]),
        step(5, "Registration Complete", "Sub-Registrar Office", "Pending", "1-2 days", ["Registration receipt", "Registered deed", "Aadhaar"])
      ]
    });
  }

  // 6. Driving License
  if (normalized.includes("driving") || normalized.includes("license") || normalized.includes("dl") || normalized.includes("rto") || normalized.includes("vehicle")) {
    return buildRoadmap(goal, {
      intent: "Driving license",
      location: inferLocation(goal),
      title: "Driving license roadmap",
      timeline: "30-60",
      fastestPath: "Apply for Learner License first, practice driving, then book and pass the test for DL.",
      teluguHint: "ముందుగా లెర్నర్ లైసెన్స్ అప్లై చేయండి, డ్రైవింగ్ ప్రాక్టీస్ చేసి, టెస్ట్ పాస్ అయ్యి DL పొందండి.",
      schemes: ["Sarathi Portal", "RTO Online Services"],
      steps: [
        step(1, "Apply Learner License", "RTO / Sarathi Portal", "Ready", "1-3 days", ["Aadhaar", "Address proof", "Photos", "Medical cert", "Age proof"]),
        step(2, "Pass Learner Test", "RTO", "Pending", "1-7 days", ["Application receipt", "ID proof"]),
        step(3, "Practice Driving", "Self", "Pending", "15-30 days", ["Learner license", "Vehicle docs"]),
        step(4, "Book Test", "Sarathi Portal", "Pending", "1-3 days", ["Learner license", "Vehicle", "Fee receipt"]),
        step(5, "Pass Test", "RTO", "Pending", "1-2 days", ["Vehicle", "Learner license"]),
        step(6, "DL Issued", "RTO", "Pending", "7-15 days", ["Test pass receipt", "Aadhaar"])
      ]
    });
  }

  // 7. Student Scholarship
  if (normalized.includes("scholarship") || normalized.includes("student") || normalized.includes("education") || normalized.includes("study")) {
    return buildRoadmap(goal, {
      intent: "Student scholarship",
      location: inferLocation(goal),
      title: "Student scholarship roadmap",
      timeline: "15-60",
      fastestPath: "Collect income certificate, bonafide, and academic records before the scholarship portal deadline.",
      teluguHint: "ఇన్కమ్ సర్టిఫికెట్, బొనాఫైడ్ మరియు అకడమిక్ రికార్డ్స్ స్కాలర్‌షిప్ పోర్టల్ డెడ్‌లైన్ ముందు సిద్ధం చేయండి.",
      schemes: ["Post Matric Scholarship", "Pre Matric Scholarship", "National Scholarship Portal"],
      steps: [
        step(1, "Select Scholarship", "NSP / State Portal", "Ready", "1-3 days", ["Aadhaar", "Income certificate", "Bonafide"]),
        step(2, "Check Eligibility", "Self / Institution", "Pending", "1-3 days", ["Academic records", "Income proof", "Category certificate"]),
        step(3, "Collect Documents", "Self", "Pending", "3-7 days", ["Aadhaar", "Income cert", "Bonafide", "Bank passbook", "Photos"]),
        step(4, "Submit Application", "NSP / State Portal", "Pending", "1-3 days", ["Application form", "All documents"]),
        step(5, "Verification", "Institution / District Officer", "Pending", "15-30 days", ["Application acknowledgement"]),
        step(6, "Scholarship Approval", "Scholarship Department", "Pending", "15-30 days", ["Bank account linked to Aadhaar"])
      ]
    });
  }

  // 9. Income/Caste Certificate
  if (normalized.includes("income") || normalized.includes("caste") || normalized.includes("certificate") || normalized.includes("community") || normalized.includes("residence")) {
    return buildRoadmap(goal, {
      intent: "Income or caste certificate",
      location: inferLocation(goal),
      title: "Income / Caste certificate roadmap",
      timeline: "10-21",
      fastestPath: "Collect supporting documents like salary slips, bank statements, and existing certificates before applying.",
      teluguHint: "సాలరీ స్లిప్స్, బ్యాంక్ స్టేట్‌మెంట్స్ మరియు ఇప్పటికే ఉన్న సర్టిఫికెట్లు అప్లై చేయడానికి ముందు సిద్ధం చేయండి.",
      schemes: ["MeeSeva certificate services", "e-District portal"],
      steps: [
        step(1, "Choose Type", "Self", "Ready", "1 day", ["Aadhaar", "Understanding of needed cert"]),
        step(2, "Collect Documents", "Self", "Pending", "3-5 days", ["Aadhaar", "Address proof", "Supporting certs", "Salary slip", "Bank statements"]),
        step(3, "MeeSeva Application", "MeeSeva / e-District Portal", "Pending", "1-3 days", ["Application form", "Aadhaar", "Supporting docs", "Fee receipt"]),
        step(4, "Verification", "Revenue Officer", "Pending", "5-10 days", ["Application acknowledgement"]),
        step(5, "Certificate Issued", "MeeSeva / e-District", "Pending", "3-7 days", ["Application receipt", "Aadhaar"])
      ]
    });
  }

  // Default fallback: General government service
  return buildRoadmap(goal, {
    intent: "Government service request",
    location: inferLocation(goal),
    title: "General government service roadmap",
    timeline: "10-20",
    fastestPath: "Upload Aadhaar, PAN, and address proof to start the process. Check MeeSeva for available services.",
    teluguHint: "ఆధార్, పాన్ మరియు అడ్రస్ ప్రూఫ్ అప్లోడ్ చేసి ప్రక్రియ ప్రారంభించండి. MeeSeva లో అందుబాటులో ఉన్న సేవలు చూడండి.",
    schemes: ["MeeSeva services", "e-District portal", "Digital India"],
    steps: [
      step(1, "Document Collection", "Self", "Ready", "1-3 days", ["Aadhaar", "PAN", "Address proof"]),
      step(2, "Online Application", "MeeSeva / e-District Portal", "Pending", "1-3 days", ["Application form", "ID proofs", "Fee receipt"]),
      step(3, "Verification", "Relevant Department", "Pending", "5-15 days", ["Application acknowledgement"]),
      step(4, "Certificate / Service Issued", "Department Office", "Pending", "3-7 days", ["Application receipt", "Aadhaar"])
    ]
  });
}

export function normalizeApiRoadmap(goal: string, roadmap: unknown): SavedRoadmap | null {
  if (!roadmap || typeof roadmap !== "object") return null;
  const data = roadmap as Partial<SavedRoadmap> & { response?: string };
  if (!Array.isArray(data.steps)) return null;

  return {
    id: crypto.randomUUID(),
    goal: String(data.goal || goal),
    intent: String(data.intent || "Government service request"),
    location: String(data.location || "Telangana"),
    title: String(data.title || "Personalized government service roadmap"),
    timeline: String(data.timeline || "7-15"),
    fastestPath: String(data.fastestPath || "Upload required documents first, then start the first available approval."),
    teluguHint: String(data.teluguHint || "ముందుగా అవసరమైన పత్రాలు సిద్ధం చేయండి."),
    schemes: Array.isArray(data.schemes) ? data.schemes.map(String) : [],
    steps: data.steps.map((step, index) => ({
      id: Number(step.id || index + 1),
      title: String(step.title || "Government service step"),
      dept: String(step.dept || "Relevant department"),
      status: String(step.status || (index === 0 ? "Ready" : "Pending")),
      days: String(step.days || "3-7 days"),
      documents: Array.isArray(step.documents) ? step.documents.map(String) : ["Aadhaar", "Address proof"]
    })),
    createdAt: new Date().toISOString()
  };
}

export function saveRoadmap(roadmap: SavedRoadmap) {
  localStorage.setItem(ROADMAP_KEY, JSON.stringify(roadmap));
}

export function getRoadmap(): SavedRoadmap | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ROADMAP_KEY);
  return raw ? JSON.parse(raw) as SavedRoadmap : null;
}

export function saveDocument(document: SavedDocument) {
  const docs = getDocuments().filter((item) => item.type !== document.type);
  localStorage.setItem(DOCS_KEY, JSON.stringify([document, ...docs]));
}

export function getDocuments(): SavedDocument[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DOCS_KEY);
  return raw ? JSON.parse(raw) as SavedDocument[] : [];
}

export function buildFormFields(roadmap: SavedRoadmap | null, docs: SavedDocument[]) {
  const mergedFields = docs.reduce<Record<string, string>>((fields, doc) => ({ ...fields, ...doc.fields }), {});
  const firstStep = roadmap?.steps[0];
  const intent = roadmap?.intent?.toLowerCase() ?? "";

  const baseFields = [
    { label: "Applicant Name", value: mergedFields.name ?? "", source: mergedFields.name ? "Aadhaar OCR" : "", confidence: mergedFields.name ? "98%" : "0%", required: true },
    { label: "Date of Birth", value: mergedFields.dob ?? "", source: mergedFields.dob ? "Document OCR" : "", confidence: mergedFields.dob ? "94%" : "0%", required: true },
    { label: "Phone Number", value: mergedFields.phone ?? "", source: mergedFields.phone ? "Profile" : "", confidence: mergedFields.phone ? "100%" : "0%", required: true },
    { label: "Address", value: mergedFields.address ?? roadmap?.location ?? "", source: mergedFields.address ? "Address Proof OCR" : "", confidence: mergedFields.address ? "90%" : "70%", required: true },
  ];

  if (intent.includes("tea") || intent.includes("cafe") || intent.includes("food") || intent.includes("restaurant") || intent.includes("shop") || intent.includes("business") || intent.includes("msme")) {
    return [
      ...baseFields,
      { label: "Business Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Business Type", value: intent.includes("food") || intent.includes("restaurant") ? "Food & Beverage" : "Retail / Trading", source: "AI intent", confidence: "95%", required: true },
      { label: "Business Address", value: mergedFields.address ?? roadmap?.location ?? "", source: mergedFields.address ? "Document OCR" : "", confidence: mergedFields.address ? "90%" : "0%", required: true },
      { label: "PAN Number", value: mergedFields.idNumber ?? "", source: mergedFields.idNumber ? "PAN OCR" : "", confidence: mergedFields.idNumber ? "96%" : "0%", required: true },
      { label: "Owner Aadhaar", value: mergedFields.idNumber ?? "", source: mergedFields.idNumber ? "Aadhaar OCR" : "", confidence: mergedFields.idNumber ? "98%" : "0%", required: true },
      { label: "Premises Owner Name", value: mergedFields.premisesOwner ?? "", source: mergedFields.premisesOwner ? "Rental Agreement OCR" : "", confidence: mergedFields.premisesOwner ? "85%" : "0%", required: false },
      { label: "Monthly Rent", value: "", source: "", confidence: "0%", required: false },
      { label: "Number of Employees", value: "", source: "", confidence: "0%", required: false },
      { label: "Application Fee", value: firstStep ? `₹${firstStep.id * 200}` : "", source: "Fee schedule", confidence: "100%", required: false },
    ];
  }

  if (intent.includes("birth")) {
    return [
      ...baseFields,
      { label: "Child Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Date of Birth", value: mergedFields.dob ?? "", source: mergedFields.dob ? "Hospital Record" : "", confidence: mergedFields.dob ? "95%" : "0%", required: true },
      { label: "Place of Birth", value: roadmap?.location ?? "", source: "Roadmap", confidence: "70%", required: true },
      { label: "Father Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Mother Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Hospital Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Address of Parents", value: mergedFields.address ?? "", source: mergedFields.address ? "Address Proof OCR" : "", confidence: mergedFields.address ? "90%" : "0%", required: true },
    ];
  }

  if (intent.includes("marriage")) {
    return [
      { label: "Bride Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Bride Father Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Bride Aadhaar", value: "", source: "", confidence: "0%", required: true },
      { label: "Groom Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Groom Father Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Groom Aadhaar", value: "", source: "", confidence: "0%", required: true },
      { label: "Date of Marriage", value: "", source: "", confidence: "0%", required: true },
      { label: "Place of Marriage", value: roadmap?.location ?? "", source: "Roadmap", confidence: "70%", required: true },
      ...baseFields.slice(0, 1),
      { label: "Marriage Type", value: "Hindu / Special Marriage Act", source: "", confidence: "0%", required: true },
      { label: "Witness 1 Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Witness 2 Name", value: "", source: "", confidence: "0%", required: true },
    ];
  }

  if (intent.includes("property")) {
    return [
      ...baseFields,
      { label: "Property Address", value: mergedFields.address ?? "", source: mergedFields.address ? "Document OCR" : "", confidence: mergedFields.address ? "90%" : "0%", required: true },
      { label: "Survey Number", value: mergedFields.surveyNo ?? "", source: mergedFields.surveyNo ? "Land Record OCR" : "", confidence: mergedFields.surveyNo ? "88%" : "0%", required: true },
      { label: "Property Area (sq ft)", value: "", source: "", confidence: "0%", required: true },
      { label: "Sale Consideration", value: "", source: "", confidence: "0%", required: true },
      { label: "Stamp Duty Amount", value: "", source: "", confidence: "0%", required: true },
      { label: "Seller Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Buyer PAN", value: mergedFields.idNumber ?? "", source: mergedFields.idNumber ? "PAN OCR" : "", confidence: mergedFields.idNumber ? "96%" : "0%", required: true },
    ];
  }

  if (intent.includes("driving") || intent.includes("license") || intent.includes("dl")) {
    return [
      ...baseFields,
      { label: "Full Name (as on Aadhaar)", value: mergedFields.name ?? "", source: mergedFields.name ? "Aadhaar OCR" : "", confidence: mergedFields.name ? "98%" : "0%", required: true },
      { label: "Age", value: "", source: "", confidence: "0%", required: true },
      { label: "Blood Group", value: "", source: "", confidence: "0%", required: true },
      { label: "Vehicle Class", value: "LMV (Car) / MCWOG (Two Wheeler)", source: "", confidence: "0%", required: true },
      { label: "License Type", value: "Learner / Permanent", source: "", confidence: "0%", required: true },
      { label: "RTO Office", value: roadmap?.location ?? "", source: "Roadmap", confidence: "70%", required: true },
    ];
  }

  if (intent.includes("scholarship") || intent.includes("student") || intent.includes("education")) {
    return [
      ...baseFields,
      { label: "Student Name", value: mergedFields.name ?? "", source: mergedFields.name ? "Aadhaar OCR" : "", confidence: mergedFields.name ? "98%" : "0%", required: true },
      { label: "Institution Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Course / Program", value: "", source: "", confidence: "0%", required: true },
      { label: "Year of Study", value: "", source: "", confidence: "0%", required: true },
      { label: "Annual Income", value: mergedFields.annualIncome ?? "", source: mergedFields.annualIncome ? "Income Certificate" : "", confidence: mergedFields.annualIncome ? "90%" : "0%", required: true },
      { label: "Category", value: "", source: "", confidence: "0%", required: false },
      { label: "Bank Account (Aadhaar linked)", value: "", source: "", confidence: "0%", required: true },
      { label: "Scholarship Name", value: roadmap?.schemes?.[0] ?? "", source: "AI recommendation", confidence: roadmap?.schemes?.[0] ? "95%" : "0%", required: true },
    ];
  }

  if (intent.includes("farmer") || intent.includes("agriculture") || intent.includes("subsidy")) {
    return [
      ...baseFields,
      { label: "Farmer Name", value: mergedFields.name ?? "", source: mergedFields.name ? "Aadhaar OCR" : "", confidence: mergedFields.name ? "98%" : "0%", required: true },
      { label: "Land Survey Number", value: mergedFields.surveyNo ?? "", source: mergedFields.surveyNo ? "Land Record OCR" : "", confidence: mergedFields.surveyNo ? "88%" : "0%", required: true },
      { label: "Land Area (acres)", value: mergedFields.extentAcres ?? "", source: mergedFields.extentAcres ? "Land Record OCR" : "", confidence: mergedFields.extentAcres ? "85%" : "0%", required: true },
      { label: "Land Type", value: mergedFields.landType ?? "", source: mergedFields.landType ? "Land Record OCR" : "", confidence: mergedFields.landType ? "90%" : "0%", required: true },
      { label: "Bank Account (Aadhaar linked)", value: "", source: "", confidence: "0%", required: true },
      { label: "Crop Details", value: "", source: "", confidence: "0%", required: false },
      { label: "Scheme Applied", value: roadmap?.schemes?.[0] ?? "", source: "AI recommendation", confidence: roadmap?.schemes?.[0] ? "95%" : "0%", required: true },
    ];
  }

  if (intent.includes("income") || intent.includes("caste") || intent.includes("certificate")) {
    return [
      ...baseFields,
      { label: "Certificate Type", value: intent.includes("income") ? "Income Certificate" : intent.includes("caste") ? "Caste Certificate" : "Residence Certificate", source: "AI intent", confidence: "95%", required: true },
      { label: "Annual Income", value: mergedFields.annualIncome ?? "", source: mergedFields.annualIncome ? "Income Certificate" : "", confidence: mergedFields.annualIncome ? "90%" : "0%", required: true },
      { label: "Caste / Community", value: "", source: "", confidence: "0%", required: false },
      { label: "Purpose", value: "", source: "", confidence: "0%", required: true },
    ];
  }

  if (intent.includes("passport")) {
    return [
      ...baseFields,
      { label: "Full Name (as on Aadhaar)", value: mergedFields.name ?? "", source: mergedFields.name ? "Aadhaar OCR" : "", confidence: mergedFields.name ? "98%" : "0%", required: true },
      { label: "Father / Guardian Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Mother Name", value: "", source: "", confidence: "0%", required: true },
      { label: "Place of Birth", value: roadmap?.location ?? "", source: "Roadmap", confidence: "70%", required: true },
      { label: "Passport Type", value: "Fresh / Ordinary", source: "", confidence: "0%", required: true },
      { label: "Pages", value: "36 / 60", source: "", confidence: "0%", required: false },
      { label: "Police Station", value: "", source: "", confidence: "0%", required: true },
    ];
  }

  return [
    ...baseFields,
    { label: "Application Type", value: firstStep?.title ?? "", source: firstStep ? "Workflow engine" : "", confidence: firstStep ? "100%" : "0%", required: true },
    { label: "Department", value: firstStep?.dept ?? "", source: firstStep ? "Knowledge base" : "", confidence: firstStep ? "100%" : "0%", required: true },
    { label: "Purpose / Reason", value: roadmap?.goal ?? "", source: roadmap ? "AI roadmap" : "", confidence: roadmap ? "95%" : "0%", required: true },
  ];
}

export function createMockDocument(fileName: string): SavedDocument {
  const lower = fileName.toLowerCase();
  const type = lower.includes("pan") ? "PAN" : lower.includes("rent") || lower.includes("agreement") ? "Rental Agreement" : "Aadhaar";
  const fields: Record<string, string> = type === "PAN"
    ? { name: "Anil Kumar", idNumber: "ABCDE1234F" }
    : type === "Rental Agreement"
      ? { address: "Hyderabad, Telangana", premisesOwner: "Verified owner" }
      : { name: "Anil Kumar", dob: "2004-01-01", address: "Hyderabad, Telangana", idNumber: "XXXX-XXXX-1234" };

  return {
    id: crypto.randomUUID(),
    name: fileName,
    type,
    state: "Verified",
    confidence: type === "Rental Agreement" ? "86%" : "98%",
    fields,
    createdAt: new Date().toISOString()
  };
}

const PORTAL_MAP: Record<string, { id: string; name: string }> = {
  "birth certificate": { id: "meeseva", name: "MeeSeva" },
  "caste certificate": { id: "meeseva", name: "MeeSeva" },
  "income certificate": { id: "meeseva", name: "MeeSeva" },
  "trade license": { id: "meeseva", name: "MeeSeva" },
  "shop & establishment": { id: "meeseva", name: "MeeSeva" },
  "marriage registration": { id: "meeseva", name: "MeeSeva" },
  "property registration": { id: "meeseva", name: "MeeSeva" },
  "building plan": { id: "meeseva", name: "MeeSeva" },
  "fssai": { id: "fssai", name: "FSSAI" },
  "udyam": { id: "udyam", name: "Udyam Registration" },
  "msme": { id: "udyam", name: "Udyam Registration" },
  "passport": { id: "passport_seva", name: "Passport Seva" },
  "aadhaar": { id: "digilocker", name: "DigiLocker" },
  "pan": { id: "income_tax", name: "Income Tax e-Filing" },
  "voter": { id: "voter_portal", name: "National Voter Portal" },
  "driving license": { id: "digilocker", name: "DigiLocker" },
  "registration": { id: "meeseva", name: "MeeSeva" },
};

function findPortalForStep(title: string): { id: string; name: string } | null {
  const lower = title.toLowerCase();
  for (const [key, portal] of Object.entries(PORTAL_MAP)) {
    if (lower.includes(key)) return portal;
  }
  return null;
}

function buildRoadmap(goal: string, data: Omit<SavedRoadmap, "id" | "goal" | "createdAt">): SavedRoadmap {
  return {
    id: crypto.randomUUID(),
    goal,
    createdAt: new Date().toISOString(),
    ...data
  };
}

function step(id: number, title: string, dept: string, status: string, days: string, documents: string[]): RoadmapStep {
  const portal = findPortalForStep(title);
  return { id, title, dept, status, days, documents, portal_id: portal?.id ?? null, portal_name: portal?.name ?? null };
}

function inferLocation(goal: string) {
  const normalized = goal.toLowerCase();
  if (normalized.includes("hyderabad")) return "Hyderabad, Telangana";
  if (normalized.includes("telangana")) return "Telangana";
  return "Telangana";
}
