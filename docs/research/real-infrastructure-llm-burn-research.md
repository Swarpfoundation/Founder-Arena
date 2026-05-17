# Founder Arena Phase 16A: Real Infrastructure and LLM Burn Research v0.1

Access date: 2026-05-17

This is a research document only. It does not define gameplay constants, does not change Founder Arena economy math, and should not be treated as a live pricing table.

## 1. Executive Summary

Founder Arena should model infrastructure burn as a staged, deterministic monthly cost layer rather than as exact cloud billing. Real provider pricing is too variable by region, SKU, usage pattern, credit program, and billing model to simulate penny-accurately without making the game worse.

Recommended product direction:

- Keep the player-facing rhythm as 12 Founder Weeks / Sprints.
- Keep infrastructure accounting monthly, matching the existing Monthly Burn / runway model.
- Add a future static, versioned "infra stack" economy table instead of calling live pricing APIs.
- Model cost drivers as ranges and risk modifiers: hosting, backend compute, database, storage, egress, monitoring/logs, AI usage, compliance, and cloud credits.
- Separate AI/LLM burn from generic hosting. AI-heavy startups can destroy runway even when their web hosting is cheap.
- Make cheap infrastructure viable early but risky later through outage/scaling risk, investor trust, enterprise readiness, and brand crisis events.

Smallest future implementation should be Phase 16B: Infrastructure Burn Economy Design. Do not implement provider SDKs, live pricing APIs, or real cloud credentials.

## 2. Methodology

Sources prioritized:

1. Official provider pricing pages and docs.
2. Official product-specific pricing pages for compute, database, storage, and AI.
3. Secondary/community sources were avoided as source of truth. They may be useful later for anecdotal "bill shock" event flavor, but not for deterministic cost tables.

Pricing capture rules:

- Prices are recorded as cost drivers and representative anchors, not as permanent gameplay constants.
- Every pricing claim includes provider, official source URL, access date, and notes.
- USD list prices can vary by region, billing currency, negotiated contracts, credits, plan changes, and product availability.

## 3. Source List

| Provider | Official source | Access date | Used for |
|---|---|---:|---|
| Render | https://render.com/pricing | 2026-05-17 | Workspace plans, service pricing, bandwidth, Postgres/key-value cost drivers |
| Vercel | https://vercel.com/pricing | 2026-05-17 | Hobby/Pro plans, data transfer, edge requests, blob, observability |
| Vercel | https://vercel.com/docs/pricing | 2026-05-17 | Billable managed infrastructure model |
| Replit | https://replit.com/pricing | 2026-05-17 | Starter/Core/Pro plan prices and included credits |
| Replit | https://docs.replit.com/billing/deployment-pricing | 2026-05-17 | Deployment usage model and app publishing examples |
| AWS Lambda | https://aws.amazon.com/lambda/pricing/ | 2026-05-17 | Serverless request and GB-second cost drivers |
| AWS EC2 | https://aws.amazon.com/ec2/pricing/on-demand/ | 2026-05-17 | VM, data transfer, CPU-credit, Savings Plan considerations |
| AWS RDS PostgreSQL | https://aws.amazon.com/rds/postgresql/pricing/ | 2026-05-17 | Managed Postgres free tier, hourly DB instance, Multi-AZ |
| AWS S3 | https://aws.amazon.com/s3/pricing/ | 2026-05-17 | Object storage, requests, retrieval, transfer cost drivers |
| AWS CloudWatch | https://aws.amazon.com/cloudwatch/pricing/ | 2026-05-17 | Logs, metrics, dashboards, traces, observability cost drivers |
| AWS Free Tier | https://aws.amazon.com/free/ | 2026-05-17 | New customer credits and free plan framing |
| Google Cloud Run | https://cloud.google.com/run/pricing | 2026-05-17 | Serverless container compute, free tier, network egress |
| Google Cloud SQL | https://cloud.google.com/sql/pricing | 2026-05-17 | Managed SQL CPU/memory/storage/HA cost drivers |
| Google Cloud Storage | https://cloud.google.com/storage/pricing | 2026-05-17 | Object storage and regional storage/operation/egress variability |
| Google Cloud Free Tier | https://cloud.google.com/free | 2026-05-17 | $300 credit and free tier examples |
| Google Vertex AI / Gemini | https://cloud.google.com/vertex-ai/generative-ai/pricing | 2026-05-17 | Gemini token, batch, grounding, multimodal cost drivers |
| OpenAI API | https://platform.openai.com/docs/pricing | 2026-05-17 | Token pricing, cached input, tools, batch/container considerations |
| Anthropic Claude API | https://platform.claude.com/docs/en/about-claude/pricing | 2026-05-17 | Claude token pricing, cache pricing, batch, long-context considerations |
| Supabase | https://supabase.com/docs/pricing | 2026-05-17 | Optional managed Postgres/backend comparison |
| Neon | https://neon.com/pricing | 2026-05-17 | Optional serverless Postgres comparison |
| Cloudflare Workers/R2 | https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/r2/pricing/ | 2026-05-17 | Optional edge compute/storage comparison |
| Railway | https://docs.railway.com/pricing | 2026-05-17 | Optional developer platform comparison |

