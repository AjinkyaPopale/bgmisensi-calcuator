# BGMI Sensitivity Calculator — Setup Guide (Cloudflare + Cashfree)
### Bhai, yeh padh le — 30 min mein sab set ho jayega 🔥

---

## 📋 Architecture

```
User Browser
     │
     ▼
Cloudflare Pages (Free)
├── index.html + CSS + JS   ← Static files
└── /functions/api/         ← Serverless backend (Pages Functions)
         │
         ├── create-order.js    → Cashfree API → creates Order ID
         ├── verify-payment.js  → Verifies payment → saves to DB
         ├── check-status.js    → Email lookup → restore access
         └── cashfree-webhook.js → Cashfree webhook handler
                  │
                  ▼
           Supabase (Free)
           PostgreSQL DB
           (stores email + tier + payment_id)
```

---

## STEP 1 — Supabase Setup (Database)

### 1.1 Account Banao
1. Jao → [supabase.com](https://supabase.com)
2. "New Project" → Name: `bgmi-calc` → Region: `Southeast Asia (Singapore)`
3. Database password save karo

### 1.2 Table Banao
1. Left sidebar → **SQL Editor** → "New query"
2. `supabase/schema.sql` file ka sara content copy-paste karo
3. **Run** karo → "Success" dikhega ✅

### 1.3 API Keys Lo
1. Left sidebar → **Settings** → **API**
2. Copy karo:
   - `Project URL` → yahi hai `SUPABASE_URL`
   - `service_role` key (**service_role**, anon nahi!) → yahi hai `SUPABASE_SERVICE_KEY`

---

## STEP 2 — Cashfree Setup

### 2.1 Account Banao
1. Jao → [merchant.cashfree.com](https://merchant.cashfree.com)
2. Sign up → Business details bharo
3. Dashboard → **Developers** → **API Keys**

### 2.2 Keys Lo
**Sandbox (testing ke liye):**
- App ID:    `TEST_xxxxxxxx`
- Secret Key: `TEST_xxxxxxxxxxxxxxxx`

**Production (real payments):**
- KYC complete karo (PAN + Aadhar + Bank)
- App ID:    `CF_xxxxxxxx`
- Secret Key: `CFxxxxxxxxxxxxxxxx`

### 2.3 Webhook Setup (Recommended)
1. Cashfree Dashboard → **Developers** → **Webhooks**
2. Add webhook URL: `https://bgmi-calculator.pages.dev/api/cashfree-webhook`
3. Events: ✅ `PAYMENT_SUCCESS_WEBHOOK`
4. Save karo

---

## STEP 3 — Cloudflare Pages Deploy

### 3.1 Drag & Drop Deploy (Easiest)
1. Jao → [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Pages** → **Create a project** → **Direct Upload**
3. Project name: `bgmi-calculator`
4. **Zip file ke andar ka `bgmi-fixed` folder** upload karo
5. Deploy karo → 30 seconds mein live ✅

### 3.2 Environment Variables Set Karo (CRITICAL — bina iske payment nahi chalega)
Cloudflare Pages → Your Project → **Settings** → **Environment Variables** → **Add variable**

| Variable Name | Value | Notes |
|---|---|---|
| `CASHFREE_APP_ID` | `TEST_xxxxxxxx` | Sandbox ke liye TEST_, production ke liye CF_ |
| `CASHFREE_SECRET_KEY` | `TEST_xxxxx...` | Cashfree dashboard se |
| `CASHFREE_ENV` | `sandbox` | Testing ke liye `sandbox`, live ke liye `production` |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase dashboard se |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | service_role key (anon nahi!) |

⚠️ **Variables save karne ke baad → Redeploy trigger karo** (Deployments → Retry deployment)

### 3.3 Functions Verify Karo
Cloudflare Pages → Your Project → **Functions** tab mein yeh dikhne chahiye:
- `api/create-order`
- `api/verify-payment`
- `api/check-status`
- `api/cashfree-webhook`

---

## STEP 4 — Test Karo (Sandbox)

### Cashfree Test Card:
```
Card Number:  4111 1111 1111 1111
Expiry:       Any future date (e.g. 12/26)
CVV:          123
OTP:          123456
```

### Test Flow:
1. Site kholo → Form bharo → Generate karo
2. "Unlock Pro ₹99" dabao
3. Email daalo (apna real email)
4. "Pay ₹99 – Unlock Pro" dabao
5. Cashfree test card se pay karo
6. ✅ Pro unlock hona chahiye

### DB Check:
Supabase → **Table Editor** → `unlocks` → record dikhna chahiye

---

## STEP 5 — Production (Real Payments)

1. Cashfree dashboard → KYC complete karo
2. Production App ID + Secret Key lo
3. Cloudflare env vars update karo:
   - `CASHFREE_APP_ID` → production App ID
   - `CASHFREE_SECRET_KEY` → production secret
   - `CASHFREE_ENV` → `production`
4. Redeploy karo

---

## ❓ Common Issues

**"Payment SDK not loaded"**
→ `https://sdk.cashfree.com/js/v3/cashfree.js` load nahi hua. Internet check karo.
→ Hard refresh karo (Ctrl+Shift+R) to clear cache.

**"Order creation failed"**
→ `CASHFREE_APP_ID` aur `CASHFREE_SECRET_KEY` check karo Cloudflare env vars mein
→ `CASHFREE_ENV` = `sandbox` for testing, `production` for live

**"Payment gateway not configured"**
→ Environment variables set nahi hain. Step 3.2 dobara karo.
→ Variables set karne ke baad **redeploy** karna zaroori hai!

**"DB error" / restore nahi ho raha**
→ `SUPABASE_URL` aur `SUPABASE_SERVICE_KEY` check karo
→ `supabase/schema.sql` run kiya tha? Table exist karti hai?

**Functions 404 aa rahi hain**
→ Cloudflare Pages Functions sirf Pages projects mein kaam karti hain
→ `functions/api/` folder root mein hona chahiye (zip ke andar check karo)

**Changes deploy ke baad bhi nahi dikh rahe**
→ Ctrl+Shift+R (hard refresh) karo — old JS cache clear hogi
→ Ab JS sirf 5 min cache hoti hai, 1 year nahi

---

## 💰 Revenue Track Karo

Supabase → **SQL Editor**:
```sql
SELECT * FROM revenue_summary;
```

---

## 🔒 Security

| Attack | Protection |
|--------|------------|
| Browser mein amount change | Server-side order creation amount lock karta hai |
| localStorage token edit | XOR + checksum — tampered tokens reject ho jaate hain |
| Fake payment success | Server Cashfree API se verify karta hai |
| Same payment twice | `payment_id UNIQUE` constraint in DB |
