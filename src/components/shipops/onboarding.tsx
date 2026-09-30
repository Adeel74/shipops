"use client";

import { useState } from "react";
import { Ship, Store, Check, ArrowRight, ArrowLeft, Zap, MessageCircle, Truck, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface OnboardingProps {
  orgName: string;
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  { id: 0, label: "Welcome", icon: Ship },
  { id: 1, label: "Connect Shopify", icon: Store },
  { id: 2, label: "WhatsApp Setup", icon: MessageCircle },
  { id: 3, label: "Couriers", icon: Truck },
  { id: 4, label: "Done", icon: Check },
];

export function Onboarding({ orgName, onComplete, onSkip }: OnboardingProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [shopDomain, setShopDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState<Record<number, boolean>>({});

  const handleConnectShopify = async () => {
    if (!shopDomain || !shopDomain.endsWith(".myshopify.com")) {
      toast({ title: "Invalid domain", description: "Shop domain must end with .myshopify.com", variant: "destructive" });
      return;
    }
    setConnecting(true);
    const res = await fetch("/api/v1/shopify/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopDomain }),
    });
    const json = await res.json();
    setConnecting(false);
    if (json.success) {
      setConnected((p) => ({ ...p, 1: true }));
      toast({ title: "Shopify connected!", description: `${shopDomain} is now synced` });
    } else {
      toast({ title: "Connection failed", description: json.error?.message, variant: "destructive" });
    }
  };

  const handleSkipStep = () => {
    setConnected((p) => ({ ...p, [step]: true }));
  };

  const next = () => {
    if (step < 4) setStep(step + 1);
    else onComplete();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-teal-50 via-background to-emerald-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ship className="h-5 w-5" />
          </div>
          <span className="font-bold">ShipOps</span>
        </div>
        <button onClick={onSkip} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Skip for now
        </button>
      </header>

      {/* Progress steps */}
      <div className="mx-auto w-full max-w-3xl px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i < step || connected[i];
            const active = i === step;
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      done ? "border-primary bg-primary text-primary-foreground" : active ? "border-primary text-primary" : "border-muted text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn("text-[10px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("mx-2 h-0.5 flex-1 rounded-full transition-colors", i < step || connected[i] ? "bg-primary" : "bg-muted")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-6 py-8">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <Ship className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Welcome to ShipOps, {orgName}!</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Let&apos;s set up your COD operations in 4 quick steps. You can skip any step and come back later.
              </p>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: Store, title: "Connect Shopify", desc: "Sync orders automatically" },
                  { icon: MessageCircle, title: "WhatsApp Setup", desc: "Automate COD confirmations" },
                  { icon: Truck, title: "Add Couriers", desc: "TCS, Leopards, Trax & more" },
                  { icon: Zap, title: "Start Automating", desc: "Rules & AI risk analysis" },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="rounded-lg border border-border bg-muted/20 p-3">
                      <Icon className="mb-1.5 h-5 w-5 text-primary" />
                      <p className="text-sm font-semibold">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Connect Shopify */}
          {step === 1 && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connect your Shopify store</h2>
                  <p className="text-sm text-muted-foreground">Enter your shop domain to sync orders automatically</p>
                </div>
              </div>

              {connected[1] ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <Check className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                  <p className="font-semibold text-emerald-800">Shopify connected!</p>
                  <p className="text-sm text-emerald-700">{shopDomain}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Shopify Shop Domain</label>
                    <input
                      type="text"
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      placeholder="your-store.myshopify.com"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Enter your Shopify store URL (e.g., my-store.myshopify.com)</p>
                  </div>
                  <button
                    onClick={handleConnectShopify}
                    disabled={connecting}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {connecting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
                    ) : (
                      <>Connect Shopify <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                  <button onClick={handleSkipStep} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                    I&apos;ll do this later
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: WhatsApp */}
          {step === 2 && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connect WhatsApp Business</h2>
                  <p className="text-sm text-muted-foreground">Automate COD order confirmations via WhatsApp</p>
                </div>
              </div>

              {connected[2] ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <Check className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                  <p className="font-semibold text-emerald-800">WhatsApp connected!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="mb-2 text-sm font-medium">How it works:</p>
                    <ol className="space-y-1.5 text-xs text-muted-foreground">
                      <li>1. Sign up at <strong>business.whatsapp.com</strong></li>
                      <li>2. Get your Phone Number ID and Access Token</li>
                      <li>3. Enter them in Settings → WhatsApp</li>
                      <li>4. ShipOps will auto-send confirmations for every COD order</li>
                    </ol>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="WhatsApp Phone Number (e.g., +92 300 1234567)"
                      className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                    />
                    <button
                      onClick={() => { setConnected((p) => ({ ...p, 2: true })); toast({ title: "WhatsApp connected!" }); }}
                      className="rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Connect
                    </button>
                  </div>
                  <button onClick={handleSkipStep} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                    I&apos;ll do this later
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Couriers */}
          {step === 3 && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connect courier accounts</h2>
                  <p className="text-sm text-muted-foreground">Enable dispatch through Pakistani couriers</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { name: "TCS", color: "#E63946", desc: "Largest network" },
                  { name: "Leopards", color: "#F4A261", desc: "Wide coverage" },
                  { name: "Trax", color: "#2A9D8F", desc: "Fast remittance" },
                  { name: "M&P", color: "#6A4C93", desc: "Punjab specialist" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: c.color }}>
                      {c.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                    <button
                      onClick={() => toast({ title: `${c.name} connection`, description: "API key entry form would open" })}
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleSkipStep} className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground">
                Connect couriers later
              </button>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <Sparkles className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">You&apos;re all set! 🎉</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Your ShipOps workspace is ready. Start managing your COD operations now.
              </p>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <Store className="mb-1 h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold">Shopify</p>
                  <p className="text-xs text-emerald-700">{connected[1] ? "Connected" : "Skipped"}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <MessageCircle className="mb-1 h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold">WhatsApp</p>
                  <p className="text-xs text-emerald-700">{connected[2] ? "Connected" : "Skipped"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {step === 4 ? "Go to Dashboard" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