## 4. Provider Pricing Summary

### Deployment and Hosting Platforms

| Provider | Official pricing claims | Cost drivers | Best-fit stage | Hidden cost risks |
|---|---|---|---|---|
| Render | Hobby workspace is $0/mo plus compute; Pro is $25/mo plus compute; Scale is $499/mo plus compute. Static sites start at $0/mo. Free compute plans exist for web services, key-value, and Postgres with usage limits. Bandwidth includes 5 GB/month then $0.15/GB on listed workspace features. Source: https://render.com/pricing, accessed 2026-05-17. | Service instance size, always-on services, Postgres, key-value, bandwidth, previews, private networking, autoscaling. | Pre-seed MVP through Seed Launch. | Free services sleep/limit behavior, managed database upgrades, bandwidth, private link bandwidth, always-on workers. |
| Vercel | Hobby is free; Pro is $20/mo plus usage with $20 included usage credit. Hobby includes 100 GB/month Fast Data Transfer; Pro includes 1 TB/month then starts at $0.15/GB. Edge Requests include 1M/month on Hobby and 10M/month on Pro, then starting at $2 per 1M. Blob storage includes 1 GB/month then $0.023/GB; blob transfer includes 10 GB/month then starts at $0.05/GB. Source: https://vercel.com/pricing, accessed 2026-05-17. | Edge requests, function duration, bandwidth, image optimization, ISR reads/writes, blob storage, observability, analytics, seats. | Frontend-heavy MVP through Growth / PMF. | Bandwidth spikes, image optimization, serverless duration, observability add-ons, multiple team seats. |
| Replit | Starter is free and includes one published project; Core is listed as $25/mo monthly or $20/mo annually and includes $25 monthly credits; Pro is listed as $100/mo monthly or $95/mo annually and includes $100 monthly credits. Source: https://replit.com/pricing, accessed 2026-05-17. Publishing costs use credits and can be request-based, scheduled, reserved VM, or static deployment. Official examples show low-traffic apps from roughly $1.05/month to $14.27/month depending on requests and compute units. Source: https://docs.replit.com/billing/deployment-pricing, accessed 2026-05-17. | Plan credits, requests, compute units, reserved VM size, storage, AI agent usage, collaborators. | Idea / Prototype and Pre-seed MVP. | Credit exhaustion, agent usage, outgrowing prototype deployment, commercial plan requirements. |
| AWS | AWS Free Tier offers up to $200 in credits for new customers. Lambda includes 1M free requests/month and 400,000 GB-seconds/month free; request price after free tier is $0.20 per 1M requests. RDS PostgreSQL free tier includes 750 hours on eligible Single-AZ DB instances, 20 GB gp2 storage, and 20 GB backup storage monthly for one year. S3 has no minimum charge and charges for storage, requests, retrieval, transfer, management, replication, transform/query. Sources: https://aws.amazon.com/free/, https://aws.amazon.com/lambda/pricing/, https://aws.amazon.com/rds/postgresql/pricing/, https://aws.amazon.com/s3/pricing/, accessed 2026-05-17. | EC2/Fargate/Lambda compute, RDS/Aurora, S3, data transfer, NAT, load balancers, CloudWatch logs/metrics, support plans, public IPv4, multi-AZ. | Seed Launch through Enterprise Scale. | Egress, NAT gateway, logs, Multi-AZ replicas, idle resources, managed support, Savings Plan complexity. |
| Google Cloud | New customers get $300 in free credits. Cloud Run charges for resources used and has free tier examples including 240,000 vCPU-seconds and 450,000 GiB-seconds/month for instance-based billing in listed regions, plus 1 GiB outbound transfer within North America. Cloud SQL pricing is composed of CPU/memory, storage/networking, instance pricing, Cloud DNS, and extended support; example Iowa Enterprise general purpose CPU is $0.0413/hour and memory is $0.007/GiB-hour. Sources: https://cloud.google.com/free, https://cloud.google.com/run/pricing, https://cloud.google.com/sql/pricing, accessed 2026-05-17. | Cloud Run/Compute/GKE, Cloud SQL, storage, network egress, Cloud Build, logging/monitoring, Vertex AI, committed-use discounts. | Seed Launch through Enterprise Scale. | Always-on database cost, egress, logs, Cloud Build, HA, regional pricing, Vertex AI multimodal costs. |

