# Founder Arena — Complete Gameplay Reference

---

## Player Journey (High Level)

```
1. Create Startup       → sector, region, name, pitch fields
2. Fill Pitch Deck      → 11 sections, AI analysis
3. Submit for VC Review → scored 0-100 per dimension
4. Accept Term Sheet    → status: funded
5. Build Team           → hire roles, set office
6. Run 12 Monthly Sims  → decisions + events + missions
7. Check Death / Win    → 5 death triggers, 7 outcomes
8. Final Score          → leaderboard, achievements, XP
```

---

## 1. Startup Creation

### Sectors (10)
- SaaS
- Fintech
- Healthtech
- AI / ML
- E-commerce
- Consumer
- Enterprise
- Climate
- EdTech
- Other

### Regions (7)
- North America
- Europe
- Asia
- Latin America
- Africa
- Oceania
- Remote / Global

### Pitch Deck Fields (11 sections)
| Field | Char Limit |
|---|---|
| Problem | 20–5,000 |
| Solution | 20–5,000 |
| Market size | 20–3,000 |
| Product description | 20–5,000 |
| Business model | 20–3,000 |
| Go-to-market | 20–3,000 |
| Competition | 10–3,000 |
| Team (optional) | max 2,000 |
| Financial plan | required |
| Funding ask | $25K–$10M |
| Use of funds | required |

### Internal Startup Classifications (16)
ai_saas · ai_infrastructure · fintech · remittance · web3_protocol · web3_wallet · saas_b2b · consumer_app · marketplace · gaming · healthcare_ai · logistics · energy · hardware · cybersecurity · developer_tools · enterprise_software

---

## 2. Game Phases

### Startup Status Flow
```
draft → pitching → funded → active → completed
                                   → dead
                                   → acquired
```

### Startup Stages
`idea` → `pre_seed` → `seed` → `series_a` → `series_b` → `scaleup`

---

## 3. VC Pitch & Review

### VC Scoring (each 0–100)
- Problem score
- Solution score
- Market score
- Team score
- Business score
- Overall score

### VC Review Outputs
- Decision: accept / reject / conditional
- Proposed amount + equity %
- Pre/post-money valuation
- Strengths & weaknesses
- Market timing assessment
- Milestone recommendations
- Founder coaching notes

### Review Limits by Plan
| Plan | Reviews/Month | Cooldown |
|---|---|---|
| Free | 3 | 2 hours |
| Pro | 20 | None |
| Max | Unlimited | None |

---

## 4. Term Sheets & Funding

### Term Sheet Properties
- Proposed amount + equity (%)
- Pre/post-money valuation
- Board seat or observer seat
- Pro-rata rights
- Liquidation preference
- Founder salary cap
- Earnout terms
- Milestone requirements

### Funding Round Types (5)
| Round | Range | Equity |
|---|---|---|
| Seed Extension | $250K–$750K | 10–20% |
| Series A | $2M–$10M | 15–25% |
| Series B | $10M–$50M | 10–20% |
| Strategic Round | $5M–$25M | 8–18% |
| Bridge Round | $500K–$2M | 5–15% |

---

## 5. Team & Hiring

### Employee Roles (12)
| Role | Base Salary/Mo | Primary Impact |
|---|---|---|
| CTO | $25K | +15 product |
| AI Engineer | $20K | +14 product |
| Sales Lead | $18K | +15 revenue |
| Security Engineer | $17K | −6 risk |
| Full-stack Engineer | $16K | +12 product |
| Backend Engineer | $15K | +10 product |
| Finance/Ops Manager | $15K | +4 investor, −4 risk |
| Marketing Manager | $14K | +10 revenue |
| Frontend Engineer | $14K | +10 product |
| Product Designer | $13K | +9 product, +2 revenue |
| Compliance Advisor | $12K | −8 risk |
| Customer Support | $8K | +4 revenue |

### Seniority Levels (4)
| Level | Salary Multiplier |
|---|---|
| Junior | 0.6× |
| Mid | 1.0× |
| Senior | 1.4× |
| Lead | 1.8× |

### Candidate Pool
- 5 candidates shown per month (deterministic rotation)
- Each has: name, role, seniority, skill rating, bio, warning flag

