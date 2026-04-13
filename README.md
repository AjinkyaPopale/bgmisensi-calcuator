# BGMI Sensitivity Calculator v6.1 — PMGC Elite
### by Ajinkya2OP · Full-Stack Production Build

> **New to this?** Read `SETUP.md` first — it walks through every step in Hindi-friendly English.

---

## 🏗️ Architecture

```
Browser (Netlify CDN — static, free)
  ├── index.html  +  src/css/main.css
  └── src/js/  (ES6 modules, no build step)
       ├── engine/     ← Pure sensitivity math (zero DOM)
       ├── ui/         ← DOM components
       └── payment/    ← Razorpay + unlock state

Netlify Functions (serverless Node.js, free tier = 125K calls/month)
  ├── create-order.js    ← Creates Razorpay order server-side (locks amount)
  ├── verify-payment.js  ← Verifies HMAC signature → writes to DB → issues token
  ├── check-status.js    ← Email lookup → re-issues token (restore on new device)
  └── razorpay-webhook.js← Async capture fallback (handles closed-browser edge case)

Supabase (PostgreSQL — free tier = 500MB, plenty for years)
  └── unlocks table  ← email · tier · payment_id · created_at
```

---

## 📁 Complete File Map

```
bgmi-calc/
├── index.html                  535 lines  HTML shell — no inline scripts
├── netlify.toml                           Deploy + headers + functions config
├── package.json                           razorpay + @supabase/supabase-js
├── .env.example                           Copy → .env for local dev
├── .gitignore                             Prevents .env commit
│
├── SETUP.md                    ★ Read this to deploy in 30 min
├── README.md                              This file
│
├── netlify/functions/
│   ├── create-order.js         Server-side Razorpay order (tamper-proof amount)
│   ├── verify-payment.js       HMAC verify → Supabase insert → signed token
│   ├── check-status.js         Email lookup → restore access on new device
│   └── razorpay-webhook.js     Async fallback for closed-browser payments
│
├── supabase/
│   └── schema.sql              Run once in Supabase SQL editor
│
└── src/
    ├── css/
    │   └── main.css            650+ lines — all styles, zero frameworks
    └── js/
        ├── config.js           Single source of truth (keys, API paths)
        ├── main.js             Boot + state + orchestration
        │
        ├── engine/             ← Pure functions, zero side effects
        │   ├── bases.js        GOLDEN_BASE + PMGC_ELITE_BASE (separate models)
        │   ├── scales.js       L2–L9 (original) + L12 ADV_ tables
        │   ├── build.js        buildSensitivity() L1→L12
        │   └── format.js       Text output formatter
        │
        ├── ui/
        │   ├── toast.js        showToast(msg, type, duration)
        │   ├── form.js         Form read/validate/wire + mode toggle
        │   ├── modal.js        Pro modal + email input + restore flow
        │   ├── result.js       Render output + PMGC blur + post-generate reveal
        │   ├── share.js        Screenshot · Download PNG · Share (Web Share + WhatsApp)
        │   └── voice.js        Web Speech API voice guide
        │
        └── payment/
            ├── security.js     XOR obfuscation + browser fingerprint tokens
            ├── unlock.js       Tier state — read/write/restore
            └── razorpay.js     Full payment flow: order → checkout → verify
```

---

## 🧠 Sensitivity Engine Layers

| Layer | Name | Tier |
|-------|------|------|
| L1  | Base model (GOLDEN or PMGC_ELITE) | All |
| L2  | FPS scale | All |
| L3  | Device category | All |
| L4  | Horizontal acceleration | All |
| L5  | Playstyle trim | All |
| L6  | Finger scale | All |
| L7  | Scope extras | All |
| L8  | Headshot base | All |
| L8+ | Headshot PRO+ | Pro / PMGC |
| L9  | Competitive engine preset | Pro / PMGC |
| L10 | Fine-tune sliders ±5% | Pro / PMGC |
| L11 | Gyro kill switch | All |
| **L12** | **Advanced device + FPS + playstyle + finger optimisation** | **Pro / PMGC** |

---

## 💰 Tier Features

