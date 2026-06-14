"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, logout } from "@/lib/auth";
import { useIsClient } from "@/lib/use-is-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type Profile = {
  full_name: string;
  phone: string;
  email: string;
  location: string;
  district: string;
  citizen_type: string;
  preferred_language: string;
  demographics: Record<string, unknown>;
};

type FieldConfig = {
  key: keyof Omit<Profile, "demographics">;
  label: string;
  type?: string;
};

const fields: FieldConfig[] = [
  { key: "full_name", label: "Full Name" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "location", label: "Location" },
  { key: "district", label: "District" },
  { key: "citizen_type", label: "Citizen Type" },
  { key: "preferred_language", label: "Preferred Language" },
];

export default function ProfilePage() {
  const isClient = useIsClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const authenticated = isClient && isAuthenticated();

  useEffect(() => {
    if (!authenticated) return;

    async function fetchProfile() {
      const token = getToken();
      if (!token) { setLoading(false); return; }

      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load profile");
        const data: Profile = await res.json();
        setProfile(data);
        setForm(data);
      } catch {
        setMessage({ type: "error", text: "Unable to load profile. Please try again." });
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [authenticated, router]);

  if (!authenticated) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Citizen profile"
          title="Reusable, consent-led service profile"
          description="Profile data reduces duplicate entry while preserving user consent, visibility, and control over PII usage."
        />
        <Card className="max-w-3xl text-center space-y-4">
          <p className="text-slate-600">Please log in to view and edit your profile.</p>
          <Link href="/login">
            <Button variant="primary">Login</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  function handleChange(key: keyof Profile, value: string) {
    if (!form) return;
    setForm({ ...form, [key]: value });
  }

  async function handleSave() {
    if (!form) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        logout();
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to save profile");
      const updated: Profile = await res.json();
      setProfile(updated);
      setForm(updated);
      setMessage({ type: "success", text: "Profile saved successfully." });
    } catch {
      setMessage({ type: "error", text: "Unable to save profile. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const dirty = JSON.stringify(profile) !== JSON.stringify(form);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Citizen profile"
        title="Reusable, consent-led service profile"
        description="Profile data reduces duplicate entry while preserving user consent, visibility, and control over PII usage."
      />
      <Card className="max-w-3xl">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading profile…</div>
        ) : message?.type === "error" && !form ? (
          <div className="text-center py-12 text-red-600">{message.text}</div>
        ) : form ? (
          <div className="space-y-4">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="grid gap-2 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[14rem_1fr] items-center">
                <label htmlFor={key} className="font-bold text-slate-500">
                  {label}
                </label>
                <input
                  id={key}
                  type={type ?? "text"}
                  value={form[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-navy font-black focus:outline-none focus:ring-2 focus:ring-saffron/40 transition"
                />
              </div>
            ))}

            {message && (
              <div
                className={`rounded-2xl p-4 text-sm font-semibold ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving || !dirty}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </AppShell>
  );
}
