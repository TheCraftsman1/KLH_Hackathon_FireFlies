# Insurix.India — Project Status & Implementation Plan

## Hackathon: KLH Hackathon | Problem Statement #7
**"Insurance Auto-Renewal Negotiation Agent"**

---

## WHAT EXISTS (Current State)

### Core Infrastructure
| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Express Server | `server.js` | 928 | ✅ Fully functional |
| Homepage | `index.html` | 959 | ✅ Policybazaar-level UI |
| Global Styles | `styles.css` | 2429 | ✅ Complete |
| Main JS | `script.js` | 508 | ✅ Functional |
| Voice Assistant Page | `voice-assistant.html` | 130 | ✅ Functional |
| Voice Assistant Logic | `voice-assistant.js` | 1218 | ✅ Full STT/TTS |
| Voice Assistant Styles | `voice-assistant.css` | — | ✅ Complete |
| Chatbot (Telugu/English) | `chatbot.js` | 377 | ✅ Pattern-matching KB |
| Vehicle API Client | `vehicle-api.js` | 214 | ✅ Wraps all endpoints |
| Package Config | `package.json` | — | ✅ Dependencies set |
| Environment Variables | `.env` | — | ✅ API keys secured |

### Server Capabilities (`server.js`)
- **IRDAI TP Rates** — Real FY 2025-26 third-party premiums for 2W and 4W
- **IDV Depreciation Table** — IRDAI-compliant depreciation (0–50%)
- **RTO Database** — 30+ states, 400+ zones with city names
- **Vehicle Database** — 10 brands, 100+ models with CC, prices, segments
- **Demo Vehicles** — 15 hardcoded vehicles (TS, AP, KA, MH, TN, DL, RJ, KL, GJ, WB, UP)
- **`lookupVehicle()`** — Registration number → full vehicle data + IDV + premium
- **`generateQuotes()`** — 6 insurers with realistic pricing, NCB, add-ons
- **`hashCode()`** — Deterministic vehicle assignment
- **AI Chat** — OpenRouter (Gemini 2.0 Flash) with insurance system prompt
- **Azure TTS/STT** — Neural voice synthesis + speech recognition

### API Endpoints (12 + 3 Intelligence = 15 total)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/vehicle/:regNumber` | Vehicle lookup |
| GET | `/api/vehicle/:regNumber/quotes` | Insurance quotes |
| POST | `/api/chat` | AI chat (OpenRouter) |
| POST | `/api/tts` | Text-to-Speech (Azure) |
| POST | `/api/stt` | Speech-to-Text (Azure) |
| GET | `/api/brands` | List vehicle brands |
| GET | `/api/brands/:brand/models` | Models for a brand |
| GET | `/api/rto/:code` | RTO info lookup |
| GET | `/` | Serve homepage |
| POST | `/api/predict-claim` | 🛡️ Loot-Shield: Claim Friction Score |
| POST | `/api/vulnerability-assessment` | 🔍 Gap Analysis: Vulnerability Score |
| POST | `/api/tco-simulator` | 📊 TCO: 5-Year Cost Simulator |

### Product Pages (14 static HTML pages)
- `car-insurance.html`, `two-wheeler-insurance.html`, `health-insurance.html`
- `family-health-insurance.html`, `employee-group-health.html`
- `term-life-insurance.html`, `term-insurance-women.html`
- `investment-plans.html`, `guaranteed-return-plans.html`
- `child-savings-plans.html`, `retirement-plans.html`
- `return-of-premium.html`, `home-insurance.html`, `travel-insurance.html`

### Assets (19 files)
- 12 insurer logos (HDFC Ergo, ICICI Lombard, Bajaj Allianz, etc.)
- 6 payment icons (Google Pay, PhonePe, Paytm, etc.)
- 1 misc image

### Dependencies
```
express ^4.18.2, cors ^2.8.5, axios ^1.6.0, cheerio ^1.0.0-rc.12, dotenv ^17.3.1
```

### External APIs
- **OpenRouter** — Gemini 2.0 Flash (fallback: Lite, Llama) for AI chat
- **Azure Cognitive Services** — Neural TTS (eastasia region) + STT

---

## WHAT NEEDS TO BE BUILT (Implementation Plan)

### 🔴 Phase 1: Auto-Renewal Negotiation Agent (CORE — Hackathon Deliverable)
**Priority: CRITICAL | Estimated: 3-4 hours**

