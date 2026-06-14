import { Building2, FileCheck2, Landmark, Languages, ScanLine, ShieldCheck } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "AI Chat" },
  { href: "/workflow", label: "Workflow" },
  { href: "/documents", label: "Documents" },
  { href: "/forms", label: "Forms" },
  { href: "/schemes", label: "Schemes" },
  { href: "/service-requests", label: "Services" },
  { href: "/portals", label: "Portals" },
  { href: "/profile", label: "Profile" },
];

export const adminNavItem = { href: "/admin", label: "Admin" };

export const features = [
  { icon: Landmark, title: "Goal-Based Discovery", text: "Tell Saarthi your goal. It maps services, departments, dependencies, documents, and timelines." },
  { icon: FileCheck2, title: "Workflow Planner", text: "Dynamic approval roadmap for GHMC, Labour, Food Safety, Revenue, and MeeSeva workflows." },
  { icon: ScanLine, title: "OCR Auto-Fill", text: "Extracts Aadhaar, PAN, certificates, rental agreements, and fills government forms safely." },
  { icon: Languages, title: "Telugu + English", text: "Plain-language explanations with citizen-friendly Telugu guidance and voice-first flows." },
  { icon: Building2, title: "Scheme Matching", text: "Recommends PM SVANidhi, MSME, street vendor, farmer, student, and state benefits." },
  { icon: ShieldCheck, title: "Secure By Design", text: "Consent-led document vault, PII minimization, audit trails, and role-based admin access." }
];

export const teaShopSteps = [
  { id: 1, title: "Shop & Establishment Registration", dept: "Telangana Labour Department", status: "Ready", days: "2-4 days", documents: ["Aadhaar", "PAN", "Shop address proof"] },
  { id: 2, title: "GHMC Trade License", dept: "Greater Hyderabad Municipal Corporation", status: "Blocked by Step 1", days: "5-7 days", documents: ["Rental agreement", "Photos", "NOC if applicable"] },
  { id: 3, title: "FSSAI Basic Registration", dept: "Food Safety and Standards Authority", status: "Pending", days: "7-10 days", documents: ["Food business details", "ID proof", "Applicant photo"] },
  { id: 4, title: "GST Readiness Check", dept: "Commercial Taxes / GSTN", status: "Optional", days: "1-3 days", documents: ["PAN", "Bank details", "Business address proof"] }
];

export const documents = [
  { name: "Aadhaar", state: "Verified", fields: "Name, DOB, Address", confidence: "98%" },
  { name: "PAN", state: "Verified", fields: "PAN, Name", confidence: "96%" },
  { name: "Rental Agreement", state: "Needs Review", fields: "Premises address, owner", confidence: "81%" },
  { name: "Passport Photo", state: "Missing", fields: "Photo", confidence: "-" }
];

export const schemes = [
  { name: "PM SVANidhi", fit: "High", benefit: "Working capital loan up to Rs 50,000", reason: "Tea stall / street vendor profile in urban Hyderabad." },
  { name: "Telangana T-PRIDE", fit: "Medium", benefit: "Entrepreneurship support", reason: "Applicable if applicant belongs to eligible social category." },
  { name: "MUDRA Shishu Loan", fit: "High", benefit: "Collateral-free loan up to Rs 50,000", reason: "Suitable for micro food business setup." }
];

export const formFields = [
  { label: "Applicant Name", value: "Anil Kumar", source: "Aadhaar OCR", confidence: "98%" },
  { label: "Business Type", value: "Tea shop / food beverage kiosk", source: "AI intent", confidence: "95%" },
  { label: "Business Address", value: "Hyderabad, Telangana", source: "Rental agreement OCR", confidence: "81%" },
  { label: "Department", value: "GHMC", source: "Knowledge base", confidence: "100%" },
  { label: "License Category", value: "Eating establishment", source: "Workflow engine", confidence: "91%" }
];
