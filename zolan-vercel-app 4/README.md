# Zolan — Vercel edition

Standard Next.js, not Cloudflare/Vinext. Includes the existing landing page, public calculator, optional email links, guide and Excel download.

## Launch on Vercel

1. Extract `zolan-vercel-app.zip` into a fresh folder. Create a new empty GitHub repository to avoid mixing old Cloudflare files with this version.
2. Upload the extracted contents. `package.json`, `vercel.json`, `app`, `lib`, `public` and `scripts` must be at the repository root. Do not upload the ZIP itself or `node_modules`.
3. Import that repository into Vercel. Choose **Next.js** and leave Root Directory empty. Remove old custom Build / Install / Output overrides or use `pnpm run build`, `pnpm install --frozen-lockfile`, and `.next`.
4. Deploy. The public calculator works without a database or email account. Root `/` and `/tools/china-import-profit-calculator` both open the calculator immediately.
5. For optional email capture, connect a **Neon PostgreSQL** database through Vercel Storage/Marketplace and ensure its connection string is named `DATABASE_URL` in the project environment variables. Redeploy. Tables are created automatically on the first database-backed request using the app's database role.
6. For recovery emails, add `EMAIL_API_KEY` (Resend API key) and `EMAIL_FROM` (an address on your verified Resend sending domain). Optionally set `APP_URL` to your final HTTPS site origin, and `ACCESS_DAYS` (default 30, maximum 365). Redeploy after changing environment variables. These are server-only values: never prefix them with `NEXT_PUBLIC_` or upload secrets to GitHub.
7. Visit `/welcome` for the original landing page with optional email capture. Submit a test email; confirm the receipt and recovery link on your deployed domain. Email delivery needs both the provider key and a verified sender. Existing Cloudflare D1 records are not migrated automatically.

A database is required only for optional email capture, consent, tokens and analytics. Calculation inputs stay in the browser; shared summaries omit product names and private notes. Email signup is not required to see results.

## Local use

Install Node 22.13 or newer within Node 22 (the package pins `22.x`) and pnpm 10.32.1. Run `pnpm install --frozen-lockfile`, `pnpm run dev`. For optional email features copy `.env.example` to `.env.local` and supply values. `pnpm run db:setup` can explicitly initialize the database; ordinary API requests do the same automatically. `pnpm run build` creates the production build; `pnpm start` serves it.

## Validation

Next.js production build, public-route HTTP checks and route tests pass. Access-route tests use simulated Neon responses to verify parameterized SQL, hashed tokens, cookie security, origin checks, expiry, rate limits, oversized inputs and database failure. The shared calculator has 23 passing calculation/UI tests. Gross ROI is gross profit divided by economic inventory cost; gross profit excludes selling expenses. Cash cost per ordered unit is distinct from cost per sellable item when damaged stock or recoverable tax applies.

The deployed database, email delivery and Vercel deployment require your account setup and have not been verified. Assets are precompiled from the shared calculator source; rerun its `scripts/build-access.mjs` against this directory to sync future changes.

## Import planning update

The calculator provides live landed cost per sellable item, profit after entered selling expenses, gross margin separately, cash recovery and a supplier-price negotiation ceiling. Unknown costs remain excluded and provisional. Quick/detailed paths retain all inputs. Price goals, supplier/FX/freight/selling-expense scenarios and partial-sales comparisons reuse the existing engine. Unsold stock remains inventory; damage changes usable stock.

Share links contain a read-only snapshot in the URL fragment (not sent to the server). Product name and summary amounts are shared explicitly; quote notes and detailed inputs are excluded. Anyone with the link can read it. Browser saves retain input models and add dates without discarding older records. Emailing a plan is optional and requires DATABASE_URL, EMAIL_API_KEY and EMAIL_FROM; no cloud save is claimed. Printing offers PDF through the browser.

Anonymous funnel events use a random in-memory session identifier, never names, contact details, quote notes or share links. Only the first completed estimate per page view sends aggregate amounts rounded to the nearest NGN1,000 and quantity to the nearest 10. These produce approximate averages, not exact business figures. Do not interpret example-loaded sessions as customer plans. Events are stored only when DATABASE_URL is configured.

For completion/result/Zolan rates, count distinct attribution JSON `session` per event and divide by calculator_viewed sessions for the same date range. Section drop-off compares distinct section_viewed sessions for step-1/2/3 with result_viewed. Approximate averages use calculation_completed attribution `cash`, `supplier`, `landed` and `quantity`; exclude sessions with example_loaded. This table is server-only and has no public analytics endpoint. Configure retention appropriate to your business.