#### 1.1 Negotiation Engine (Backend)
**File: `server.js` (new endpoints)**
- `POST /api/negotiate/start` — Initialize negotiation session with vehicle reg number
  - Looks up vehicle via `lookupVehicle()`
  - Gets quotes via `generateQuotes()`
  - Creates a negotiation session object with state tracking
  - Returns session ID + initial insurer offers
- `POST /api/negotiate/round` — Process a negotiation round
  - Accepts: session ID, user counter-offer or strategy choice
  - AI agent (via OpenRouter) acts as negotiator
  - Each insurer has min/max discount bounds, counter-offer logic
  - Returns: insurer responses, updated offers, savings so far
- `GET /api/negotiate/status/:sessionId` — Get negotiation state
- `POST /api/negotiate/accept` — Finalize and accept best offer
- `POST /api/negotiate/simulate` — Run full auto-negotiation simulation

**Insurer Agent Logic** (per insurer):
- Base premium from `generateQuotes()`
- Max discount cap (8-18% depending on insurer)
- NCB retention bonus, loyalty discount, bundling offers
- Counter-offer strategy: aggressive → moderate → final best
- Walk-away threshold

#### 1.2 Negotiation Dashboard (Frontend)
**New files: `negotiation.html`, `negotiation.js`, `negotiation.css`**

- **Vehicle Input Section** — Reg number input (reuse existing lookup)
- **Negotiation Arena** — Visual timeline showing rounds of negotiation
  - Left: User side with strategy controls
  - Right: Insurer cards showing live offers
  - Center: AI agent mediating with reasoning
- **Live Offer Comparison Table** — Side-by-side insurer offers updating in real-time
- **Savings Meter** — Animated gauge showing total savings vs original quote
- **Strategy Controls** — User can pick negotiation stance:
  - "Aggressive" (push for max discount)
  - "Balanced" (fair negotiation)
  - "Quick" (accept best available fast)
- **Final Summary** — Savings report, breakdown, acceptance CTA

#### 1.3 Navigation Integration
- Add "Negotiate" button/link to `index.html` header
- Add route from FAB button / voice assistant to negotiation page
- Link from quote results to negotiation flow

---

### � Phase 2: InsurGuard Intelligence Engine ✅ COMPLETED
**Priority: HIGH | Status: FULLY IMPLEMENTED**

#### 2.1 Predictive Claim Settlement Engine — "Loot-Shield" ✅
**Backend:** `POST /api/predict-claim`
- **SLA-indexed scoring** using 3 weighted variables:
  - $W_1$ (Insurer Specific): Age-wise rejection rate per insurer (IRDAI Public Disclosures)
  - $W_2$ (Category Risk): High-theft zones (IIB Motor Theft Index) + Non-medical expense overheads
  - $W_3$ (Policy Quality): Room rent caps, restoration benefits, zero-dep as hidden triggers
- Output: **Friction Score (0-100)** with cashless approval time estimate
- All 6 insurers ranked in comparison table
- Data: IRDAI FY 2024-25, IIB Motor Theft Index

#### 2.2 Holistic Vulnerability Score — "Gap Analysis" ✅
**Backend:** `POST /api/vulnerability-assessment`
- **Middle-Class Financial Fragility Index** methodology
- Inflation-adjusted cover: Checks if ₹5L policy covers bypass surgery in 2031 (12% medical inflation)
- Human Life Value (HLV) computation for life cover gap
- Liability exposure analysis (Motor Vehicles Act TP liability)
- Output: **Survival Runway** (months of crisis coverage) + Vulnerability Score (0-100)
- 6 medical procedure inflation projections (2026 → 2031)
- Priority-ranked recommendations (CRITICAL/HIGH/MEDIUM/LOW)

#### 2.3 Total Cost of Ownership (TCO) Simulator ✅
**Backend:** `POST /api/tco-simulator`
- **NCB Trap Detection**: Identifies when rising TP + loyalty penalty outpaces NCB savings
- IDV depreciation curve vs premium increase modeling
- Loyalty vs Switcher scenario comparison (5-year projection)
- Output: Interactive Chart.js graph + year-by-year breakdown table
- Savings calculation with switch-interval optimization

**Frontend:** `dashboard.html`, `dashboard.js`, `dashboard.css` ✅
- 3-tab card-based layout with animated SVG score gauges
- Interactive Chart.js 5-year projection graph (dual Y-axis)
- Weight bars, gap bars, factor breakdowns
- Comparison tables, inflation grid, recommendation cards
- Responsive design (mobile-first)

---