### Optional Comparison Providers

| Provider | Official pricing claims | Cost drivers | Best-fit stage | Hidden cost risks |
|---|---|---|---|---|
| Supabase | Free includes 500 MB database, 5 GB egress, 5 GB cached egress, 1 GB file storage, and 50,000 monthly active users. Pro starts at $25/month with 8 GB disk per project, 250 GB egress, 250 GB cached egress, 100 GB file storage, 100,000 monthly active users, and overage rates. Source: https://supabase.com/docs/pricing, accessed 2026-05-17. | Auth MAU, database disk, egress, file storage, compute size, log retention, backups/PITR. | Pre-seed MVP through Seed Launch. | Egress, compute upgrades, PITR/backups, log drains, MAU growth. |
| Neon | Neon pricing uses compute units, storage GB-months, branching, and plan-specific CU-hour pricing; official page lists included CU-hours and storage by plan. Source: https://neon.com/pricing, accessed 2026-05-17. | Compute hours, storage, branches, projects, autosuspend behavior. | Prototype through Seed Launch. | Always-on compute, branch storage, connection limits, production HA needs. |
| Cloudflare | Workers pricing uses requests and CPU time; R2 documentation states direct R2 egress does not incur data transfer charges. Sources: https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/r2/pricing/, accessed 2026-05-17. | Worker requests, CPU time, Durable Objects, D1, KV, R2 storage/operations, images, logs. | Edge-heavy apps and media/storage-heavy MVPs. | CPU limits, eventual consistency constraints, database fit, product-specific quotas. |
| Railway | Railway uses base subscription plus consumed resources; official docs describe paying a subscription fee plus actual resource consumption. Source: https://docs.railway.com/pricing, accessed 2026-05-17. | CPU, memory, egress, volumes, databases, plan base fee. | Prototype through Seed Launch. | Usage over included credits, always-on services, database/storage growth. |

## 5. Database, Storage, Bandwidth, and Observability Comparison

