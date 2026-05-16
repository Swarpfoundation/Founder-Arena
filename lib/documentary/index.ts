export { generateDocumentary, selectTone, selectGenre, buildTitle, buildTagline, PLAYSTYLE_DISPLAY, displayPlaystyle, WIN_OUTCOMES, DEAD_OUTCOMES } from "./documentary-engine";
export { buildTimeline } from "./documentary-timeline";
export { buildShareCard } from "./documentary-share-card";
export type {
  FounderDocumentary,
  FounderDocumentaryChapter,
  DocumentaryTimelineMoment,
  DocumentaryHeroStats,
  DocumentaryShareCard,
  DocumentaryRivalSummary,
  DocumentarySocialSummary,
  DocumentaryStrategySummary,
  DocumentaryCareerImpactSummary,
  DocumentaryTone,
  DocumentaryGenre,
  ChapterCategory,
  TimelineImpact,
  TimelineSource,
  DocumentaryEngineInput,
  SimMonthSnap,
  FundingRoundSnap,
  SocialStateSnap,
  CareerSnapForDocumentary,
} from "./types";
