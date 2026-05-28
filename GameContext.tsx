import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from "react";

import {
  calculateXP, DAILY_REWARD_MS, getDailyBonus, STARTING_BALANCE,
} from "@/constants/gameConfig";

export type GameType = "coinflip" | "dice" | "slots";

export interface GameSession {
  id: string;
  game: GameType;
  bet: number;
  payout: number;
  net: number;
  result: string;
  timestamp: number;
}

export interface GameStats {
  totalGames: number;
  gamesWon: number;
  gamesLost: number;
  totalWagered: number;
  netWon: number;       // positive = profit, negative = loss
  biggestWin: number;
  biggestLoss: number;
  coinflipGames: number;
  diceGames: number;
  slotsGames: number;
}

export interface GameState {
  balance: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  stats: GameStats;
  history: GameSession[];
  lastDailyReward: number;    // timestamp
  consecutiveDailyDays: number;
}

const DEFAULT_STATS: GameStats = {
  totalGames: 0, gamesWon: 0, gamesLost: 0,
  totalWagered: 0, netWon: 0, biggestWin: 0, biggestLoss: 0,
  coinflipGames: 0, diceGames: 0, slotsGames: 0,
};

const DEFAULT: GameState = {
  balance: STARTING_BALANCE, totalXP: 0,
  currentStreak: 0, longestStreak: 0,
  stats: DEFAULT_STATS, history: [],
  lastDailyReward: 0, consecutiveDailyDays: 0,
};

interface Ctx {
  balance: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  stats: GameStats;
  history: GameSession[];
  canClaimDaily: boolean;
  dailyTimeLeft: number;
  consecutiveDailyDays: number;
  placeBet: (game: GameType, bet: number, payout: number, result: string) => Promise<void>;
  claimDailyReward: () => Promise<void>;
  resetProgress: () => Promise<void>;
  isLoading: boolean;
}

const GameContext = createContext<Ctx | null>(null);
const KEY = "@lucky_casino_v2";

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) { try { setState(JSON.parse(raw)); } catch {} }
      setIsLoading(false);
    });
  }, []);

  const save = useCallback((s: GameState) => AsyncStorage.setItem(KEY, JSON.stringify(s)), []);

  const placeBet = useCallback(async (
    game: GameType, bet: number, payout: number, result: string
  ) => {
    setState((prev) => {
      const net = payout - bet;
      const won = net > 0;
      const newStreak = won ? prev.currentStreak + 1 : 0;
      const xpEarned = calculateXP(bet, won, newStreak);
      const session: GameSession = { id: uid(), game, bet, payout, net, result, timestamp: Date.now() };
      const next: GameState = {
        ...prev,
        balance: Math.max(0, prev.balance - bet + payout),
        totalXP: prev.totalXP + xpEarned,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        history: [session, ...prev.history].slice(0, 100),
        stats: {
          ...prev.stats,
          totalGames: prev.stats.totalGames + 1,
          gamesWon:   prev.stats.gamesWon   + (won ? 1 : 0),
          gamesLost:  prev.stats.gamesLost  + (won ? 0 : 1),
          totalWagered: prev.stats.totalWagered + bet,
          netWon: prev.stats.netWon + net,
          biggestWin:  won ? Math.max(prev.stats.biggestWin, net) : prev.stats.biggestWin,
          biggestLoss: !won ? Math.max(prev.stats.biggestLoss, bet) : prev.stats.biggestLoss,
          coinflipGames: prev.stats.coinflipGames + (game === "coinflip" ? 1 : 0),
          diceGames:     prev.stats.diceGames     + (game === "dice"     ? 1 : 0),
          slotsGames:    prev.stats.slotsGames    + (game === "slots"    ? 1 : 0),
        },
      };
      save(next);
      return next;
    });
  }, [save]);

  const claimDailyReward = useCallback(async () => {
    setState((prev) => {
      const lastMs = prev.lastDailyReward;
      const sinceLastMs = Date.now() - lastMs;
      const isConsecutive = sinceLastMs < DAILY_REWARD_MS * 2;
      const newDays = isConsecutive ? prev.consecutiveDailyDays + 1 : 1;
      const bonus = getDailyBonus(newDays);
      const next: GameState = {
        ...prev,
        balance: prev.balance + bonus,
        lastDailyReward: Date.now(),
        consecutiveDailyDays: newDays,
      };
      save(next);
      return next;
    });
  }, [save]);

  const resetProgress = useCallback(async () => {
    setState(DEFAULT);
    await save(DEFAULT);
  }, [save]);

  const canClaimDaily = now - state.lastDailyReward >= DAILY_REWARD_MS;
  const dailyTimeLeft = Math.max(0, DAILY_REWARD_MS - (now - state.lastDailyReward));

  return (
    <GameContext.Provider value={{
      balance: state.balance, totalXP: state.totalXP,
      currentStreak: state.currentStreak, longestStreak: state.longestStreak,
      stats: state.stats, history: state.history,
      canClaimDaily, dailyTimeLeft, consecutiveDailyDays: state.consecutiveDailyDays,
      placeBet, claimDailyReward, resetProgress, isLoading,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be within GameProvider");
  return ctx;
}