### Hiring Gates
- Status must be `funded` or `active`
- Must have ≥ 2 months cash runway

### Office Types (4)
| Type | Monthly Cost | Morale | Productivity |
|---|---|---|---|
| Remote | $0 | −5% | 0.95× |
| Coworking | $3K | +5% | 1.05× |
| Small Office | $8K | +10% | 1.10× |
| Premium Office | $20K | +15% | 1.15× |

---

## 6. Monthly Simulation (12 Months)

### Monthly Outputs
- Cash start / end
- Burn rate
- Revenue
- Runway (months)
- Product progress (0–100%)
- Valuation
- Investor score (0–100)
- Market score (0–100)
- Risk score (0–100)
- User growth
- AI board summary

### Monthly Decisions (13)
| Decision | One-time Cost | Burn Delta | Key Effect |
|---|---|---|---|
| Hire Engineering Contractor | $15K | +$15K | +12 product |
| Hire Sales Contractor | $12K | +$12K | +$8K revenue |
| Hire Compliance Advisor | $8K | +$8K | −8 risk |
| Product Focus | $5K | +$5K | +18 product |
| Launch Beta | $10K | +$5K | +8 product, +$3K rev |
| Marketing Spend | $18K | +$18K | +$12K revenue |
| Cut Costs | Free | −$10K | −4 product, −$2K rev |
| Improve Security | $10K | +$8K | −6 risk |
| Customer Interviews | $2K | +$2K | +6 product, +$1K rev |
| Enterprise Sales Push | $20K | +$15K | +$25K revenue |
| Delay Launch | $3K | +$3K | +10 product |
| Fundraising Prep | $5K | +$5K | +8 investor score |

### Decision Gates
- Month 1: Launch Beta and Enterprise Push unavailable
- Launch Beta requires product ≥ 40%
- Enterprise Sales Push requires product ≥ 50%

---

## 7. Monthly Events

### Event Categories (11)
1. **Market** — market correction, sector boom, supply chain disruption
2. **Team** — key resignation, team conflict, burnout wave
3. **Product** — viral moment, beta feedback, scaling challenges
4. **Security** — breach, audit finding, compliance issue
5. **Regulatory** — new regulation, license revoked, investigation
6. **Investor** — margin call, board pressure, investor conflict
7. **Customer** — churn spike, major customer, support crisis
8. **Competitor** — major launch, price war, acquisition
9. **Finance** — unexpected expense, revenue delay, funding fall-through
10. **Viral** — product goes viral, PR opportunity, negative press
11. **Operational** — system outage, data loss, key hire departure

Each event has:
- Severity: minor / moderate / critical
- 2–3 choices with trade-offs (no universally optimal answer)

---

## 8. Missions

### Mission Categories (14)
Product · Engineering · AI Model · Compliance · Security · Sales · Marketing · Operations · Fundraising · Growth · Partnership · Infrastructure · Research · Launch

### Mission Status Flow
`pending` → `active` → `completed` / `failed`

### Mission Properties
- Required roles, seniority, and headcount
- Upfront cost + monthly cost delta during mission
- Complexity (1–10) + Risk (1–10)
- Duration (months)
- On-success and on-failure stat deltas

---

## 9. Market Conditions

### Market Scenarios (7+)
| Scenario | Direction | Key Effect |
|---|---|---|
| Neutral Market | neutral | No multiplier adjustments |
| AI Boom | bullish | +80 AI demand, +25% revenue (AI sector), +25% valuation |
| Tight Money | bearish | −50 VC climate, −20% valuation (fintech/SaaS) |
| Geopolitical Conflict | bearish | −70% supply chain, +energy demand |
| Crypto Bull Run | bullish | +30% VC climate, +30% Web3 demand |
| Crypto Winter | bearish | −70% crypto sentiment, −30% Web3 valuation |

### Macro Factors Tracked
VC climate · inflation pressure · geopolitical risk · consumer spending · enterprise spending · AI demand · crypto sentiment · regulation pressure · supply chain · energy prices

---

## 10. Growth Offers

