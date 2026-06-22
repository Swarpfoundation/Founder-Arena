import type { ReactNode } from "react";
import {
  BADGE_ASSETS,
  DECISION_ASSETS,
  ENDING_ASSETS,
  EVENT_ASSETS,
  FOUNDER_ASSETS,
  FUNDING_ASSETS,
  GAME_ASSETS,
  INVESTOR_ASSETS,
  ONBOARDING_ASSETS,
  SECTOR_ASSETS,
  type GameAssetName,
} from "@/lib/game-assets";
import { GameAssetImage } from "./GameAssetImage";

const NAVIGATION = [
  { label: "The run", href: "#run" },
  { label: "Founders", href: "#founders" },
  { label: "Decisions", href: "#decisions" },
  { label: "Pressure", href: "#pressure" },
  { label: "Outcomes", href: "#outcomes" },
];

const RUN_PHASES = [
  { week: "01—03", title: "Launch Signal", body: "Choose a thesis, establish the company, and make the first product and team calls." },
  { week: "04—06", title: "Market Proof", body: "Turn early signals into traction while investors test the story behind your numbers." },
  { week: "07—09", title: "Survive or Scale", body: "Pressure compounds. Protect runway, answer crises, and decide what deserves scarce capital." },
  { week: "10—12", title: "Demo Day Runway", body: "The final operating stretch ends in a deterministic Demo Day verdict." },
];

const ONBOARDING_COPY = [
  { eyebrow: "01 / Deploy", title: "Found your startup", body: "Name the company, choose its sector and region, then select the founder style that shapes your operating strengths." },
  { eyebrow: "02 / Operate", title: "Make strategic moves", body: "Each Founder Week is a sprint. Queue up to three decisions while cash, salaries, burn, and runway remain monthly financial signals." },
  { eyebrow: "03 / Verdict", title: "Survive, scale, or exit", body: "Reach Demo Day without hitting zero, build toward a strong verdict, or accept an acquisition when the terms make sense." },
];

const DECISION_COPY: Record<(typeof DECISION_ASSETS)[number], string> = {
  decision_growth: "Acquire users and turn traction into momentum.",
  decision_product: "Ship the work that changes product-market fit.",
  decision_team: "Hire, retain, and organize the people behind execution.",
  decision_fundraising: "Trade ownership for runway on terms you can defend.",
  decision_marketing: "Shape demand, positioning, and market attention.",
  decision_operations: "Control burn, infrastructure, and execution risk.",
};

const OUTCOME_COPY: Record<(typeof ENDING_ASSETS)[number], { title: string; body: string }> = {
  ending_failed: { title: "Failed", body: "Runway reaches zero or the company can no longer continue." },
  ending_survived: { title: "Survived", body: "The company reaches Demo Day with enough strength to keep building." },
  ending_acquired: { title: "Acquired", body: "A strategic offer becomes the ending you choose to accept." },
};

