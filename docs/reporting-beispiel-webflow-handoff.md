# Reporting-Beispiel Landing Page Handoff (Webflow Blueprint)

## Goal
One focused lead-magnet page for outreach with two visual states:
- `gated`: new lead submits email to unlock PDF
- `known-unlocked`: known lead arrives via tokenized link and downloads immediately

## Section Order
1. Logo-only header (no nav links, only privacy utility link)
2. Hero split layout
3. "Was ist drin?" module section
4. Credibility section
5. FAQ section
6. Minimal legal footer

## Copy Blocks
### Hero
- Kicker: `Lead Magnet fuer Shopify DTC Gruender`
- Headline: `So sieht ein performantes Direct-Mail-Reporting in der Praxis aus`
- Subtitle: outcome-focused one-paragraph promise
- 3 bullet outcomes (incrementality clarity, next-30-day priorities, stakeholder reporting confidence)
- Metadata line: `PDF, 12 Seiten, 8 Minuten Lesezeit`
- Primary CTA text (constant): `PDF herunterladen`

### Capture card (`gated`)
- Title: `PDF sofort freischalten`
- Description: short value reminder
- Fields:
  - Required: email
  - Optional: marketing consent checkbox
- Privacy microcopy with link to Datenschutz
- Metadata line under CTA
- Trust line: `Kein Spam. Jederzeit abbestellbar.`

### Capture card (`submitted`)
- Title: `Dein PDF ist bereit`
- Immediate download CTA: `PDF herunterladen`
- Secondary CTA: `15-min Reporting-Review buchen`
- Fallback copy: check inbox if download does not start

### Capture card (`known-unlocked`)
- Greeting: `Willkommen zurueck, <FirstName>`
- Description: personal access already active
- Immediate download CTA: `PDF herunterladen`
- Secondary CTA: `15-min Reporting-Review buchen`

### "Was ist drin?"
- 6 module cards describing report content
- One before/after insight panel

### Credibility
- 4 proof chips: `Shopify`, `Klaviyo`, `DTC Ops`, `Performance Marketing`
- 1 short anonymized testimonial quote

### FAQ
- Target audience
- PDF length
- Data handling

## Spacing and Visual System
- Max width: `~1152px` container
- Major section padding: `28-40px`
- Card radius: `20-24px`
- Base spacing rhythm: `8px` steps
- Background:
  - soft radial accents (green + orange)
  - white translucent cards over neutral base
- Typography:
  - Headings: `Outfit Variable`
  - Body: `Roboto`

## Mobile Behavior
- Hero collapses to single column
- Capture card appears directly after hero copy
- Primary CTA remains visible without requiring long scroll
- FAQ renders as one-column stack
- Buttons remain full width for thumb reach

## States and Query Parameters
- `/reporting-beispiel` -> `gated`
- `/reporting-beispiel?state=submitted` -> `submitted`
- `/reporting-beispiel?state=known&token=<token>` -> `known-unlocked` if token valid
- Invalid known token falls back to `gated` + warning message

## Analytics Events
- `lead_magnet_view`
- `lead_magnet_form_submit`
- `lead_magnet_download_click`
- `lead_magnet_known_unlock_view`
- `lead_magnet_secondary_cta_click`

## Data Contract (Prototype)
```ts
type LeadCapturePayload = {
  email: string
  first_name?: string
  consent_marketing?: boolean
  lead_source: "outreach"
  asset_id: "reporting-example-pdf-v1"
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  ts_submitted: string
}
```
