"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shipops/sidebar";
import { Topbar } from "@/components/shipops/topbar";
import { AuthScreen } from "@/components/shipops/auth-screen";
import { OrderDrawer } from "@/components/shipops/order-drawer";
import { DashboardView } from "@/components/shipops/views/dashboard";
import { UnconfirmedView } from "@/components/shipops/views/unconfirmed";
import { ConfirmedView } from "@/components/shipops/views/confirmed";
import { TrackingView } from "@/components/shipops/views/tracking";
import { AttentionView } from "@/components/shipops/views/attention";
import { ReturnsView } from "@/components/shipops/views/returns";
import { CustomersView } from "@/components/shipops/views/customers";
import { WhatsappView } from "@/components/shipops/views/whatsapp";
import { CouriersView } from "@/components/shipops/views/couriers";
import { AutomationView } from "@/components/shipops/views/automation";
import { AnalyticsView } from "@/components/shipops/views/analytics";
import { AiView } from "@/components/shipops/views/ai";
import { SettingsView } from "@/components/shipops/views/settings";
import { BillingView } from "@/components/shipops/views/billing";
import { TeamView } from "@/components/shipops/views/team";
import type { ViewKey, UserRole, Order } from "@/lib/types";

interface SessionUser {
  name: string;
  email: string;
}

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [orgName, setOrgName] = useState("Demo Store PK");
  const [view, setView] = useState<ViewKey>("dashboard");
  const [role, setRole] = useState<UserRole>("OWNER");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);

  const handleAuthSuccess = (u: SessionUser, r: string, org: string) => {
    setUser(u);
    setRole(r as UserRole);
    setOrgName(org);
    setAuthed(true);
  };

  const handleLogout = () => {
    setAuthed(false);
    setUser(null);
    setView("dashboard");
  };

  if (!authed) {
    return <AuthScreen onSuccess={handleAuthSuccess} onSwitchMode={() => {}} />;
  }

  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardView onNavigate={setView} onOpenOrder={setDrawerOrder} />;
      case "unconfirmed": return <UnconfirmedView />;
      case "confirmed": return <ConfirmedView />;
      case "tracking": return <TrackingView />;
      case "attention": return <AttentionView />;
      case "returns": return <ReturnsView />;
      case "customers": return <CustomersView />;
      case "whatsapp": return <WhatsappView />;
      case "couriers": return <CouriersView />;
      case "automation": return <AutomationView />;
      case "analytics": return <AnalyticsView />;
      case "ai": return <AiView />;
      case "settings": return <SettingsView />;
      case "billing": return <BillingView />;
      case "team": return <TeamView />;
      default: return <DashboardView onNavigate={setView} onOpenOrder={setDrawerOrder} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        currentView={view}
        onViewChange={setView}
        userRole={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userRole={role}
          currentView={view}
          onMenuClick={() => setSidebarOpen(true)}
          onRoleChange={setRole}
          userName={user?.name}
          orgName={orgName}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
      <OrderDrawer order={drawerOrder} onClose={() => setDrawerOrder(null)} />
    </div>
  );
}
