import {
  OutcomeDeadIcon,
  OutcomeZombieIcon,
  OutcomeSmallProfitableIcon,
  OutcomeSeedReadyIcon,
  OutcomeSeriesAReadyIcon,
  OutcomeAcquisitionTargetIcon,
  OutcomeBreakoutIcon,
  OutcomeAcquiredIcon,
  OutcomeExitedIcon,
} from "@/components/assets";
import type { AssetProps } from "@/components/assets/base";
import type { ComponentType } from "react";

export type OutcomeIconComponent = ComponentType<AssetProps>;

const OUTCOME_ICON_MAP: Record<string, OutcomeIconComponent> = {
  "dead": OutcomeDeadIcon,
  "zombie": OutcomeZombieIcon,
  "small_profitable": OutcomeSmallProfitableIcon,
  "seed_ready": OutcomeSeedReadyIcon,
  "series_a_ready": OutcomeSeriesAReadyIcon,
  "acquisition_target": OutcomeAcquisitionTargetIcon,
  "breakout": OutcomeBreakoutIcon,
  "acquired": OutcomeAcquiredIcon,
  "exited": OutcomeExitedIcon,
  // UI-only fallback keys
  "strong": OutcomeBreakoutIcon,
  "moderate": OutcomeSmallProfitableIcon,
  "ipo": OutcomeExitedIcon,
  "survival": OutcomeSeedReadyIcon,
  "shutdown": OutcomeDeadIcon,
  "bankrupt": OutcomeDeadIcon,
};

export function getOutcomeIcon(outcome: string | null | undefined): OutcomeIconComponent {
  if (!outcome) return OutcomeDeadIcon;
  const key = outcome.toLowerCase().trim();
  return OUTCOME_ICON_MAP[key] ?? OutcomeDeadIcon;
}
