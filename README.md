# 🍌 Banello Business Platform

> Premium fresh produce from the breezy mountains of Bugisu — Business operations platform

---

## Quick deploy to Vercel

```bash
# 1. Clone / unzip this project
cd banello

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev
# Opens at http://localhost:3000

# 4. Deploy to Vercel
npx vercel --prod
```

Or connect this folder to a GitHub repo and import into vercel.com — zero config needed. Vercel auto-detects Next.js.

---

## Project structure

```
banello/
├── public/
│   └── favicon.svg              # Brand favicon
├── src/
│   ├── data/
│   │   └── store.ts             # ALL data: farmers, expenses, sales, batches
│   ├── pages/
│   │   ├── _app.tsx             # App wrapper + global CSS import
│   │   ├── _document.tsx        # HTML shell + font preload
│   │   └── index.tsx            # Full platform SPA (all pages)
│   ├── styles/
│   │   └── globals.css          # Complete brand + component system
│   └── utils/
│       └── format.ts            # UGX formatting, CSV export, calculations
├── vercel.json                  # Vercel deployment config
├── next.config.js               # Next.js config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

---

## Pages / sections

| Section | Description |
|---------|-------------|
| **Home** | Dashboard: hero stats, quick actions, bar chart, alerts, recent transactions |
| **Costs** | Log expenses, attach to batch/transaction, view all expenses |
| **Sales** | Record Kampala or border sales, view all with CSV export |
| **Statements** | P&L (IAS 1), Balance Sheet (IAS 1), Cash Flow (IAS 7) |
| **Reports** | Download all reports, KPI progress bars |
| **URA Filing** | VAT Form 1, CIT computation, tax calendar, filing actions |
| **Farmers** | Farmer registry with grade A yield and reliability scores |
| **Stock** | Batch tracker with per-batch margin calculation |
| **Settings** | Business profile, notifications, security toggles |

---

## Financial standards implemented

- **IAS 1** — Presentation of Financial Statements (P&L + Balance Sheet)
- **IAS 7** — Statement of Cash Flows (indirect method)
- **Uganda Income Tax Act Cap 340** — CIT @ 30%
- **Uganda VAT Act Cap 349** — VAT Form 1, quarterly filing
- **IFRS** — Full suite compliance watermarks

---

## Brand

- **Primary colour:** Banana yellow `#E8B84B`
- **Deep green:** Mountain green `#1C3A28`
- **Display font:** Playfair Display (serif) — Qatar Airways style elegance
- **Body font:** DM Sans — clean, modern, legible at 11px on mobile
- **Mono font:** DM Mono — financial figures and references

---

## Adding a database (production)

Replace the static arrays in `src/data/store.ts` with API calls to your PostgreSQL database. Recommended stack:

```
PostgreSQL → Prisma ORM → Next.js API routes → React frontend
```

Environment variables for production:
```env
DATABASE_URL=postgresql://user:pass@host/banello
NEXTAUTH_SECRET=your-secret
PESAPAL_API_KEY=your-key
AFRICAS_TALKING_KEY=your-key
```

---

*Banello Fresh Produce Ltd · From the slopes of Elgon. To your table.*
