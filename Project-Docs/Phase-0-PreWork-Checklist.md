# Phase 0 Pre-Work Checklist (for Alex)

**Purpose:** Everything Alex needs to set up before Claude starts building Phase 0.
**Estimated time:** 60-90 minutes of active work, plus DNS propagation wait (minutes to a few hours).
**Order matters:** Steps 1-3 should be done first because DNS propagation is the longest wait. Steps 4-7 can happen any time after Step 1.

---

## What you'll need open

- Your password manager
- Access to your GoDaddy account (for `bohdiai.com`)
- Your Gmail account (for verifications and email routing)
- A note-taking app to capture credentials and URLs as you go (do NOT send any of these to Claude in plaintext — see "Sharing with Claude" at the bottom)

---

## Step 1: Cloudflare account + add `bohdiai.com`

- [ ] Go to https://dash.cloudflare.com/sign-up
- [ ] Sign up with your Gmail address. Use a strong password and turn on 2FA right away (Authy or Google Authenticator).
- [ ] After signup, click **"Add a domain"** on the dashboard
- [ ] Enter `bohdiai.com` and click Continue
- [ ] Pick the **Free** plan (it's all you need)
- [ ] Cloudflare will scan your existing DNS at GoDaddy and show you what it found. Click Continue.
- [ ] **Cloudflare will give you two nameservers** (something like `arya.ns.cloudflare.com` and `bob.ns.cloudflare.com`). **Copy both — you need them in Step 2.**

---

## Step 2: GoDaddy — swap nameservers to Cloudflare

- [ ] Log into https://account.godaddy.com/products
- [ ] Find `bohdiai.com` in your domain list, click it
- [ ] Look for **"Nameservers"** section, click **"Change"** or **"Manage DNS"**
- [ ] Choose **"I'll use my own nameservers"** (or similar wording)
- [ ] Delete GoDaddy's default nameservers and **paste the two from Cloudflare**
- [ ] Save
- [ ] **GoDaddy will warn you this can take up to 48 hours.** In practice it's usually under an hour. Cloudflare will email you when it's active.
- [ ] **Do not do anything else with bohdiai.com DNS at GoDaddy after this.** All DNS lives in Cloudflare from now on.

---

## Step 3: Cloudflare Email Routing (free) — forward `alex@bohdiai.com` to Gmail

You can do this immediately — it doesn't need to wait for nameserver propagation.

- [ ] In Cloudflare, select `bohdiai.com` from your domain list
- [ ] Click **Email** → **Email Routing** in the left sidebar
- [ ] Click **"Get started"**
- [ ] Cloudflare may auto-add MX records. Approve them.
- [ ] Under **"Custom addresses,"** click **"Create address"**
  - Custom address: `alex`
  - Destination address: your Gmail address
- [ ] Cloudflare sends a verification email to your Gmail — click the link to verify
- [ ] You should now see `alex@bohdiai.com → your.gmail@gmail.com` as an active rule
- [ ] **Test it:** send an email from a different address to `alex@bohdiai.com`. It should appear in Gmail within seconds.

(Once nameservers propagate from Step 2, this works for real. Until then, you may see "pending verification.")

---

## Step 4: Resend account + verify `bohdiai.com`

- [ ] Go to https://resend.com/signup
- [ ] Sign up with your Gmail
- [ ] Turn on 2FA
- [ ] Click **Domains** in the sidebar → **Add Domain**
- [ ] Enter `bohdiai.com`, region US (or EU if you prefer — pick one)
- [ ] Resend will show you **3 DNS records** to add (TXT for SPF, TXT for DKIM, optionally a TXT for DMARC)
- [ ] **Add those 3 records to Cloudflare:**
  - Back in Cloudflare → `bohdiai.com` → **DNS** → **Records**
  - For each Resend record, click **Add record**, paste the type/name/content exactly as Resend shows it
  - For DKIM record, when Cloudflare asks about "Proxy status," set to **DNS only** (gray cloud, not orange)
- [ ] Back in Resend, click **Verify**. May take a few minutes.
- [ ] Once verified, go to **API Keys**, click **Create API Key**, name it `bohdi-ai-production`, copy the key somewhere safe (you'll share it with Claude securely later — see bottom)

---

## Step 5: Supabase — new org + new project

- [ ] Log into Supabase with the login you've decided to use for BohdiAI
- [ ] In the top-left org switcher, click **"New organization"**
  - Name: `Bohdi Software` (or your preference)
  - Plan: Free
- [ ] In the new org, click **"New project"**
  - Name: `bohdi-ai`
  - Database password: generate a strong one and save it
  - Region: closest to you (e.g., US East)
  - Plan: Free
- [ ] Project takes ~2 minutes to provision
- [ ] Once ready, go to **Project Settings** → **API**
- [ ] Capture two things to share with Claude later:
  - **Project URL** (looks like `https://xxxxx.supabase.co`)
  - **service_role key** (NOT the anon key — the service_role is the one Claude needs for server-side writes). Treat this like a password.

---

## Step 6: Vercel — account + GitHub connection

- [ ] Go to https://vercel.com/signup
- [ ] Sign up with **GitHub** (this is the easiest — Vercel uses GitHub for auth and repo access)
- [ ] Approve Vercel's GitHub app permissions
- [ ] No project yet — Claude will create it when scaffolding

---

## Step 7: GitHub — new org + empty repo

- [ ] Log into https://github.com
- [ ] Top-right avatar → **Your organizations** → **New organization**
  - Plan: Free
  - Name: `bohdi-software` (or your preference — must be unique on GitHub)
  - Contact email: `alex@bohdiai.com` (or your Gmail until that's working)
- [ ] Once the org exists, create a new repo inside it:
  - Repository name: `bohdi-ai`
  - Visibility: **Private** (we can flip to public later if you want)
  - Do NOT initialize with README, .gitignore, or license (Claude will set those up correctly when scaffolding)
- [ ] In the org settings → **Third-party access**, make sure Vercel and any future tools you connect are approved

---

## Step 8: Sentry + PostHog accounts (low priority — can wait until build day)

These are quick. You can do them now or wait until Claude is ready to wire them in.

- [ ] Sentry: https://sentry.io/signup/ — pick **Next.js** as the platform when prompted. Skip the project setup wizard or follow it; Claude will reconfigure. Capture the DSN.
- [ ] PostHog: https://posthog.com/signup — create a project called `bohdi-ai`. Capture the Project API key and host URL.

---

## What you'll have at the end

A short list of credentials/IDs to share securely with Claude:

| Item | Source | Treat as |
|---|---|---|
| Supabase project URL | Step 5 | Semi-public |
| Supabase service_role key | Step 5 | **Secret — password-grade** |
| Resend API key | Step 4 | **Secret — password-grade** |
| Sentry DSN | Step 8 | Semi-public |
| PostHog project API key | Step 8 | Semi-public (client-side) |
| PostHog host URL | Step 8 | Public |

---

## Sharing with Claude

**Do NOT paste secrets directly into the chat.** Use one of these:

1. **Best:** put the secrets directly into Vercel's environment variables yourself (Vercel project → Settings → Environment Variables). Tell Claude the variable names you used. Claude never sees the values, but the deployed app uses them.
2. **Alternative:** use a temporary secure note (1Password, Bitwarden) and paste the link with an expiration. Tell Claude when to fetch.

Semi-public values (URLs, DSNs, PostHog keys) are fine to paste in chat.

---

## Status check

Tell Claude when each step is done. Claude will not start scaffolding the app until at least:
- Step 1, 2, 3 are done (DNS + email routing)
- Step 4 is done (Resend verified) OR Resend setup can run in parallel with scaffolding
- Step 5 is done (Supabase project exists)
- Step 7 is done (GitHub repo exists)

Step 6 and Step 8 can be done at any point before deploy.
