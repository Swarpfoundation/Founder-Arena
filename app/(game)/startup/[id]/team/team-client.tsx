"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { hireEmployeeAction, fireEmployeeAction, changeOfficeSetupAction } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Candidate } from "@/lib/team/types";
import { Employee } from "@prisma/client";
import { GameCard } from "@/components/game/GameCard";
import { SectionHeader } from "@/components/game/SectionHeader";
import { cn } from "@/lib/utils";
import { getTeamRoleIcon } from "@/lib/assets/team-icon-map";
import { getOfficeIcon } from "@/lib/assets/office-icon-map";
import { Users, Check, X, Target, AlertTriangle } from "lucide-react";

interface TeamClientProps {
  startupId: string;
  employees: Employee[];
  candidates: Candidate[];
  capacity: number;
  currentOffice: string;
}

function getSkillRating(seniority: string): number {
  return seniority === "senior" ? 90 : seniority === "mid" ? 75 : 60;
}

function getDeterministicMorale(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return 80 + (Math.abs(hash) % 16);
}

function getRatingColor(value: number): string {
  if (value >= 90) return "#34d399";
  if (value >= 75) return "#8b5cf6";
  if (value >= 60) return "#fbbf24";
  return "#f43f5e";
}

function RatingRing({ value, size = 48 }: { value: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = getRatingColor(value);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={3}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1 }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-white">{value}</span>
      </div>
    </div>
  );
}

