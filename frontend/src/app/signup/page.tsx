"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Send, Sparkles, ArrowRight, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendOtp, signup } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedDest, setMaskedDest] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"send" | "signup" | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleBack() {
    setStep("details");
    setOtp("");
    setMaskedDest("");
    setCountdown(0);
    setMessage("");
    setError("");
  }

  async function handleSendOtp() {
    setError("");
    setMessage("");
    if (!name.trim()) { setError("Enter your full name"); return; }
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email address"); return; }

    setLoading("send");
    try {
      const response = await sendOtp(email, "signup");
      setStep("otp");
      setMaskedDest(response.masked_destination);
      setCountdown(30);
      setMessage(`OTP sent to ${response.masked_destination}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP");
    } finally {
      setLoading(null);
    }
  }

  async function handleSignup() {
    setError("");
    setMessage("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }

    setLoading("signup");
    try {
      const response = await signup(name, email, undefined, otp);
      saveAuth(response.access_token, response.user, response.refresh_token);
      setMessage("Account created! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(null);
    }
  }

  function handleResendOtp() {
    setOtp("");
    handleSendOtp();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-white">
            <Sparkles size={32} />
          </div>
          <h1 className="text-2xl font-black text-navy">Create Account</h1>
          <p className="mt-1 text-sm text-slate-500">Join Saarthi AI with email OTP</p>
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2].map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                (step === "details" && i === 0) || (step === "otp" && i === 1)
                  ? "bg-navy text-white"
                  : step === "otp" && i === 0
                    ? "bg-telangana text-white"
                    : "bg-slate-100 text-slate-400"
              }`}>{s}</div>
              {i < 1 && <div className={`flex-1 h-0.5 ${step === "otp" ? "bg-telangana" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>

        {step === "details" && (
          <>
            <label className="text-sm font-bold text-slate-700">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-navy outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition"
              placeholder="Your full name"
              disabled={loading !== null}
            />

            <div className="flex items-center gap-2 mt-4 mb-2">
              <Mail size={16} className="text-slate-500" />
              <label className="text-sm font-bold text-slate-700">Email Address</label>
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-navy outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition"
              placeholder="you@example.com"
              disabled={loading !== null}
              autoComplete="email"
            />

            <Button
              onClick={handleSendOtp}
              disabled={loading !== null || !name.trim() || !email.trim() || !email.includes("@")}
              className="mt-6 w-full gap-2 py-3.5"
            >
              {loading === "send" ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              Send OTP
            </Button>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="rounded-xl bg-slate-50 p-4 mb-5">
              <p className="text-sm text-slate-600 text-center">
                OTP sent to <span className="font-bold text-navy">{maskedDest}</span>
              </p>
            </div>

            <label className="text-sm font-bold text-slate-700" htmlFor="otp">Enter 6-digit OTP</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-navy outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition"
              placeholder="------"
              disabled={loading !== null}
              autoFocus
              maxLength={6}
            />

            <Button
              onClick={handleSignup}
              disabled={loading !== null || otp.length !== 6}
              className="mt-5 w-full gap-2 py-3.5"
            >
              {loading === "signup" ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Create Account
            </Button>

            <div className="mt-4 flex flex-col items-center gap-2">
              {countdown > 0 ? (
                <p className="text-sm text-slate-500">
                  Resend OTP in <span className="font-bold text-navy">{countdown}s</span>
                </p>
              ) : (
                <button onClick={handleResendOtp} className="text-sm font-bold text-navy hover:underline">
                  Resend OTP
                </button>
              )}
              <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-navy transition">
                <ArrowLeft size={14} /> Change details
              </button>
            </div>
          </>
        )}

        {message && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
            <p className="text-sm font-semibold text-emerald-700">{message}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        <p className="mt-5 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-navy hover:underline">Login</Link>
        </p>
      </Card>
    </main>
  );
}