| Category | Real-world pricing pattern | Gameplay interpretation |
|---|---|---|
| Managed Postgres | Usually priced by instance compute, memory, storage, backup retention, HA/replicas, and connection limits. RDS and Cloud SQL add major cost when moving to Multi-AZ/HA. | Database should be a separate burn component that rises with users, enterprise readiness, and reliability tier. |
| Serverless Postgres | Often cheap while idle but can surprise through always-on compute, storage, branch count, connection pooling, or scale settings. | Good early "cheap stack" option with medium lock-in and scaling-risk modifiers. |
| Object storage | Cheap per GB, but request volume, retrieval, lifecycle, replication, and egress can dominate. AWS S3 explicitly separates storage, requests, retrieval, transfer, management, replication, and query/transform costs. | Media-heavy or AI-document apps should pay for storage and egress separately from hosting. |
| Bandwidth / egress | Often bundled at low tiers, then priced per GB. Vercel and Render both expose included monthly bandwidth with overage pricing; AWS/GCP egress depends on service/region/destination. | Egress is a major "bill shock" event candidate, especially for viral social/product moments. |
| Build minutes/deploy usage | Platforms vary. Google Cloud includes Cloud Build free tier examples; Vercel/Replit/Railway/Render tie deployment experience to plan/resources. | Build minutes should not be v0.1 core math; use as rare event flavor or later devops overhead. |
| Logs/observability | AWS CloudWatch free tier includes 5 GB logs and several metric/dashboard allowances, then pay-as-you-use. Vercel observability and analytics are add-ons/usage-based. | Logs/monitoring should begin as a stage-based overhead and later become an outage-risk reducer. |

## 6. LLM/API Pricing Comparison

All LLM prices below are per 1M tokens unless otherwise noted. Treat them as research anchors, not gameplay constants.

| Provider | Official pricing claims | Cost drivers | Gameplay notes |
|---|---|---|---|
| OpenAI | Official pricing lists GPT-5.5 short context at $2.50 input, $0.25 cached input, $15 output; GPT-5.4 at $1.25 input, $0.13 cached input, $7.50 output; GPT-5.4-mini at $0.375 input, $0.0375 cached input, $2.25 output; GPT-5.4-nano at $0.10 input, $0.01 cached input, $0.625 output. Long context and priority pricing can be higher; regional processing has a 10% uplift for listed GPT-5.5/GPT-5.4 models. Tokens used for built-in tools are billed at the chosen model's token rates, and some hosted tools/container sessions have separate pricing mechanics. Source: https://platform.openai.com/docs/pricing, accessed 2026-05-17. | Input tokens, cached input, output tokens, context length, priority tier, batch/flex mode, tools, containers, web/file search, realtime/audio/image models. | AI review features should estimate both prompt size and output verbosity. Cached prompts can reduce cost for repeat workflows. |
| Anthropic Claude | Official pricing lists Claude Haiku 4.5 at $1 input, $1.25 cache write, $2 cache write 1-hour, $0.10 cache hit, $5 output; Claude Haiku 3.5 at $0.80 input and $4 output; Claude Haiku 3 at $0.25 input and $1.25 output. Batch API gives a 50% discount on input and output; Claude Sonnet 4.5 batch is $1.50 input and $7.50 output. The 1M context beta for Sonnet has premium long-context rates beyond 200K input tokens. Web fetch has no additional charge beyond standard token costs for fetched content. Source: https://platform.claude.com/docs/en/about-claude/pricing, accessed 2026-05-17. | Input/output tokens, cache writes/hits, long context threshold, batch, tool context, output verbosity. | Great for "agentic workflow bill spike" events because context growth and cache behavior matter. |
| Google Gemini / Vertex AI | Official Vertex/Gemini pricing lists Gemini 2.5 Pro at $1.25 input and $10 output for <=200K input tokens, with higher rates beyond 200K; Flex/Batch is discounted. Gemini 2.5 Flash is listed at $0.54 input for text/image/video and $4.50 text output; Flex/Batch Flash shows $0.15 input and $1.25 output. Gemini 2.5 Flash Lite is listed at $0.18 input and $0.72 output; Flex/Batch Flash Lite shows $0.05 input and $0.20 output. Grounding with Google Search includes daily free grounded prompt allowances for certain Gemini models, then billed at $35 per 1,000 grounded prompts. Source: https://cloud.google.com/vertex-ai/generative-ai/pricing, accessed 2026-05-17. | Token type, context threshold, batch/flex, audio/video/image inputs, grounding, regional/currency SKU pricing. | Multimodal AI startups should have separate AI usage profiles; search grounding can become a variable cost event. |

