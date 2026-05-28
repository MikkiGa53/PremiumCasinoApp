export const STARTING_BALANCE = 1000;
export const DAILY_REWARD_BASE = 500;
export const DAILY_REWARD_MS = 24 * 60 * 60 * 1000;
export const BET_PRESETS = [10, 25, 50, 100, 250, 500];
export const MIN_BET = 10;

// ── Slot symbols ────────────────────────────────────────
export interface SlotSymbol {
  id: string;
  char: string;
  color: string;
  payout3: number;
  weight: number;
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: "seven",   char: "7",  color: "#F5C842", payout3: 15, weight: 1  },
  { id: "diamond", char: "◆",  color: "#00D4FF", payout3: 10, weight: 2  },
  { id: "star",    char: "★",  color: "#FFD700", payout3: 7,  weight: 4  },
  { id: "heart",   char: "♥",  color: "#FF3B5C", payout3: 5,  weight: 6  },
  { id: "clover",  char: "♣",  color: "#00D166", payout3: 4,  weight: 8  },
  { id: "coin",    char: "◉",  color: "#FF9500", payout3: 3,  weight: 10 },
  { id: "gem",     char: "▲",  color: "#9B5DE5", payout3: 2,  weight: 14 },
];

const SLOT_TOTAL = SLOT_SYMBOLS.reduce((s, x) => s + x.weight, 0);

export function randomSlotSymbol(): SlotSymbol {
  let r = Math.random() * SLOT_TOTAL;
  for (const s of SLOT_SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

export function evalSlots(reels: SlotSymbol[]): { multiplier: number; label: string } {
  if (reels[0].id === reels[1].id && reels[1].id === reels[2].id)
    return { multiplier: reels[0].payout3, label: `3× ${reels[0].char} — JACKPOT!` };
  const ids = reels.map((r) => r.id);
  if (ids[0] === ids[1] || ids[1] === ids[2] || ids[0] === ids[2])
    return { multiplier: 1.5, label: "Pair — small win!" };
  return { multiplier: 0, label: "No match" };
}

// ── Dice ────────────────────────────────────────────────
export const DICE_BETS = [
  { id: "low",  label: "Low  1–3",   multiplier: 2 },
  { id: "high", label: "High 4–6",   multiplier: 2 },
  { id: "1",    label: "Exactly  1", multiplier: 5 },
  { id: "2",    label: "Exactly  2", multiplier: 5 },
  { id: "3",    label: "Exactly  3", multiplier: 5 },
  { id: "4",    label: "Exactly  4", multiplier: 5 },
  { id: "5",    label: "Exactly  5", multiplier: 5 },
  { id: "6",    label: "Exactly  6", multiplier: 5 },
];

export function evalDice(roll: number, betId: string): boolean {
  if (betId === "low")  return roll <= 3;
  if (betId === "high") return roll >= 4;
  return roll === parseInt(betId, 10);
}

// Dot positions on 3×3 grid (index 0–8) for each face value
export const DICE_DOTS: number[][] = [
  [],
  [4],
  [2, 6],
  [2, 4, 6],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 3, 6, 2, 5, 8],
];

// ── XP / Levels ─────────────────────────────────────────
export const LEVEL_TITLES: Record<number, string> = {
  1: "Rookie",  6: "Amateur", 11: "Regular", 16: "Hustler",
  21: "Pro", 26: "Shark", 31: "High Roller", 41: "VIP",
  46: "Elite", 50: "Casino King",
};

export function getLevelTitle(level: number): string {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (level >= k) return LEVEL_TITLES[k];
  }
  return "Rookie";
}

export function getXPProgress(totalXP: number): {
  level: number; currentXP: number; requiredXP: number; title: string;
} {
  let level = 1, remaining = totalXP;
  while (remaining >= level * 100 && level < 50) {
    remaining -= level * 100;
    level++;
  }
  return { level, currentXP: remaining, requiredXP: level * 100, title: getLevelTitle(level) };
}

export function calculateXP(bet: number, won: boolean, streak: number): number {
  const base = Math.max(1, Math.floor(bet / 10));
  const winBonus = won ? 2 : 1;
  const streakBonus = streak >= 5 ? 1.5 : streak >= 3 ? 1.25 : 1;
  return Math.round(base * winBonus * streakBonus);
}

export function getDailyBonus(consecutiveDays: number): number {
  // Increases 10% per consecutive day, caps at 3×
  const mult = Math.min(3, 1 + consecutiveDays * 0.1);
  return Math.round(DAILY_REWARD_BASE * mult);
}