### Offer Types (9)
1. Strategic Investment — VC money, board observer, pro-rata rights
2. Acquisition — all-cash deal with earnout
3. Partnership — co-marketing, revenue sharing
4. Distribution Deal — marketplace/platform placement
5. Cloud Credits — $50K–$500K infrastructure credits
6. API Partnership — joint solution, revenue share
7. Platform Integration — first-party app directory listing
8. Acquihire — team acquisition with retention bonus
9. Rejected Interest — negative / no-deal outcome

### Offer Status Flow
`proposed` → `accepted` / `rejected` / `countered` / `expired`

- Max 5 offers shown per evaluation
- Fit score must be ≥ 30 for an offer to generate

---

## 11. Death Conditions (5 Triggers)

| Trigger | Condition |
|---|---|
| Cash out | Cash ≤ 0 AND revenue < burn rate |
| No runway | Runway ≤ 0 months |
| Catastrophic risk | Risk score ≥ 95 |
| Investor collapse | Investor score ≤ 10 AND cash < 2× burn |
| No traction | Month 9+ AND product < 20% AND revenue < $5K |

---

## 12. Final Outcomes (7)

| Outcome | Requirement | Score Multiplier |
|---|---|---|
| BREAKOUT | Revenue > $100K + capital efficiency > 2× | 3.0× |
| SERIES_A_READY | Revenue > $50K + valuation > $5M | 2.5× |
| ACQUISITION_TARGET | Valuation > $3M, low revenue | 2.0× |
| SEED_READY | Revenue > $20K + product ≥ 70% | 1.8× |
| SMALL_PROFITABLE | Revenue > $0 + cash > $0 | 1.5× |
| ZOMBIE | Survived 12 months, weak metrics | 0.5× |
| DEAD | Died before month 12 | 0× |

### Score Formula
```
base  = valuation/10K + revenue/1K + monthsSurvived × 50
final = base × outcomeMultiplier
```

---

## 13. Leaderboard & Achievements

### Leaderboard
- Categories: overall + per sector
- Current season: `beta-season-1`
- Entries: score, valuation, revenue, survival months, outcome

### Sample Achievements (50+ total)
| Achievement | Trigger | XP |
|---|---|---|
| First Pitch | Submit first pitch | 50 |
| Funded Founder | Accept term sheet | 100 |
| First Hire | Hire first employee | 75 |
| Survived 12 Months | Complete full simulation | 200 |
| Breakout Startup | Reach BREAKOUT outcome | 500 |
| Successful Exit | Accept acquisition | 600 |
| Unicorn Dream | Reach $10M+ valuation | 350 |
| Revenue Machine | Reach $100K MRR | 400 |
| Cockroach Founder | Survive with < 2 mo runway, recover | 250 |
| Lean Startup | Complete with ≤ 3 team + revenue | 300 |
| Compliance Minded | Risk score < 20 | 150 |
| Investor Favorite | Investor score ≥ 90 | 250 |
| Product Shipper | 100% product progress | 200 |
| Graveyard Entry | First startup death | 50 |

---

## 14. Subscription Tiers

| Feature | Free | Pro ($9/mo) | Max ($19/mo) |
|---|---|---|---|
| Max startups | 3 | Unlimited | Unlimited |
| AI reviews / month | 3 | 20 | Unlimited |
| Review cooldown | 2 hours | None | None |
| Speed tokens / month | 0 | 5 | 20 |
| Priority queue | No | Yes | Yes |
| Early access | No | No | Yes |

### Speed Tokens
- Premium currency for skipping the 2-hour review cooldown
- Pro: 5/month · Max: 20/month

---

## 15. Key Numbers at a Glance

| What | Count |
|---|---|
| Sectors | 10 |
| Regions | 7 |
| Subscription tiers | 3 |
| Simulation duration | 12 months |
| Employee roles | 12 |
| Seniority levels | 4 |
| Office types | 4 |
| Monthly decisions | 13 |
| Event categories | 11 |
| Mission categories | 14 |
| Startup classifications | 16 |
| Funding round types | 5 |
| Growth offer types | 9 |
| Death triggers | 5 |
| Final outcomes | 7 |
| Leaderboard multipliers | 7 |
| Achievements | 50+ |
| Market scenarios | 7+ |
| Candidate pool per month | 5 |
| Max startups (Free) | 3 |
| Max startups (Pro/Max) | Unlimited |