### Practical Cost Examples for 1,000 AI Reviews

Assumption for gameplay design only: one AI review consumes 4,000 input tokens and 1,000 output tokens. These estimates ignore retries, tools, cache, regional uplifts, and provider-specific rounding.

| Model anchor | Formula | Approx. cost / 1,000 reviews | Source |
|---|---:|---:|---|
| OpenAI GPT-5.4-mini | 4M input * $0.375 + 1M output * $2.25 | $3.75 | Official OpenAI pricing, accessed 2026-05-17 |
| OpenAI GPT-5.4 | 4M input * $1.25 + 1M output * $7.50 | $12.50 | Official OpenAI pricing, accessed 2026-05-17 |
| Anthropic Claude Haiku 4.5 | 4M input * $1 + 1M output * $5 | $9.00 | Official Anthropic pricing, accessed 2026-05-17 |
| Google Gemini 2.5 Flash Lite | 4M input * $0.18 + 1M output * $0.72 | $1.44 | Official Google Vertex AI pricing, accessed 2026-05-17 |
| Google Gemini 2.5 Pro <=200K input | 4M input * $1.25 + 1M output * $10 | $15.00 | Official Google Vertex AI pricing, accessed 2026-05-17 |

### Practical Cost Per Daily Active User

Example assumptions for game economy tuning:

| Usage profile | AI calls / DAU / day | Tokens per call | Approx. monthly token volume per 1,000 DAU | Burn implication |
|---|---:|---:|---:|---|
| Light AI assist | 1 | 1K input / 250 output | 30M input / 7.5M output | Usually manageable on cheap/mini models; expensive on premium models. |
| Moderate AI product | 5 | 2K input / 500 output | 300M input / 75M output | Can exceed hosting/database burn quickly. |
| Heavy agentic workflow | 20 | 8K input / 2K output | 4.8B input / 1.2B output | Potential company-killing burn without caching, batching, limits, or paid pricing. |
| Multimodal/realtime | varies | text + image/audio/video | highly variable | Needs a separate advanced profile; do not model in v0.1 except as risk flag. |

## 7. Startup-Stage Burn Ranges

These ranges are gameplay recommendations based on official cost drivers, not exact provider quotes.

| Startup stage | Common stack | Realistic monthly infra burn range | Risk profile | Player decisions that should influence cost |
|---|---|---:|---|---|
| Idea / Prototype | Replit Starter/Core, Vercel Hobby, Render Hobby/static, Supabase/Neon free | $0-$50 | Low cost, low reliability expectations, limited scale. | Prototype stack, no-code/AI-builder usage, whether app is public. |
| Pre-seed MVP | Vercel Pro + managed Postgres, Render web service + Postgres, Replit Core/Pro, Supabase Pro | $25-$300 | Good speed, moderate bill shock if traffic spikes. | Managed DB, storage, public launch, basic monitoring, cloud credits. |
| Seed Launch | Vercel/Render + production DB, Supabase Pro scaled compute, GCP Cloud Run + Cloud SQL, AWS Lambda/RDS/S3 | $300-$2,500 | Egress, logs, database, and AI usage become meaningful. | Reliability tier, caching, DB sizing, AI usage limits, media uploads. |
| Growth / PMF | AWS/GCP managed stack, Cloud Run/GKE, RDS/Cloud SQL HA, CDN/storage, observability | $2,500-$25,000 | Scaling pain, outage risk, monitoring bills, engineering overhead. | HA, autoscaling, enterprise customer requirements, compliance, team/devops investment. |
| Series A Scale | AWS/GCP enterprise stack, multi-region, advanced observability, data warehouse/vector DB | $25,000-$150,000+ | Architecture complexity, egress, logs, security, AI unit economics. | Multi-region, compliance, enterprise SLAs, model selection, self-hosting tradeoffs. |
| Enterprise Scale | Enterprise contracts, dedicated support, multi-cloud/region, compliance stack, GPU/AI infra | $150,000+ | Procurement, lock-in, compliance, specialized infra. | Enterprise plan, security certifications, dedicated capacity, GPU/self-hosting. |

