"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Send, ArrowRight, Shield, Mail, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendOtp, loginOtp } from "@/lib/api";
import { saveAuth, setLoginMode } from "@/lib/auth";

type LoginMode = "citizen" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("citizen");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [maskedDest, setMaskedDest] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"send" | "verify" | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function resetState() {
    setOtpSent(false);
    setOtp("");
    setMaskedDest("");
    setCountdown(0);
    setMessage("");
    setError("");
  }

  function switchMode(newMode: LoginMode) {
    setMode(newMode);
    resetState();
    setEmail("");
  }

  async function handleSendOtp() {
    setError("");
    setMessage("");
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setLoading("send");
    try {
      const response = await sendOtp(email, "login");
      setOtpSent(true);
      setMaskedDest(response.masked_destination);
      setCountdown(30);
      setMessage(`OTP sent to ${response.masked_destination}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP");
    } finally {
      setLoading(null);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    setMessage("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setLoading("verify");
    try {
      const response = await loginOtp(email, otp);
      const user = response.user;
      const userRole = (user as Record<string, unknown>).role;

      if (mode === "admin" && userRole !== "admin") {
        setError("This email is not registered as an admin. Please use a valid admin account.");
        setLoading(null);
        return;
      }

      saveAuth(response.access_token, response.user, response.refresh_token);
      setLoginMode(mode);

      if (mode === "admin") {
        setMessage("Admin login successful. Redirecting to admin panel...");
        setTimeout(() => router.push("/admin"), 500);
      } else {
        setMessage("Login successful. Redirecting...");
        setTimeout(() => router.push("/dashboard"), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
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
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black text-navy">Welcome to Saarthi AI</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in with your email OTP</p>
        </div>

        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => switchMode("citizen")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
              mode === "citizen"
                ? "bg-white text-navy shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <User size={16} />
            Citizen Login
          </button>
          <button
            onClick={() => switchMode("admin")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
              mode === "admin"
                ? "bg-saffron text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShieldCheck size={16} />
            Admin Login
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Mail size={16} className="text-slate-500" />
          <label className="text-sm font-bold text-slate-700" htmlFor="email">Email Address</label>
        </div>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !otpSent && handleSendOtp()}
          className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-navy outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition"
          placeholder={mode === "admin" ? "admin@example.com" : "you@example.com"}
          disabled={loading !== null || otpSent}
          autoComplete="email"
        />

        {mode === "admin" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-saffron font-semibold">
            <ShieldCheck size={12} />
            Admin access requires an authorized admin account
          </p>
        )}

        {!otpSent ? (
          <Button
            onClick={handleSendOtp}
            disabled={loading !== null || !email.trim() || !email.includes("@")}
            className={`mt-5 w-full gap-2 py-3.5 ${mode === "admin" ? "bg-saffron hover:bg-saffron/90" : ""}`}
          >
            {loading === "send" ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Send OTP
          </Button>
        ) : (
          <>
            <div className="rounded-xl bg-slate-50 p-3 mt-4 mb-4">
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
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-navy outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition"
              placeholder="------"
              disabled={loading !== null}
              autoFocus
              maxLength={6}
            />

            <Button
              onClick={handleVerifyOtp}
              disabled={loading !== null || otp.length !== 6}
              className={`mt-5 w-full gap-2 py-3.5 ${mode === "admin" ? "bg-saffron hover:bg-saffron/90" : ""}`}
            >
              {loading === "verify" ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              {mode === "admin" ? "Verify & Access Admin" : "Verify & Login"}
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
              <button onClick={resetState} className="text-sm text-slate-500 hover:text-navy transition">
                Change email address
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

        {mode === "citizen" && (
          <div className="mt-6 flex flex-col items-center gap-2 text-sm border-t border-slate-100 pt-5">
            <p className="text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-bold text-navy hover:underline">Sign up</Link>
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-xs leading-5 text-slate-400">
          By continuing, you agree to Saarthi AI&apos;s Terms of Service and Privacy Policy.
        </p>
      </Card>
    </main>
  );
}
