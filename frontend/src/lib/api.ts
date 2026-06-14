const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function parseError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.detail ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export type AuthUser = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  is_verified: boolean;
  avatar_url?: string | null;
  created_at?: string | null;
};

export async function sendOtp(identifier: string, purpose: string = "login") {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, purpose })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(await parseError(response, "Unable to send OTP"));
  return data as { success: boolean; message: string; channel: string; masked_destination: string; expires_in_seconds: number; dev_otp?: string | null };
}

export async function verifyOtp(identifier: string, otp: string, purpose: string = "login") {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, otp, purpose })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(await parseError(response, "Invalid OTP"));
  return data as { success: boolean; message: string; verified: boolean; token?: string | null };
}

export async function signup(name: string, email: string, phone_number: string | undefined, otp: string) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone_number, otp })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(await parseError(response, "Unable to register"));
  return data as { access_token: string; refresh_token: string; token_type: string; expires_in: number; user: AuthUser };
}

export async function loginOtp(identifier: string, otp: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, otp })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(await parseError(response, "Invalid OTP"));
  return data as { access_token: string; refresh_token: string; token_type: string; expires_in: number; user: AuthUser };
}

export async function firebaseLogin(id_token: string, name?: string) {
  const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token, name })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(await parseError(response, "Firebase authentication failed"));
  return data as { access_token: string; refresh_token: string; token_type: string; expires_in: number; user: AuthUser };
}

export async function refreshAccessToken(refresh_token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(await parseError(response, "Session expired"));
  return data as { access_token: string; refresh_token: string; token_type: string; expires_in: number; user: AuthUser };
}

export async function logoutServer(refresh_token: string) {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token })
    });
  } catch {}
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await parseError(response, "Session expired"));
  return response.json() as Promise<AuthUser>;
}

export async function sendChatMessage(message: string) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  if (!response.ok) throw new Error("Unable to reach Saarthi AI chat service");
  return response.json() as Promise<{ response: string; intent_id?: number | null; roadmap?: unknown }>;
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/documents/upload`, { method: "POST", body: formData });
  if (!response.ok) throw new Error("Document OCR failed");
  return response.json();
}

export async function fetchSchemes(category?: string) {
  const url = category && category !== "All"
    ? `${API_BASE_URL}/schemes?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/schemes`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch schemes");
  return response.json();
}

export async function fetchDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
  if (!response.ok) throw new Error("Failed to fetch dashboard stats");
  return response.json();
}

export async function fetchIntents() {
  const response = await fetch(`${API_BASE_URL}/intents`);
  if (!response.ok) throw new Error("Failed to fetch intents");
  return response.json();
}

export async function fetchServices(department?: string) {
  const url = department
    ? `${API_BASE_URL}/services?department=${encodeURIComponent(department)}`
    : `${API_BASE_URL}/services`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch services");
  return response.json();
}

export async function fetchDepartments() {
  const response = await fetch(`${API_BASE_URL}/departments`);
  if (!response.ok) throw new Error("Failed to fetch departments");
  return response.json();
}

export async function fetchProfile(token: string) {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function updateProfile(token: string, data: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

export async function fetchAdminStats() {
  const response = await fetch(`${API_BASE_URL}/admin/stats`);
  if (!response.ok) throw new Error("Failed to fetch admin stats");
  return response.json();
}

export async function fetchAdminServices() {
  const response = await fetch(`${API_BASE_URL}/admin/services`);
  if (!response.ok) throw new Error("Failed to fetch admin services");
  return response.json();
}

export async function createAdminService(service: { name: string; department: string; fee: number; sla_days: number; description: string }) {
  const response = await fetch(`${API_BASE_URL}/admin/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(service)
  });
  if (!response.ok) throw new Error("Failed to create service");
  return response.json();
}

export async function deleteAdminService(serviceId: number) {
  const response = await fetch(`${API_BASE_URL}/admin/services/${serviceId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete service");
  return response.json();
}

export async function fetchAdminKnowledgeBase() {
  const response = await fetch(`${API_BASE_URL}/admin/knowledge-base`);
  if (!response.ok) throw new Error("Failed to fetch knowledge base");
  return response.json();
}

export async function fetchAdminAudit() {
  const response = await fetch(`${API_BASE_URL}/admin/audit`);
  if (!response.ok) throw new Error("Failed to fetch audit logs");
  return response.json();
}

export type GovPortal = {
  id: string;
  name: string;
  base_url: string;
  description: string;
  auth_type: string;
  supported_services: string[];
  status: string;
};

export async function fetchGovPortals() {
  const response = await fetch(`${API_BASE_URL}/gov/portals`);
  if (!response.ok) throw new Error("Failed to fetch government portals");
  return response.json() as Promise<GovPortal[]>;
}

export async function fetchPortalForService(serviceName: string) {
  const response = await fetch(`${API_BASE_URL}/gov/service/${encodeURIComponent(serviceName)}/portal`);
  if (!response.ok) return null;
  return response.json() as Promise<GovPortal>;
}

export async function submitToGovPortal(token: string, portalId: string, serviceName: string, formData: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}/gov/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ portal_id: portalId, service_name: serviceName, form_data: formData })
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to submit application"));
  return response.json() as Promise<{
    success: boolean;
    portal: string;
    portal_name: string;
    service: string;
    application_ref: string;
    status: string;
    message: string;
    tracking_url: string;
    submitted_at: string;
  }>;
}

export async function checkGovStatus(token: string, portalId: string, applicationRef: string) {
  const response = await fetch(`${API_BASE_URL}/gov/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ portal_id: portalId, application_ref: applicationRef })
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to check status"));
  return response.json() as Promise<{
    success: boolean;
    portal: string;
    portal_name: string;
    application_ref: string;
    status: string;
    stage: string;
    estimated_completion: string;
    last_updated: string;
  }>;
}

export async function fetchDocFromGov(token: string, docType: string, portalId: string = "digilocker") {
  const response = await fetch(`${API_BASE_URL}/gov/fetch-document/${encodeURIComponent(docType)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ portal_id: portalId })
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to fetch document"));
  return response.json();
}

export async function fetchAdminUsers(token: string, search: string = "") {
  const url = search
    ? `${API_BASE_URL}/auth/admin/users?search=${encodeURIComponent(search)}`
    : `${API_BASE_URL}/auth/admin/users`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(await parseError(response, "Failed to fetch users"));
  return response.json();
}

export async function promoteUser(token: string, email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/admin/promote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email })
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to promote user"));
  return response.json();
}

export async function demoteUser(token: string, email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/admin/demote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email })
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to demote user"));
  return response.json();
}

export async function fetchMyDashboard(token: string) {
  const response = await fetch(`${API_BASE_URL}/dashboard/my-stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard");
  return response.json();
}

export async function createServiceRequest(token: string, data: {
  service_name: string;
  service_type: string;
  description?: string;
  form_data?: Record<string, unknown>;
  documents?: string[];
}) {
  const response = await fetch(`${API_BASE_URL}/service-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to submit service request"));
  return response.json();
}

export async function fetchMyServiceRequests(token: string) {
  const response = await fetch(`${API_BASE_URL}/service-requests/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch service requests");
  return response.json();
}

export async function fetchAdminServiceRequests(token: string) {
  const response = await fetch(`${API_BASE_URL}/admin/service-requests`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch service requests");
  return response.json();
}

export async function updateServiceRequest(token: string, requestId: number, data: { status?: string; admin_notes?: string }) {
  const response = await fetch(`${API_BASE_URL}/admin/service-requests/${requestId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to update service request"));
  return response.json();
}