## 8. Game Economy Translation

### Infrastructure Stack Archetypes

| Stack | Stage fit | Monthly cost range | Reliability | Scalability | Dev speed | Investor trust | Outage risk | Lock-in |
|---|---|---:|---|---|---|---|---|---|
| No-Code Prototype | Idea / Prototype | $0-$50 | Low | Low | Very high | Low | Medium | Medium |
| Replit MVP | Idea / Pre-seed | $0-$150 | Low-medium | Low-medium | Very high | Low-medium | Medium | Medium |
| Vercel Frontend + Serverless | Pre-seed / Seed | $20-$1,000 | Medium-high | Medium-high | High | Medium-high | Medium | Medium-high |
| Render Full-Stack App | Pre-seed / Seed | $25-$1,500 | Medium-high | Medium | High | Medium | Medium | Medium |
| Supabase/Neon DB Stack | Pre-seed / Seed | $0-$1,000 | Medium | Medium | High | Medium | Medium | Medium |
| AWS Startup Stack | Seed / Growth | $300-$25,000 | High | High | Medium | High | Low-medium if staffed | High |
| Google Cloud Startup Stack | Seed / Growth | $300-$25,000 | High | High | Medium | High | Low-medium if staffed | High |
| Enterprise Cloud Stack | Series A / Enterprise | $25,000+ | Very high | Very high | Medium-low | Very high | Low if staffed | Very high |
| Self-hosted / GPU Stack | Later advanced system | variable | Medium | variable | Low | Medium | Medium-high | Low-medium |

### Infrastructure Burn Components

Future model should break infrastructure burn into:

- frontend hosting
- backend compute
- database
- storage
- bandwidth / egress
- build / deploy usage
- monitoring / logs
- AI / LLM usage
- embeddings / vector database
- GPU inference
- security / compliance overhead
- cloud credits applied

### Decision Inputs

Good player-facing choices:

- Choose infra stack tier.
- Choose reliability posture: cheap, balanced, enterprise-ready.
- Accept cloud credit growth offers.
- Limit or expand AI features.
- Invest in monitoring / caching / security.
- Move upmarket, which requires compliance and reliability.

Avoid exposing:

- Raw AWS SKU menus.
- Region-specific penny math.
- Real provider credentials.
- Live cloud billing data.

## 9. Gameplay Design Questions

1. Should infrastructure burn be automatic by stage, or player-selected?
   - Use hybrid. Default automatic recommended stack by stage, with player-selectable upgrades/downgrades.

2. Should player choose cloud provider?
   - Yes, but as archetypes, not exact SKU selection. Example: "Vercel Serverless", "Render Full-Stack", "AWS Scale Stack".

3. Should provider choice affect reliability, speed, cost, risk, and investor trust?
   - Yes. Otherwise it is cosmetic. Each stack should affect monthly infra burn, outage risk, scalability, dev speed, and investor trust.

4. Should Cloud Credits reduce burn temporarily?
   - Yes. Credits should reduce eligible infrastructure burn for a limited duration or until depleted, with lock-in risk.

5. Should bad infra decisions create outages/brand risk?
   - Yes. Underinvesting while scaling should increase outage, brand risk, and boardroom pressure.

6. Should LLM-heavy startups have separate AI usage burn?
   - Yes. AI/API burn needs its own component because it can dominate hosting costs.

7. Should AI costs scale with users, reviews, or product type?
   - Yes. Scale by product type, user count, AI requests per user, average tokens, model tier, and caching/batch posture.