function displayName(name: GameAssetName): string {
  return name
    .replace(/^(sector|founder|decision|event|investor|badge|ending)_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("Saas", "SaaS")
    .replace("Vc", "VC")
    .replace("Pr ", "PR ");
}

function SectionIntro({ code, title, body }: { code: string; title: ReactNode; body: string }) {
  return (
    <div className="fa-section-intro">
      <p className="fa-kicker">{code}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function AssetTile({ name, compact = false }: { name: GameAssetName; compact?: boolean }) {
  const asset = GAME_ASSETS[name];
  return (
    <figure className={compact ? "fa-asset-tile fa-asset-tile--compact" : "fa-asset-tile"}>
      <div className="fa-asset-tile__image">
        <GameAssetImage name={name} sizes={compact ? "160px" : "(max-width: 640px) 44vw, 220px"} />
      </div>
      <figcaption>
        <span>{displayName(name)}</span>
        <small>{asset.category}</small>
      </figcaption>
    </figure>
  );
}

function AssetRail({ assets, label }: { assets: readonly GameAssetName[]; label: string }) {
  return (
    <div className="fa-asset-rail" role="region" aria-label={label} tabIndex={0}>
      {assets.map((name) => <AssetTile key={name} name={name} compact />)}
    </div>
  );
}

export function FounderArenaLanding() {
  return (
    <div className="fa-marketing">
      <header className="fa-header">
        <a className="fa-header__brand" href="#top" aria-label="Founder Arena home">
          <GameAssetImage name="FounderArenaLogo" priority sizes="96px" />
          <span><strong>Founder Arena</strong><small>Mobile game in development</small></span>
        </a>
        <nav aria-label="Primary navigation">
          {NAVIGATION.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <a className="fa-button fa-button--small" href="#platforms">Beta status</a>
      </header>

      <main>
        <section id="top" className="fa-hero">
          <GameAssetImage name="arena_bg_active" className="fa-scene-background" sizes="100vw" priority decorative />
          <div className="fa-scene-shade" aria-hidden="true" />
          <div className="fa-scanlines" aria-hidden="true" />
          <div className="fa-hero__content">
            <div className="fa-hero__copy">
              <p className="fa-kicker"><span /> Closed beta development build</p>
              <h1>Build.<br /><em>Raise.</em><br />Survive.</h1>
              <p className="fa-hero__lede">
                A 12-week startup roguelike where every product call, hire, financing decision, and crisis changes the company you bring to Demo Day.
              </p>
              <div className="fa-hero__actions">
                <a className="fa-button" href="#run">Read the operating brief</a>
                <a className="fa-button fa-button--outline" href="#platforms">Mobile beta status</a>
              </div>
              <dl className="fa-hero__facts">
                <div><dt>Format</dt><dd>12 Founder Weeks</dd></div>
                <div><dt>Authority</dt><dd>Deterministic systems</dd></div>
                <div><dt>Target</dt><dd>Demo Day verdict</dd></div>
              </dl>
            </div>

            <div className="fa-command-card" aria-label="Example Founder Arena command briefing">
              <div className="fa-command-card__bar"><span>FA / RUN 001</span><strong>ACTIVE</strong></div>
              <div className="fa-command-card__identity">
                <GameAssetImage name="founder_technical" sizes="170px" />
                <div><small>Founder style</small><strong>Technical</strong><span>Nimbus Systems · SaaS</span></div>
                <GameAssetImage name="sector_saas" sizes="72px" />
              </div>
              <div className="fa-command-card__metrics">
                <div><small>Cash</small><strong>$820K</strong></div>
                <div><small>Runway</small><strong>8.4 mo</strong></div>
                <div><small>Week</small><strong>07 / 12</strong></div>
              </div>
              <div className="fa-command-card__mission">
                <GameAssetImage name="decision_product" sizes="92px" />
                <div><small>Current objective</small><strong>Prove repeatable demand</strong><p>Balance product velocity against burn before the next capital decision.</p></div>
              </div>
              <div className="fa-command-card__signal">
                <GameAssetImage name="pitch_deck_terminal" sizes="100px" />
                <span><small>Capital signal</small><strong>Investor room unlocked</strong></span>
              </div>
            </div>
          </div>
        </section>

        <section id="run" className="fa-section fa-section--calm">
          <GameAssetImage name="arena_bg_calm" className="fa-scene-background" sizes="100vw" decorative />
          <div className="fa-scene-shade fa-scene-shade--heavy" aria-hidden="true" />
          <div className="fa-section__inner">
            <SectionIntro code="Operating brief / 01" title={<>One company. <em>Twelve weeks.</em></>} body="The run is compressed into four tactical phases. Finance remains monthly, but every Founder Week forces a new operating choice." />
            <div className="fa-phase-grid">
              {RUN_PHASES.map((phase) => (
                <article key={phase.week} className="fa-hud-panel">
                  <span>{phase.week}</span><h3>{phase.title}</h3><p>{phase.body}</p>
                </article>
              ))}
            </div>
            <div className="fa-onboarding-grid">
              {ONBOARDING_ASSETS.map((asset, index) => (
                <article key={asset} className="fa-onboarding-card">
                  <GameAssetImage name={asset} sizes="(max-width: 760px) 80vw, 380px" />
                  <div><small>{ONBOARDING_COPY[index].eyebrow}</small><h3>{ONBOARDING_COPY[index].title}</h3><p>{ONBOARDING_COPY[index].body}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="founders" className="fa-section">
          <div className="fa-section__inner">
            <SectionIntro code="Company creation / 02" title={<>Choose the thesis.<br /><em>Choose the founder.</em></>} body="Sector and founder style establish the identity of a run. They frame the opportunities and tradeoffs, but they do not replace execution." />
            <p className="fa-subhead">Eight sectors</p>
            <div className="fa-tile-grid fa-tile-grid--sectors">{SECTOR_ASSETS.map((name) => <AssetTile key={name} name={name} />)}</div>
            <p className="fa-subhead">Five founder styles</p>
            <div className="fa-founder-grid">{FOUNDER_ASSETS.map((name) => <AssetTile key={name} name={name} />)}</div>
          </div>
        </section>

        <section id="decisions" className="fa-section fa-section--surface">
          <div className="fa-section__inner">
            <SectionIntro code="Decision console / 03" title={<>Strategy has a cost.<br /><em>Pick what matters.</em></>} body="Queue up to three moves each Founder Week. Every benefit competes with cash, time, reputation, and the objective already on the board." />
            <div className="fa-decision-grid">
              {DECISION_ASSETS.map((name, index) => (
                <article key={name} className="fa-decision-card">
                  <span>0{index + 1}</span><GameAssetImage name={name} sizes="180px" />
                  <div><h3>{displayName(name)}</h3><p>{DECISION_COPY[name]}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pressure" className="fa-section fa-section--danger">
          <GameAssetImage name="arena_bg_danger" className="fa-scene-background" sizes="100vw" decorative />
          <div className="fa-scene-shade fa-scene-shade--danger" aria-hidden="true" />
          <div className="fa-section__inner">
            <SectionIntro code="Arena pressure / 04" title={<>The market moves.<br /><em>You still decide.</em></>} body="Events can accelerate the company or expose its weakest system. Investor pressure adds governance, milestones, bridge financing, and board conflict to the operating problem." />
            <p className="fa-subhead">Operating events</p>
            <AssetRail assets={EVENT_ASSETS} label="Founder Arena operating event artwork" />
            <p className="fa-subhead">Investor and board events</p>
            <AssetRail assets={INVESTOR_ASSETS} label="Founder Arena investor event artwork" />
          </div>
        </section>

        <section id="capital" className="fa-section">
          <div className="fa-section__inner">
            <SectionIntro code="Capital room / 05" title={<>Pitch the company.<br /><em>Defend the terms.</em></>} body="AI investor personas explain their reasoning, but deterministic systems remain authoritative for cash, dilution, valuation, and whether the company survives." />
            <div className="fa-capital-path">
              {FUNDING_ASSETS.map((name, index) => (
                <article key={name}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <GameAssetImage name={name} sizes="(max-width: 640px) 74vw, 280px" />
                  <h3>{displayName(name)}</h3>
                </article>
              ))}
            </div>
            <div className="fa-fairness-note">
              <strong>AI explains. Systems decide.</strong>
              <p>Investor feedback can critique, summarize, and coach. It never directly sets cash, burn, valuation, scoring, or the final outcome.</p>
            </div>
          </div>
        </section>

        <section id="outcomes" className="fa-section fa-section--surface">
          <div className="fa-section__inner">
            <SectionIntro code="Demo Day verdict / 06" title={<>Every run ends.<br /><em>The legacy continues.</em></>} body="The final state becomes part of the founder record. Outcomes are earned from the run’s actual metrics, decisions, capital structure, and survival." />
            <div className="fa-outcome-grid">
              {ENDING_ASSETS.map((name) => (
                <article key={name} className="fa-outcome-card">
                  <GameAssetImage name={name} sizes="(max-width: 760px) 80vw, 360px" />
                  <div><h3>{OUTCOME_COPY[name].title}</h3><p>{OUTCOME_COPY[name].body}</p></div>
                </article>
              ))}
            </div>
            <p className="fa-subhead">Founder legacy badges</p>
            <AssetRail assets={BADGE_ASSETS} label="Founder Arena achievement badges" />
          </div>
        </section>

        <section id="platforms" className="fa-platforms">
          <GameAssetImage name="arena_bg_calm" className="fa-scene-background" sizes="100vw" decorative />
          <div className="fa-scene-shade fa-scene-shade--heavy" aria-hidden="true" />
          <div className="fa-platforms__content">
            <GameAssetImage name="FounderArenaLogo" sizes="220px" />
            <p className="fa-kicker">Development status</p>
            <h2>The arena is<br /><em>going mobile.</em></h2>
            <p>Founder Arena is in development as a native game for iOS and Android. No public store listing or release date is available yet.</p>
            <div className="fa-platform-status">
              <div><small>iOS</small><strong>Private beta planned</strong></div>
              <div><small>Android</small><strong>Planned</strong></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fa-footer">
        <div><GameAssetImage name="SwarpGamesLogo" sizes="56px" /><span><strong>A Swarp Games production</strong><small>Founder Arena · mobile game in development</small></span></div>
        <nav aria-label="Footer navigation">{NAVIGATION.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
        <p>© {new Date().getFullYear()} Founder Arena</p>
      </footer>
    </div>
  );
}
