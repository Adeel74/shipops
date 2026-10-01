"use client";

import { useState } from "react";
import { Ship, Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2, Truck, MessageCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AuthScreenProps {
  onSuccess: (user: { name: string; email: string }, role: string, orgName: string) => void;
  onSwitchMode: (mode: "login" | "signup" | "onboarding") => void;
}

export function AuthScreen({ onSuccess, onSwitchMode }: AuthScreenProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("hamza@demostore.pk");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/signup";
      const body = mode === "login"
        ? { email, password }
        : { name, email, password, organizationName: orgName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!json.success) {
        toast({ title: "Authentication failed", description: json.error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      toast({ title: mode === "login" ? "Welcome back!" : "Account created!", description: json.data.user.name });
      onSuccess(json.data.user, json.data.role, json.data.organization?.name || "Your Store");
    } catch {
      toast({ title: "Network error", description: "Please try again", variant: "destructive" });
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("hamza@demostore.pk");
    setPassword("demo1234");
    setMode("login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side — branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-700 via-emerald-700 to-cyan-800 p-12 text-white lg:flex">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">ShipOps</p>
              <p className="text-xs text-white/70">COD Operations Cloud</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="mb-3 text-3xl font-bold leading-tight">
              The operations command center for Shopify COD merchants.
            </h1>
            <p className="text-white/80">
              Confirm orders via WhatsApp, dispatch through TCS/Leopards/Trax, resolve exceptions with AI, and recover RTOs with evidence.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: MessageCircle, title: "WhatsApp Confirmation", desc: "Auto-confirm COD orders without manual calls" },
              { icon: AlertTriangle, title: "AI-Powered Exceptions", desc: "Auto-triage bad addresses, refusals, and delays" },
              { icon: CheckCircle2, title: "Evidence-Based RTO Recovery", desc: "Dispute courier reports with full timelines" },
              { icon: Truck, title: "6+ Pakistani Couriers", desc: "TCS, Leopards, Trax, M&P, PostEx, Call Courier" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-white/70">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-4 text-xs text-white/60">
          <span>Trusted by 200+ stores in Pakistan</span>
          <span>·</span>
          <span>SOC 2 ready</span>
          <span>·</span>
          <span>99.9% uptime</span>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">ShipOps</p>
              <p className="text-xs text-muted-foreground">COD Operations Cloud</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "Sign in to your ShipOps workspace"
                : "Start managing your COD operations in minutes"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Hamza Sheikh"
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Store / Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Demo Store PK"
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@store.com"
                  required
                  className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signup" && <p className="mt-1 text-[11px] text-muted-foreground">Minimum 8 characters</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo login helper */}
          {mode === "login" && (
            <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                <Sparkles className="h-3.5 w-3.5" />
                Demo Account
              </p>
              <p className="mt-1 text-xs text-violet-700/80">
                Email: <code className="font-mono">hamza@demostore.pk</code> · Password: <code className="font-mono">demo1234</code>
              </p>
              <button onClick={fillDemo} className="mt-1.5 text-xs font-medium text-violet-700 underline hover:text-violet-800">
                Fill demo credentials
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
