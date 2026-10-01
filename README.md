# ShipOps — COD Operations Cloud

A production-grade SaaS product for Shopify COD (Cash on Delivery) merchants in Pakistan. ShipOps automates order verification via WhatsApp, manages courier dispatch across 6+ Pakistani couriers, uses AI to triage delivery exceptions, and recovers RTOs (Return-to-Origin) with evidence-based dispute timelines.

## Features

### Order Lifecycle Management
- **Shopify Sync** — Webhook receiver for `orders/create`, `orders/updated`, `orders/fulfilled`
- **WhatsApp Confirmation** — Auto-send COD confirmation requests; auto-confirm on customer reply
- **Courier Dispatch** — Create shipments via TCS, Leopards, Trax, M&P, PostEx, Call Courier
- **Live Tracking** — Unified tracking timeline across all couriers with event sourcing
- **Needs Attention** — AI-triaged exception cases (bad address, customer refused, courier delay)
- **Returns/RTO** — Evidence timeline (courier events + WhatsApp + customer replies + agent actions) for dispute filing

### AI-Powered Operations
- **RTO Risk Engine** — Computes risk score per order based on customer history, address completeness, COD amount
- **Auto-Triage** — Courier exception events automatically create Attention cases with AI confidence scores
- **Recommended Actions** — Context-aware suggestions for each exception type
- **AI Tool Architecture** — 8 registered tools (getOrder, getCustomer, calculateRisk, etc.) with human-in-the-loop

### Multi-Tenant SaaS
- **Organization-scoped** — Every query filtered by `organizationId`
- **RBAC** — 5 roles (OWNER, ADMIN, MANAGER, OPERATOR, VIEWER) with permission enforcement on backend
- **Team Invitations** — Email-based invite with 7-day expiry tokens
- **Audit Logging** — Every mutation recorded with user, action, old/new data

### Integrations
- **Shopify** — OAuth + webhook receiver with HMAC verification scaffold
- **WhatsApp Business Cloud API** — Webhook receiver for incoming messages + status updates
- **Couriers** — Provider-agnostic webhook receiver for tracking events

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM (SQLite for dev, PostgreSQL for production) |
| Auth | Session-based with httpOnly cookies + SHA-256 password hashing |
| Validation | Zod |
| Icons | Lucide React |

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Set Up Database
```bash
# Push schema to SQLite
bun run db:push

# Seed demo data
bun run prisma/seed/index.ts
```

### 3. Run Dev Server
```bash
bun run dev
```

### 4. Login
```
URL:      http://localhost:3000
Email:    hamza@demostore.pk
Password: demo1234
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | hamza@demostore.pk | demo1234 |
| Admin | ayesha.ops@demostore.pk | demo1234 |
| Manager | bilal@demostore.pk | demo1234 |
| Operator | sana@demostore.pk | demo1234 |
| Operator | usman@demostore.pk | demo1234 |

## API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/signup` | Create account + organization |
| POST | `/api/v1/auth/logout` | Destroy session |
| GET | `/api/v1/auth/me` | Current user + org + role |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders?status=` | List orders (filter by status) |
| GET | `/api/v1/orders/:id` | Full order detail with evidence |
| PATCH | `/api/v1/orders/:id` | Update order status |
| POST | `/api/v1/orders/:id/confirm` | Confirm order |
| POST | `/api/v1/orders/:id/cancel` | Cancel order |
| POST | `/api/v1/orders/:id/create-shipment` | Create courier shipment |
| POST | `/api/v1/orders/bulk` | Bulk confirm/cancel |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/shopify` | Shopify order events |
| GET/POST | `/api/webhooks/whatsapp` | WhatsApp messages + status |
| POST | `/api/webhooks/courier/:provider` | Courier tracking events |

### Other Resources
| Resource | Endpoints |
|----------|-----------|
| Customers | list, flag/blacklist |
| Attention | list, resolve |
| Couriers | list, connect, disconnect, update |
| Automation | list, create, update, delete |
| WhatsApp | conversations, send |
| Analytics | computed stats |
| AI | insights, risk predictions |
| Team | list, invite |
| Notifications | real-time alerts |
| Search | global (orders, customers, shipments) |
| Audit Logs | list |
| Export | orders CSV, customers CSV |
| Health | system status |
| Jobs | queue status |

## Architecture

```
ShipOps
  ├── src/
  │   ├── app/
  │   │   ├── api/v1/          # REST API routes (30+ endpoints)
  │   │   ├── api/webhooks/    # Shopify, WhatsApp, Courier webhooks
  │   │   ├── page.tsx         # Main SPA entry (auth → onboarding → dashboard)
  │   │   ├── error.tsx        # Error boundary
  │   │   ├── global-error.tsx # Global error handler
  │   │   └── not-found.tsx    # 404 page
  │   ├── components/shipops/  # UI components (15 views + shared)
  │   ├── hooks/               # useApi (fetching + polling), use-toast
  │   └── lib/                 # db, auth, api, validations, format, types
  ├── prisma/
  │   ├── schema.prisma        # 18 models (multi-tenant)
  │   └── seed/index.ts        # Demo data seeder
  └── package.json
```

## Database Schema (18 Models)

**Auth & Org**: User, Organization, OrganizationMember, Session, OrganizationInvitation
**Commerce**: Store, Customer, Address, Product, Order, OrderItem, OrderStatusHistory
**Messaging**: WhatsAppAccount, WhatsAppMessage
**Logistics**: CourierAccount, Shipment, TrackingEvent
**Operations**: AttentionCase, Return, EvidenceItem, AutomationRule, AutomationRun, AuditLog

## Automation Pipeline

```
Shopify Order Created
    ↓
Webhook → processShopifyOrder()
    ↓
Customer upsert + Address + Order + Items
    ↓
If COD → Auto-send WhatsApp confirmation
    ↓
Customer replies "CONFIRM"
    ↓
WhatsApp webhook → auto-confirm order
    ↓
Operator creates shipment (TCS/Leopards/etc.)
    ↓
Courier webhook → tracking events → status updates
    ↓
Exception? → AI triage → Attention case
    ↓
RTO? → Evidence bundle → Dispute filing
```

## Production Deployment

### Environment Variables
```env
DATABASE_URL="postgresql://user:pass@host:5432/shipops"
NEXT_PUBLIC_APP_URL="https://app.shipops.pk"
SHOPIFY_API_SECRET="your-shopify-secret"
WHATSAPP_VERIFY_TOKEN="your-whatsapp-verify-token"
WHATSAPP_ACCESS_TOKEN="your-whatsapp-token"
```

### PostgreSQL Migration
For production, switch from SQLite to PostgreSQL:
1. Update `prisma/schema.prisma` datasource provider to `"postgresql"`
2. Add `Decimal` types for money fields
3. Add `enum` types for status fields
4. Run `npx prisma migrate dev --name init`

## License

Proprietary — ShipOps COD Operations Cloud
