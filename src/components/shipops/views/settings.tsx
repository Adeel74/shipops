"use client";

import { Store, Shield, Bell, Globe, CreditCard, Webhook, Key, Copy, Check, ExternalLink, Database } from "lucide-react";
import { useState } from "react";
import { PageContainer, SectionCard } from "../shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function SettingsView() {
  const { toast } = useToast();
  const [shopifyConnected, setShopifyConnected] = useState(true);
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [notifPrefs, setNotifPrefs] = useState({
    newOrders: true,
    attentionCases: true,
    rtoAlerts: true,
    dailySummary: false,
    courierErrors: true,
  });

  return (
    <PageContainer className="space-y-5">
      {/* Organization */}
      <SectionCard title="Organization" description="Your ShipOps workspace details">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization Name</label>
            <input type="text" defaultValue="Demo Store PK" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Slug</label>
            <input type="text" defaultValue="demo-store-pk" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Country</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring">
              <option>Pakistan</option>
              <option>Bangladesh</option>
              <option>India</option>
              <option>UAE</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Timezone</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring">
              <option>Asia/Karachi (PKT)</option>
              <option>Asia/Dhaka (BST)</option>
              <option>Asia/Kolkata (IST)</option>
              <option>Asia/Dubai (GST)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Currency</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring">
              <option>PKR — Pakistani Rupee</option>
              <option>BDT — Bangladeshi Taka</option>
              <option>INR — Indian Rupee</option>
              <option>AED — UAE Dirham</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Default Courier</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring">
              <option>Auto (Smart Routing)</option>
              <option>TCS</option>
              <option>Leopards</option>
              <option>Trax</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => toast({ title: "Settings saved" })} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Save Changes
          </button>
        </div>
      </SectionCard>

      {/* Shopify integration */}
      <SectionCard
        title="Shopify Integration"
        description="Your Shopify store connection"
        action={
          <div className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            shopifyConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-600"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", shopifyConnected ? "bg-emerald-500" : "bg-zinc-400")} />
            {shopifyConnected ? "Connected" : "Not connected"}
          </div>
        }
      >
        {shopifyConnected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Shop Domain</p>
                <p className="text-sm font-mono font-medium">demo-store-pk.myshopify.com</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Shopify Plan</p>
                <p className="text-sm font-medium">Shopify Basic</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Connected Since</p>
                <p className="text-sm font-medium">Mar 15, 2026</p>
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700">Access Token (encrypted)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate font-mono text-xs">shpat_••••••••••••••••••••••••••••••••</code>
                <button onClick={() => toast({ title: "Token copied to clipboard" })} className="rounded p-1 hover:bg-amber-100">
                  <Copy className="h-3.5 w-3.5 text-amber-700" />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-amber-700/70">Stored encrypted at rest. Last rotated 2 months ago.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toast({ title: "Syncing orders...", description: "Fetching latest 250 orders from Shopify" })} className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                <Store className="h-3.5 w-3.5" />
                Sync Now
              </button>
              <button onClick={() => setShopifyConnected(false)} className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Store className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-semibold">Connect your Shopify store</p>
            <p className="mb-4 max-w-sm text-xs text-muted-foreground">Connect Shopify to sync orders, customers, and products automatically.</p>
            <button onClick={() => { setShopifyConnected(true); toast({ title: "Shopify connected!", description: "OAuth flow completed" }); }} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Store className="h-4 w-4" />
              Connect Shopify
            </button>
          </div>
        )}
      </SectionCard>

      {/* WhatsApp integration */}
      <SectionCard
        title="WhatsApp Business API"
        description="Send order confirmations & receive customer replies"
        action={
          <div className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            whatsappConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-600"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", whatsappConnected ? "bg-emerald-500" : "bg-zinc-400")} />
            {whatsappConnected ? "Active" : "Not connected"}
          </div>
        }
      >
        {whatsappConnected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="text-sm font-medium">+92 300 1234567</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Display Name</p>
                <p className="text-sm font-medium">Demo Store PK</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Quality Rating</p>
                <p className="text-sm font-medium text-emerald-600">High (Green)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Messages Sent (24h)</p>
                <p className="text-lg font-bold">1,842</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Delivery Rate</p>
                <p className="text-lg font-bold text-emerald-600">97.3%</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">Connect WhatsApp Business API to automate COD confirmations.</p>
            <button onClick={() => setWhatsappConnected(true)} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Connect WhatsApp
            </button>
          </div>
        )}
      </SectionCard>

      {/* Webhooks */}
      <SectionCard title="Webhooks" description="Endpoints ShipOps will call for integration events">
        <div className="space-y-2">
          {[
            { event: "Shopify → ShipOps", url: "/api/webhooks/shopify", desc: "Orders, customers, products sync" },
            { event: "WhatsApp → ShipOps", url: "/api/webhooks/whatsapp", desc: "Incoming messages & status" },
            { event: "Courier → ShipOps", url: "/api/webhooks/courier/:provider", desc: "Tracking events & status updates" },
          ].map((w) => (
            <div key={w.event} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">{w.event}</span>
                  <code className="truncate text-xs font-mono">{w.url}</code>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{w.desc}</p>
              </div>
              <button onClick={() => toast({ title: "Webhook URL copied", description: w.url })} className="rounded p-1.5 hover:bg-muted">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notification Preferences" description="Choose what alerts you receive">
        <div className="space-y-3">
          {[
            { key: "newOrders", label: "New Orders", desc: "When a new order arrives from Shopify" },
            { key: "attentionCases", label: "Needs Attention", desc: "When AI flags an order requiring action" },
            { key: "rtoAlerts", label: "RTO Alerts", desc: "When an order is marked as return" },
            { key: "dailySummary", label: "Daily Summary", desc: "End-of-day operations summary (8 PM)" },
            { key: "courierErrors", label: "Courier Errors", desc: "API failures or stuck shipments" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifPrefs((p) => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                className={cn("relative h-5 w-9 rounded-full transition-colors", notifPrefs[n.key as keyof typeof notifPrefs] ? "bg-emerald-500" : "bg-muted")}
              >
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", notifPrefs[n.key as keyof typeof notifPrefs] ? "left-[18px]" : "left-0.5")} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Security */}
      <SectionCard title="Security" description="API keys & access control">
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">API Key</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-xs">sk_live_••••••••••••••••••••••••</code>
              <button onClick={() => toast({ title: "API key revealed (30s)" })} className="rounded p-1.5 hover:bg-muted">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => toast({ title: "Copied" })} className="rounded p-1.5 hover:bg-muted">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <button onClick={() => toast({ title: "Rotating API key...", description: "Old key will expire in 24h" })} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
            <Key className="h-3.5 w-3.5" />
            Rotate API Key
          </button>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