### 🟢 Phase 3: AI Differentiators
**Priority: MEDIUM | Estimated: 2 hours**

#### 3.1 Policy Clause Simplifier
- Feed policy T&C to OpenRouter → get plain-language summary
- Highlight: exclusions, waiting periods, co-pay, sub-limits
- Red/Yellow/Green flags for clause risk

#### 3.2 Commission Transparency
- Show estimated agent commission per insurer per plan
- Based on IRDAI published commission structures
- Display alongside premiums for informed comparison

#### 3.3 Renewal Forecast & Alerts
- Based on vehicle data, predict next renewal date
- Show expected premium change (↑/↓ with percentage)
- Mock notification/alert system for upcoming renewals

---

### 🔵 Phase 4: Demo Polish & Presentation
**Priority: MEDIUM | Estimated: 1-2 hours**

#### 4.1 Pre-built Demo Scenarios
- "Mr. Kumar's Activa renewal" — TS08JM2665 full negotiation flow
- "Sai's Creta insurance" — TS09EA4321 4W negotiation
- One-click demo buttons that auto-run full scenarios

#### 4.2 UI Polish
- Loading animations during negotiation rounds
- Confetti/celebration on savings achieved
- Mobile responsiveness audit
- Consistent styling across all new pages

#### 4.3 Voice Integration
- Voice command: "Negotiate my renewal" triggers negotiation flow
- Voice reads negotiation results and savings
- Telugu/Hindi language support for negotiation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│  index.html ─── negotiation.html ─── dashboard.html │
│  script.js      negotiation.js       dashboard.js   │
│  voice-assistant.html/js (existing)                 │
│  chatbot.js, vehicle-api.js (existing)              │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────┴──────────────────────────────┐
│                   BACKEND (server.js)               │
│                                                     │
│  EXISTING:                    NEW:                  │
│  ├─ /api/vehicle/:reg        ├─ /api/negotiate/*    │
│  ├─ /api/vehicle/:reg/quotes ├─ /api/claim-prob     │
│  ├─ /api/chat                ├─ /api/insurance-score│
│  ├─ /api/tts, /api/stt      ├─ /api/cost-simulator  │
│  ├─ /api/brands, /api/rto   └─ /api/clause-simplify │
│  └─ lookupVehicle()                                 │
│     generateQuotes()                                │
│     IRDAI data, RTO DB                              │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│               EXTERNAL APIS                         │
│  OpenRouter (Gemini 2.0 Flash) ─── AI reasoning     │
│  Azure Speech Services ─── TTS + STT                │
└─────────────────────────────────────────────────────┘
```

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| No framework (React/Vue) | Vanilla JS | Hackathon speed, no build step |
| Single server.js | Monolith | Simplicity, all logic co-located |
| OpenRouter not direct Gemini | Multi-model fallback | Reliability |
| Azure Speech not Web Speech API | Neural voice quality | Demo impact |
| IRDAI-compliant rates | Real data | Credibility with judges |
| Demo vehicles hardcoded | 15 vehicles | Reliable demo, no API failures |

---

## Competitive Edge vs Policybazaar

| Feature | Policybazaar | Insurix.India |
|---------|-------------|---------------|
| AI Negotiation Agent | ❌ None | ✅ Multi-round, multi-insurer |
| Voice-first Insurance | ❌ No voice | ✅ Telugu/Hindi/English STT+TTS |
| Claim Probability Score | ❌ No prediction | ✅ AI-powered scoring |
| Commission Transparency | ❌ Hidden | ✅ Fully transparent |
| Policy Clause Simplifier | ❌ Raw T&C | ✅ Plain language + risk flags |
| Cost Projection (3-5 yr) | ❌ Current only | ✅ Future cost simulator |
| Renewal Forecasting | ❌ Manual only | ✅ AI-predicted alerts |

---

## Implementation Order (Recommended)

1. **Negotiation Engine backend** (endpoints + insurer agent logic)
2. **Negotiation Dashboard UI** (HTML + JS + CSS)
3. **Wire negotiation to existing vehicle lookup + quotes**
4. **Demo scenario with TS08JM2665**
5. **Dashboard page** (claim score + insurance health + cost sim)
6. **Policy clause simplifier** (OpenRouter integration)
7. **Commission transparency data**
8. **Navigation integration + UI polish**
9. **Voice integration for negotiation**
10. **Final demo rehearsal**

---

*Last updated: Feb 27, 2026*
*Repository: TheCraftsman1/KLH_Hackathon_FireFlies (main branch)*
