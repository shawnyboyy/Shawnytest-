const LEVEL_LABELS: Record<string, string> = {
  WARMUP: "Warm-Up",
  REAL_TALK: "Real Talk",
  GO_DEEP: "Go Deep",
  CURVEBALL: "Curveball",
};

export function levelLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level;
}

export function partnerLabel(partner: "A" | "B"): string {
  return partner === "A" ? "Partner A" : "Partner B";
}