8. Should infrastructure costs affect runway directly?
   - Yes, through Monthly Burn. The accounting remains monthly even though gameplay is sprint-based.

9. Should infra quality reduce risk but increase burn?
   - Yes. Better infra should reduce outage/compliance risk and raise investor trust, but burn more cash.

10. Should "cheap stack" improve runway but raise outage/scaling risk?
    - Yes. This creates a useful founder tradeoff.

11. Should enterprise customers require higher compliance/infra spend?
    - Yes. Enterprise revenue should require security/compliance overhead and reliable infra.

12. Should GPU/self-hosting be a later advanced option?
    - Yes. GPU/self-hosting is too complex for v0.1 and should arrive after AI usage burn exists.

## 10. Proposed Future Systems

### A. Infrastructure Stack Choice

Player selects or accepts a recommended stack:

- Cheap Prototype Stack
- Replit MVP Stack
- Serverless Startup Stack
- Managed Full-Stack Stack
- Cloud Scale Stack
- AI-Heavy Stack
- Enterprise Compliance Stack

Each stack should define:

- monthly fixed cost range
- variable cost drivers
- reliability
- scalability
- security/compliance
- dev speed
- complexity
- investor trust
- outage risk
- lock-in risk
- AI/API exposure

### B. Infra Burn Meter

Panel components:

- base hosting
- backend compute
- database
- storage
- bandwidth / egress
- AI/API
- monitoring/logs
- compliance
- cloud credits applied
- effective monthly infra burn

### C. Infra Events

Potential events:

- Vercel bill shock
- AWS egress surprise
- Render database limit hit
- Replit prototype outgrown
- Google Cloud credits expired
- LLM token bill spike
- GPU inference overload
- database connection limit reached
- logs/observability bill spike
- enterprise compliance audit
- caching layer saves the sprint

### D. Cloud Credits Growth Offer

Existing Growth Offers already include Cloud Credits. Future rules:

- credits reduce eligible infra burn before cash is spent
- credits should be $50K-$500K depending on offer strength and stage
- credits expire after a fixed number of internal accounting periods
- provider-specific credits may restrict stack switching
- credits can increase lock-in risk and investor expectations

### E. AI Usage Model

AI startup usage tiers:

| AI profile | Examples | Cost behavior |
|---|---|---|
| Light AI assist | internal summaries, small copilots | low variable burn |
| Moderate AI usage | AI reviews, personalized recommendations | meaningful but manageable |
| Heavy AI usage | user-facing chat/agents | scales directly with active users |
| Agentic usage | tool use, long context, autonomous workflows | high context/output risk |
| Multimodal/realtime | audio, image, video, realtime agents | advanced; defer past v0.1 |

## 11. Recommended Data Model Later

Do not implement in Phase 16A. Proposed future TypeScript types:

```ts
type InfrastructureProvider =
  | "render"
  | "vercel"
  | "replit"
  | "aws"
  | "google_cloud"
  | "supabase"
  | "neon"
  | "cloudflare"
  | "railway"
  | "custom";

type InfraCostComponent =
  | "hosting"
  | "backend_compute"
  | "database"
  | "storage"
  | "bandwidth_egress"
  | "build_minutes"
  | "logs_monitoring"
  | "llm_api"
  | "embeddings"
  | "gpu_inference"
  | "compliance_overhead";

type InfrastructureStack = {
  id: string;
  provider: InfrastructureProvider;
  title: string;
  stageFit: string[];
  baseMonthlyCost: { min: number; max: number };
  variableCostDrivers: InfraCostComponent[];
  reliability: number;
  scalability: number;
  security: number;
  devSpeed: number;
  complexity: number;
  investorTrust: number;
  outageRisk: number;
  lockInRisk: number;
};

type InfraUsageProfile = {
  users: number;
  requestsPerUser: number;
  dataTransferGb: number;
  dbStorageGb: number;
  aiRequestsPerUser: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  imageOrAudioUsage?: "none" | "light" | "moderate" | "heavy";
};

type InfrastructureBurnModel = {
  fixedMonthlyCost: number;
  variableMonthlyCost: number;
  cloudCreditsRemaining: number;
  effectiveMonthlyBurn: number;
  riskModifiers: {
    outageRiskDelta: number;
    investorTrustDelta: number;
    brandRiskDelta: number;
  };
  explanation: string[];
};
```

