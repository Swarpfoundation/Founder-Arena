import { SimulationEvent, EventChoice, EventEffect, EventStateContext, ResolvedEvent } from "./types";
import { getEventById } from "./event-library";
import { getAvailableChoices } from "./event-selection";

export interface EventValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate that a choice is valid for a given event and state */
export function validateEventChoice(
  eventId: string,
  choiceId: string,
  ctx: EventStateContext
): EventValidationResult {
  const event = getEventById(eventId);
  if (!event) {
    return { valid: false, error: "Event not found" };
  }

  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    return { valid: false, error: "Choice not found for this event" };
  }

  const available = getAvailableChoices(event, ctx);
  if (!available.some((c) => c.id === choiceId)) {
    return { valid: false, error: "Choice is not available in your current state" };
  }

  return { valid: true };
}

/** Resolve an event choice into a ResolvedEvent record */
export function resolveEventChoice(
  event: SimulationEvent,
  choice: EventChoice,
  aiNarrative?: string,
  aiCoaching?: string
): ResolvedEvent {
  return {
    eventId: event.id,
    title: event.title,
    category: event.category,
    severity: event.severity,
    selectedChoiceId: choice.id,
    selectedChoiceLabel: choice.label,
    effects: choice.effects,
    narrative: event.narrative,
    aiNarrative,
    aiCoaching,
  };
}

/** Convert ResolvedEvent to a plain JSON object for Prisma metadata storage */
export function resolvedEventToJson(resolved: ResolvedEvent): Record<string, unknown> {
  return {
    eventId: resolved.eventId,
    title: resolved.title,
    category: resolved.category,
    severity: resolved.severity,
    selectedChoiceId: resolved.selectedChoiceId,
    selectedChoiceLabel: resolved.selectedChoiceLabel,
    effects: resolved.effects,
    narrative: resolved.narrative,
    aiNarrative: resolved.aiNarrative,
    aiCoaching: resolved.aiCoaching,
  };
}

/** Parse a ResolvedEvent from JSON stored in metadata */
export function resolvedEventFromJson(json: Record<string, unknown>): ResolvedEvent | null {
  if (!json.eventId || !json.selectedChoiceId) return null;
  return {
    eventId: String(json.eventId),
    title: String(json.title ?? ""),
    category: String(json.category ?? "operational") as ResolvedEvent["category"],
    severity: String(json.severity ?? "minor") as ResolvedEvent["severity"],
    selectedChoiceId: String(json.selectedChoiceId),
    selectedChoiceLabel: String(json.selectedChoiceLabel ?? ""),
    effects: (json.effects ?? {}) as EventEffect,
    narrative: String(json.narrative ?? ""),
    aiNarrative: json.aiNarrative ? String(json.aiNarrative) : undefined,
    aiCoaching: json.aiCoaching ? String(json.aiCoaching) : undefined,
  };
}