| Feature | Free | Pro ₹99 | PMGC ₹199 |
|---------|------|---------|-----------|
| Full sensitivity output | ✅ | ✅ | ✅ |
| Headshot Magnet | ✅ | ✅ | ✅ |
| Screenshot / Download / Share | ✅ | ✅ | ✅ |
| Voice Guide | ✅ | ✅ | ✅ |
| Tips card | ✅ | ✅ | ✅ |
| 6 competitive presets | ❌ | ✅ | ✅ |
| L12 advanced tuning | ❌ | ✅ | ✅ |
| Headshot PRO+ | ❌ | ✅ | ✅ |
| ±5% fine-tune sliders | ❌ | ✅ | ✅ |
| PMGC Elite base model | ❌ | ❌ | ✅ |
| PMGC mode toggle | ❌ | ❌ | ✅ |
| Tournament output header | ❌ | ❌ | ✅ |

---

## 🔐 Security Model

### Payment Security (Server-side)
```
User browser             Netlify Function          Razorpay API
─────────────            ─────────────────         ────────────
POST /create-order  →    razorpay.orders.create()
                    ←    { order_id, amount }       (amount LOCKED)
Open Razorpay UI
User pays
                    →    POST /verify-payment
                         HMAC verify ✅
                         Supabase insert ✅
                    ←    { ok: true, token }
Store token locally
```

Without server-side order creation, a user could change `amount: 9900` to `amount: 1` in browser DevTools before opening Razorpay. The server locks it.

### Token Security (Client-side)
- **Free / Demo:** `v1_demo_{timestamp}` — XOR encoded with browser fingerprint seed
- **Local paid:** `v1_paid_{razorpay_payment_id}` — same XOR encoding  
- **Server verified:** `v2_srv_{hmac_hex}` — signed with `RAZORPAY_KEY_SECRET`, unforgeable
- Tampering with stored token → invalid checksum → rejected on next read

### Webhook (Async Fallback)
If a user pays and closes their browser before `verify-payment` completes:
- Razorpay fires `payment.captured` webhook to `razorpay-webhook.js`
- Function saves record to Supabase
- On next visit, user enters email → `check-status.js` finds their record → access restored

---

## ⚙️ One-Time Setup

**Step 1 — Supabase**
1. `supabase.com` → New project (Southeast Asia region)
2. SQL Editor → paste `supabase/schema.sql` → Run

**Step 2 — Get keys**
- Razorpay: Dashboard → Settings → API Keys → copy Key ID + Key Secret
- Supabase: Settings → API → copy Project URL + service_role key

**Step 3 — Set Netlify env vars**
```
RAZORPAY_KEY_ID       = rzp_test_XXXXXXXX
RAZORPAY_KEY_SECRET   = XXXXXXXXXXXXXXXX
SUPABASE_URL          = https://xxx.supabase.co
SUPABASE_SERVICE_KEY  = eyJ...
```

**Step 4 — Update frontend key**
`src/js/config.js` → `keyId: 'rzp_test_XXXXXXXX'`

**Step 5 — Deploy**
Drag folder onto `app.netlify.com/drop`

**Step 6 — Test**
Card: `4111 1111 1111 1111` | OTP: `1234`

---

## 🏃 Local Development

```bash
npm install
npm install -g netlify-cli
cp .env.example .env
# Fill in .env with your keys
netlify dev
# → http://localhost:8888
```

---

## 📈 Revenue Tracking

Supabase → SQL Editor:
```sql
-- Summary
SELECT * FROM revenue_summary;

-- All payments (latest first)
SELECT email, tier, payment_id, created_at
FROM unlocks
ORDER BY created_at DESC;

-- This month
SELECT tier, COUNT(*) as payments
FROM unlocks
WHERE created_at > date_trunc('month', now())
GROUP BY tier;
```

---

## 🔮 Scaling Checklist

- [ ] KYC complete on Razorpay → switch to live keys
- [ ] Add Razorpay webhook in Dashboard (prevents lost payments)
- [ ] Custom domain on Netlify
- [ ] Gun-wise sensitivity: add `GUN_PROFILES` table in `scales.js`
- [ ] User accounts: replace localStorage tokens with Supabase Auth
- [ ] AI auto-adjust: add `/api/adjust` function that reads match stats → returns fine-tune deltas
- [ ] Email receipts: add `nodemailer` or Resend to `verify-payment.js`
- [ ] Admin dashboard: build a simple Supabase-backed page to view payments

---

## 📝 License
Personal project by Ajinkya2OP. All sensitivity values are original research.