export function TeamClient({ startupId, employees, candidates, capacity, currentOffice }: TeamClientProps) {
  const router = useRouter();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [fireConfirmId, setFireConfirmId] = useState<string | null>(null);
  const [showRecruit, setShowRecruit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeEmployees = employees.filter((e) => e.status === "active");

  async function handleHire(candidate: Candidate) {
    setIsLoading(true);
    setError(null);
    try {
      await hireEmployeeAction(startupId, candidate);
      setSelectedCandidate(null);
      setShowRecruit(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hire");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFire(employeeId: string) {
    setIsLoading(true);
    setError(null);
    try {
      await fireEmployeeAction(startupId, employeeId);
      setFireConfirmId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fire");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOfficeChange(setup: string) {
    setIsLoading(true);
    setError(null);
    try {
      await changeOfficeSetupAction(startupId, setup);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change office");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <GameCard glow="rose" className="mb-6 border-rose-500/30 bg-rose-500/10">
          <p className="text-sm text-rose-300 font-medium">{error}</p>
        </GameCard>
      )}

      {/* Active Crew */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Active Crew
          </h3>
          <motion.button
            className="px-4 py-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase hover:bg-cyan-500/20 transition-all"
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRecruit(!showRecruit)}
          >
            {showRecruit ? "Close" : "Recruit"}
          </motion.button>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {activeEmployees.map((member, i) => {
              const skill = getSkillRating(member.seniority);
              const morale = getDeterministicMorale(member.id);
              const RoleIcon = getTeamRoleIcon(member.role);
              return (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="game-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
                      <RoleIcon className="w-6 h-6 text-white" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white truncate">{member.name}</p>
                        <RatingRing value={skill} />
                      </div>
                      <p className="text-[10px] text-slate-500">{member.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-white/5 overflow-hidden">
                          <div
                            className={`h-full ${morale > 80 ? "bg-emerald-400" : "bg-amber-400"}`}
                            style={{ width: `${morale}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">{morale}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">${member.salary.toLocaleString()}/mo</p>
                    </div>
                    <motion.button
                      className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0"
                      whileTap={{ scale: 0.8 }}
                      onClick={() => setFireConfirmId(member.id)}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Mission Hiring Hint */}
      {candidates.some((c) => c.missionRelevance === "critical") && (
        <GameCard className="mb-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Target className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-400">Mission-Critical Hiring</h4>
              <p className="text-xs text-amber-400/70 mt-1">
                Some candidates match roles required for your active mission. Prioritize these hires to unlock mission progress.
              </p>
            </div>
          </div>
        </GameCard>
      )}

      {/* Recruits */}
      <AnimatePresence>
        {showRecruit && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <h3 className="text-sm font-bold text-emerald-400 mb-3 tracking-wider uppercase flex items-center gap-2">
              <Users className="w-4 h-4" />
              Available Recruits
            </h3>
            {capacity <= 0 ? (
              <GameCard className="p-4">
                <p className="text-sm text-slate-500">At maximum team capacity. Consider upgrading your office or waiting for funding.</p>
              </GameCard>
            ) : candidates.length === 0 ? (
              <GameCard className="p-4">
                <p className="text-sm text-slate-500">No candidates available this month.</p>
              </GameCard>
            ) : (
              <div className="space-y-2">
                {candidates.map((recruit, i) => {
                  const skill = getSkillRating(recruit.seniority);
                  const RoleIcon = getTeamRoleIcon(recruit.role);
                  return (
                    <motion.div
                      key={recruit.id}
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "game-card p-4",
                        recruit.missionRelevance === "critical" && "border-amber-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                            <RoleIcon className="w-6 h-6 text-white" size={24} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white truncate">{recruit.name}</p>
                              {recruit.missionRelevance === "critical" && (
                                <span className="inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9px] text-amber-400 border-amber-500/20 bg-amber-500/10 font-bold uppercase tracking-wider">
                                  <Target className="w-3 h-3" />
                                  Mission
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {recruit.role} -- Skill: <span className="text-cyan-400 font-bold">{skill}</span>
                            </p>
                            <p className="text-[10px] text-slate-500">
                              ${recruit.salary.toLocaleString()}/mo
                              {recruit.monthlyBurn && recruit.monthlyBurn !== recruit.salary && (
                                <span className="text-rose-400/80 ml-1">(all-in ${recruit.monthlyBurn.toLocaleString()}/mo)</span>
                              )}
                            </p>
                            {recruit.runwayAfter !== undefined && recruit.runwayAfter < 6 && (
                              <p className="text-[10px] text-rose-400/80 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Runway drops to {recruit.runwayAfter}mo
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <RatingRing value={skill} size={40} />
                          <motion.button
                            className="px-4 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wider uppercase hover:bg-emerald-500/20 transition-all"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCandidate(recruit)}
                          >
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" /> Hire
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Office Setup Selector */}
      <GameCard className="mb-8">
        <SectionHeader title="Office Setup" subtitle="Change your workspace arrangement" className="mb-4" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { type: "remote", label: "Remote First", cost: 0, desc: "Zero office cost. Slightly lower morale and productivity." },
            { type: "coworking", label: "Coworking Space", cost: 3000, desc: "Moderate cost. Boosts morale and productivity." },
            { type: "small_office", label: "Small Office", cost: 8000, desc: "Higher cost. Stronger productivity and team cohesion." },
            { type: "premium_office", label: "Premium Office", cost: 20000, desc: "Very high cost. Strong investor signal but dangerous burn." },
          ].map((office) => {
            const isSelected = currentOffice === office.type;
            return (
              <button
                key={office.type}
                onClick={() => handleOfficeChange(office.type)}
                disabled={isLoading || isSelected}
                className="text-left"
              >
                <GameCard
                  glow={isSelected ? "cyan" : false}
                  variant={isSelected ? "solid" : "subtle"}
                  className={cn(
                    "p-4 transition-all",
                    !isSelected && !isLoading && "hover:glow-violet"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {(() => {
                      const OfficeIcon = getOfficeIcon(office.type);
                      return <OfficeIcon className="w-5 h-5 text-cyan-400" size={20} />;
                    })()}
                    <div className="font-medium text-foreground">{office.label}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">${office.cost.toLocaleString()}/mo</div>
                  <div className="text-xs text-muted-foreground mt-2">{office.desc}</div>
                  {isSelected && (
                    <Badge className="mt-2" variant="default">Current</Badge>
                  )}
                </GameCard>
              </button>
            );
          })}
        </div>
      </GameCard>

      {/* Hire Dialog */}
      <Dialog open={selectedCandidate !== null} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-md bg-[#0a0f1e] border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Hire {selectedCandidate?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedCandidate?.role} ({selectedCandidate?.seniority})
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salary</span>
                <span className="font-medium">${selectedCandidate.salary.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skill Rating</span>
                <span className="font-medium">{getSkillRating(selectedCandidate.seniority)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Morale Impact</span>
                <span className="font-medium">{selectedCandidate.moraleImpact > 0 ? "+" : ""}{selectedCandidate.moraleImpact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product Impact</span>
                <span className="font-medium">{selectedCandidate.productImpact > 0 ? "+" : ""}{selectedCandidate.productImpact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue Impact</span>
                <span className="font-medium">{selectedCandidate.revenueImpact > 0 ? "+" : ""}{selectedCandidate.revenueImpact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Impact</span>
                <span className="font-medium">{selectedCandidate.riskImpact > 0 ? "+" : ""}{selectedCandidate.riskImpact}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t border-white/10">{selectedCandidate.bio}</p>
              {selectedCandidate.warning && (
                <p className="text-xs text-amber-400">{selectedCandidate.warning}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setSelectedCandidate(null)}>Cancel</Button>
            <Button onClick={() => selectedCandidate && handleHire(selectedCandidate)} disabled={isLoading}>
              {isLoading ? "Hiring..." : "Confirm Hire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fire Confirm Dialog */}
      <Dialog open={fireConfirmId !== null} onOpenChange={() => setFireConfirmId(null)}>
        <DialogContent className="max-w-sm bg-[#0a0f1e] border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Termination</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to fire this employee? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setFireConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => fireConfirmId && handleFire(fireConfirmId)} disabled={isLoading}>
              {isLoading ? "Processing..." : "Fire Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
