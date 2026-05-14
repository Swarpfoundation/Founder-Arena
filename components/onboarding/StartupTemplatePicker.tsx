"use client";

import { useState } from "react";
import { STARTUP_TEMPLATES, StartupTemplate, getFundingAskGuidance } from "@/lib/onboarding/startup-templates";
import { Lightbulb, Rocket, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface StartupTemplatePickerProps {
  onSelect: (template: StartupTemplate) => void;
  selectedId?: string;
}

export function StartupTemplatePicker({ onSelect, selectedId }: StartupTemplatePickerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white tracking-wider">STARTUP TEMPLATES</h3>
        <span className="text-xs text-white/40">— pick one to pre-fill your idea</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {STARTUP_TEMPLATES.map((template) => {
          const isSelected = selectedId === template.id;
          const isExpanded = expandedId === template.id;

          return (
            <div key={template.id} className="relative">
              <div
                className={`relative p-4 border cursor-pointer transition-all ${
                  isSelected
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                }`}
                onClick={() => onSelect(template)}
              >
                <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-current opacity-40" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-current opacity-40" />

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white truncate">
                        {template.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/60">
                        {template.sector}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 w-5 h-5 bg-cyan-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : template.id);
                  }}
                  className="mt-3 flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> LESS
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> MORE
                    </>
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-2 p-4 border border-white/10 bg-black/40">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-white/40">Problem</span>
                      <p className="text-white/80 mt-0.5">{template.problem}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-white/40">Solution</span>
                      <p className="text-white/80 mt-0.5">{template.solution}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/40">Ask</span>
                        <p className="text-white/80 mt-0.5">${template.fundingAsk.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/40">Region</span>
                        <p className="text-white/80 mt-0.5">{template.region}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 border border-amber-500/20 bg-amber-500/10 p-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300/80">{template.riskNote}</p>
                    </div>
                    <div className="flex items-start gap-2 border border-violet-500/20 bg-violet-500/10 p-2">
                      <Rocket className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-violet-300/80">{template.whyInteresting}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedId && (
        <div className="text-xs text-cyan-400/60">
          {getFundingAskGuidance(STARTUP_TEMPLATES.find((t) => t.id === selectedId)?.sector ?? "")}
        </div>
      )}
    </div>
  );
}