## 12. Recommended v0.1 Implementation Scope

### Phase 16B: Infrastructure Burn Economy Design

Deliverables:

- static versioned cost table based on this research
- infra stack catalog
- deterministic cost calculator design
- AI usage tier design
- cloud credits design
- risk modifiers and event hooks
- balance plan for integrating with existing Monthly Burn

Rules:

- no live pricing API
- no provider SDKs
- no schema migration unless the design proves it is needed
- no real user cloud credentials
- no exact bill simulator

### Phase 16C: Infrastructure Burn Implementation

Deliverables:

- player-facing Infra Stack panel
- infrastructure burn component added to Monthly Burn
- cloud credit application
- infra events
- tests for deterministic calculations
- docs explaining pricing version and non-realtime nature

## 13. Risks and Anti-Patterns

Avoid:

- Live pricing API calls inside gameplay. Pricing changes would destabilize deterministic runs and tests.
- Exact penny-accurate billing simulation. It adds cognitive load without better game decisions.
- Forcing AWS billing complexity onto players. Use archetypes and clear tradeoffs.
- Cosmetic provider choice. Provider stacks should affect reliability, scalability, burn, and trust.
- Cheapest option always optimal. Cheap should buy runway while raising scaling and outage risk.
- Infra burn too punishing early. Prototype stages should stay affordable.
- Breaking existing economy balance. Infra burn should be additive, gated by stage, and tuned carefully.
- Real provider sponsorship copy before partnerships exist.
- Asking for cloud credentials or reading real user bills.
- Exposing real invoices or cloud usage data.

## 14. What Not To Model Yet

Do not model in v0.1:

- Exact region/SKU selection.
- NAT gateway line-item complexity.
- Every AWS/GCP service.
- Real-time price updates.
- Contract discounts and enterprise procurement.
- GPU self-hosting economics.
- Fine-tuning and dedicated capacity.
- Real customer cloud account imports.
- Real billing alerts.
- Real infrastructure deployment.

## 15. Open Questions

- Should infrastructure stack be selected during startup creation or after funding?
- Should AI-heavy startup templates start with an AI usage profile immediately?
- Should cloud credits be tied to Growth Offers only, or also starter grants?
- How much should investor trust improve from enterprise-grade infra?
- Should outage events be prevented by monitoring spend or only reduced in probability?
- Should enterprise customers require compliance spend before revenue unlocks?
- Should infra burn be shown in the existing burn breakdown or a separate HUD panel?
- Should credits reduce stored monthly burn or appear as a temporary offset to runway calculations?

## 16. Future Implementation Roadmap

### Phase 16B: Infrastructure Burn Economy Design

- Define deterministic cost table v2026.05.
- Define infra stack catalog and stage fit.
- Define AI usage profiles.
- Define cloud credit mechanics.
- Define risk/event hooks.
- Produce balance spreadsheet or markdown table.

### Phase 16C: Infrastructure Burn Implementation

- Add infra burn calculation in the existing economy layer.
- Add tests for all stacks and AI profiles.
- Add infra burn display to Monthly Burn breakdown.
- Add cloud credit reduction.
- Add stage-gated infra events.

### Phase 16D: Infra Game Feel

- Add "Bill Shock", "Outage", "Cloud Credits Expired", and "Enterprise Audit" event presentations.
- Add founder-facing explanations.
- Add boardroom pressure integration.

### Later: Advanced AI/GPU Economy

- Model embeddings/vector DB.
- Model multimodal/realtime usage.
- Model self-hosted GPU inference.
- Model agentic workflow token explosion.
- Consider enterprise procurement and dedicated capacity.

