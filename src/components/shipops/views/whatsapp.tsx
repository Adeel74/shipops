"use client";

import { useState, useMemo } from "react";
import { MessageCircle, Send, Bot, Check, CheckCheck, Clock, Search, Phone, Video, MoreVertical, Paperclip } from "lucide-react";
import { formatTime, formatTimeAgo } from "@/lib/format";
import { PageContainer, EmptyState } from "../shared";
import { LoadingScreen } from "../loading";
import { useApi, apiPost } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { WhatsAppConversation, WhatsAppMessage } from "@/lib/types";

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelled", color: "bg-rose-100 text-rose-700 border-rose-200" },
  AWAITING_REPLY: { label: "Awaiting Reply", color: "bg-sky-100 text-sky-700 border-sky-200" },
  RESOLVED: { label: "Resolved", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export function WhatsappView() {
  const { toast } = useToast();
  const { data, loading, refetch } = useApi<{ conversations: WhatsAppConversation[]; total: number }>("/api/v1/whatsapp/conversations");
  const conversations = data?.conversations || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const selected = useMemo(() => {
    if (conversations.length === 0) return null;
    return conversations.find((c) => c.id === selectedId) || conversations[0];
  }, [conversations, selectedId]);

  const filtered = conversations.filter(
    (c) => !search || c.customerName.toLowerCase().includes(search.toLowerCase()) || c.customerPhone.includes(search) || (c.orderNumber || "").includes(search)
  );

  const sendMessage = async () => {
    if (!draft.trim() || !selected) return;
    const res = await apiPost("/api/v1/whatsapp/send", {
      customerId: selected.customerId,
      orderId: selected.messages[0]?.orderId,
      message: draft,
    });
    if (res.success) {
      toast({ title: "Message sent", description: `To ${selected.customerName}` });
      setDraft("");
      refetch();
    } else {
      toast({ title: "Failed to send", description: res.error, variant: "destructive" });
    }
  };

  if (loading) return <PageContainer><LoadingScreen message="Loading conversations..." /></PageContainer>;

  return (
    <PageContainer className="p-0">
      <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-3">
        {/* Conversations list */}
        <div className={cn("flex flex-col border-r border-border bg-card", selected && "hidden lg:flex")}>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="h-9 w-full rounded-md border border-input bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-background"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/60 p-3 text-left transition-colors hover:bg-muted/30",
                  selected?.id === c.id && "bg-muted/50"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                  {c.customerName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{c.customerName}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(c.lastMessageTime)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.orderNumber || "No order"} · {c.customerPhone}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-semibold", statusConfig[c.status].color)}>
                      {statusConfig[c.status].label}
                    </span>
                    {c.unread > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation panel */}
        {selected ? (
          <div className="flex flex-col lg:col-span-2">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedId(null)} className="rounded p-1 hover:bg-muted lg:hidden">
                  <MoreVertical className="h-5 w-5" />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                  {selected.customerName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">{selected.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selected.customerPhone} {selected.orderNumber && `· ${selected.orderNumber}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold", statusConfig[selected.status].color)}>
                  {statusConfig[selected.status].label}
                </span>
                <button className="rounded-md p-2 hover:bg-muted"><Phone className="h-4 w-4 text-muted-foreground" /></button>
                <button className="rounded-md p-2 hover:bg-muted"><Video className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.85 0.01 250) 1px, transparent 0)", backgroundSize: "24px 24px" }}>
              {selected.messages.map((msg: WhatsAppMessage) => (
                <div key={msg.id} className={cn("flex", msg.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm",
                    msg.direction === "OUTBOUND"
                      ? "rounded-br-sm bg-emerald-600 text-white"
                      : "rounded-bl-sm bg-white text-foreground border border-border"
                  )}>
                    {msg.isAutomated && (
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold opacity-80">
                        <Bot className="h-3 w-3" />
                        AUTOMATED
                      </div>
                    )}
                    <p className="text-sm leading-snug">{msg.body}</p>
                    <div className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", msg.direction === "OUTBOUND" ? "text-white/70" : "text-muted-foreground")}>
                      {formatTime(msg.timestamp)}
                      {msg.direction === "OUTBOUND" && (
                        msg.status === "READ" ? <CheckCheck className="h-3 w-3 text-sky-300" /> :
                        msg.status === "DELIVERED" ? <CheckCheck className="h-3 w-3" /> :
                        msg.status === "SENT" ? <Check className="h-3 w-3" /> :
                        msg.status === "FAILED" ? <Clock className="h-3 w-3 text-red-300" /> : null
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick replies */}
            <div className="flex gap-1.5 overflow-x-auto border-t border-border bg-card px-3 py-2">
              {["Confirm karein", "Address share karein", "Delivery time?", "Cancel", "Rider on the way"].map((q) => (
                <button
                  key={q}
                  onClick={() => setDraft(q)}
                  className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-border bg-card p-3">
              <button className="rounded-md p-2 hover:bg-muted"><Paperclip className="h-5 w-5 text-muted-foreground" /></button>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="h-10 flex-1 rounded-full border border-input bg-muted/40 px-4 text-sm outline-none focus:border-ring focus:bg-background"
              />
              <button
                onClick={sendMessage}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex lg:col-span-2 items-center justify-center">
            <EmptyState icon={MessageCircle} title="Select a conversation" description="Choose a conversation from the left to start chatting." />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
