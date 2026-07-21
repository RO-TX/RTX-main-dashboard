# RTX Main Dashboard

Admin dashboard for the **RO Technical Xperts** platform. Talks to `RTX-main-backend`.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 (design tokens) ·
Zustand (auth) · lucide-react. Follows `RTX-PLATFORM-STANDARDS.md`.

---

## Quick start

```bash
npm install
cp .env.example .env.local      # already present locally; points at the backend
npm run dev                     # http://localhost:3001
```

The backend must be running (default `http://localhost:5000/api`). Set the URL via
`NEXT_PUBLIC_API_URL` in `.env.local`.

**Seed admin login** (created by the backend's `npm run seed`):
`admin@rotechnicalxperts.com` / `Admin@123`

---

## What's here

| Page | Route | Backend |
|---|---|---|
| Overview | `/` | `/analytics/overview`, `/analytics/revenue-series`, `/analytics/recent-orders` |
| Orders | `/orders` | `/orders` (list + status update) |
| Products | `/products` | `/catalog/products` (list, create, delete) |
| Categories | `/categories` | `/catalog/categories` |
| Customers & Staff | `/users` | `/users` (list, role change) |
| Testimonials | `/reviews` | `/content/reviews` |
| Certifications | `/certifications` | `/content/certifications` |
| Repair Requests | `/repair-requests` | `/support/repair-requests` |
| AMC Enquiries | `/amc-enquiries` | `/support/amc-enquiries` |
| **API Tester** | `/api-tester` | any endpoint — send authed requests from the UI |
| Login | `/login` | `/auth/login` |

### API Tester
A built-in playground (`/api-tester`) to send authenticated requests to any backend
endpoint — pick a method + path, optional JSON body, and see the status, timing, and
response. Your access token is attached automatically. Quick-endpoint presets included.

---

## How it's wired

- **`src/lib/api.ts`** — typed fetch client. Attaches `Authorization: Bearer <token>`,
  sends the refresh cookie (`credentials: include`), and on a 401 transparently calls
  `/auth/refresh` once and retries.
- **`src/lib/auth-store.ts`** — Zustand store (persisted) holding the access token +
  current user. The httpOnly refresh cookie is the real source of truth.
- **`src/components/AuthGate.tsx`** — verifies the session on mount and bounces
  non-staff / unauthenticated users to `/login`.
- **`src/hooks/useApi.ts`** — small SWR-lite data hook (`{ data, loading, error, refetch }`).
- Design tokens live in `src/app/globals.css` under Tailwind v4 `@theme` — use
  `bg-primary`, `text-heading`, etc. (never raw hex).

---

## Structure

```
src/
  app/
    layout.tsx            # root (html/body, font)
    login/page.tsx        # public login
    (app)/                # authenticated shell (sidebar + topbar + AuthGate)
      layout.tsx
      page.tsx            # overview
      orders/  products/  categories/  users/
      reviews/  certifications/  repair-requests/  amc-enquiries/
      api-tester/
  components/             # Sidebar, Topbar, AuthGate, ui primitives
  hooks/useApi.ts
  lib/                    # api client, auth store, types, format helpers
```

---

## Notes
- Uses a lightweight `useApi` hook rather than TanStack Query for now (the standards
  doc lists TanStack Query as *proposed*; easy to migrate later).
- Charts (revenue bars, status breakdown) are hand-rolled with CSS — no chart lib
  dependency yet.
