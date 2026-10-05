# Pay China integration

The user supplied `https://app.usezolan.com` as the live Zolan app destination. The CTA opens this app; it never says a payment has started or claims the supplier details have been prefilled. There is no payment implementation in this calculator repository.

For the Vercel host, set `NEXT_PUBLIC_PAY_CHINA_URL` and redeploy. For the standalone calculator, set `VITE_PAY_CHINA_URL` to the **verified real payment entry URL** before rebuilding. When blank, the CTA defaults to the user-supplied `https://app.usezolan.com`. Use a verified payment-specific URL if the app team supplies one. The URL must use HTTPS (same-origin HTTP is accepted for local development). No supplier information is attached to query parameters or sent to an external site automatically.

For a connected flow hosted by this application, the calculator dispatches a cancelable `zolan:pay-china` CustomEvent on its same-origin parent window when the user clicks the CTA. Its detail contains `version: 1`, `destination` and `context`:

- `amount`: total supplier invoice in `currency` (CNY, USD or NGN)
- `converted`: estimated naira equivalent before separate payment fees
- `payment`: total naira supplier payment including enabled separate fees
- `product`, `quantity`, `exchangeRate`
- optional `calculationId`, when supplied by a future authenticated integration

Amounts and quantities are decimal strings. Full-naira-total mode uses NGN and rate 1; it cannot reconstruct a foreign invoice. Advanced mode uses the actual supplier rate. Shipping notes, email and contact details are excluded. Context is held in memory, never placed in localStorage or a URL by this handoff.

The real parent application may listen for the event, call `preventDefault()` synchronously, and transfer the context to its authenticated payment state or a server-backed short-lived draft. That payment flow must validate all values again and obtain a fresh provider quote. Without an event listener, the CTA opens the configured URL only; context cannot safely cross domains without an agreed server/API integration.

Local save IDs currently identify browser-only records; no server calculation ID is fabricated. Add one only when a genuine payment integration provides it. Setting a URL connects navigation, but does not claim prefill or initiate a payment.
