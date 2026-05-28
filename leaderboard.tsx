import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Platform, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatCoins } from "@/components/BalanceDisplay";
import { getXPProgress } from "@/constants/gameConfig";
import { type GameSession, useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const GAME_LABELS: Record<string, string> = {
  coinflip: "🪙 Coin Flip",
  dice:     "🎲 Dice",
  slots:    "🎰 Slots",
};

const MEDALS = ["🥇", "🥈", "🥉"];

interface LeaderRow {
  rank: number;
  session: GameSession;
}

export default function LeaderboardScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { history, stats, totalXP, balance, currentStreak, longestStreak } = useGame();

  const topPad    = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPad = (insets.bottom || 20) + 90;
  const { level, title } = getXPProgress(totalXP);

  const topWins: LeaderRow[] = useMemo(() => {
    return [...history]
      .filter((s) => s.net > 0)
      .sort((a, b) => b.net - a.net)
      .slice(0, 10)
      .map((s, i) => ({ rank: i + 1, session: s }));
  }, [history]);

  const winRate = stats.totalGames > 0
    ? Math.round((stats.gamesWon / stats.totalGames) * 100)
    : 0;

  const topGame = [
    { label: "Coin Flip", count: stats.coinflipGames },
    { label: "Dice",      count: stats.diceGames      },
    { label: "Slots",     count: stats.slotsGames     },
  ].sort((a, b) => b.count - a.count)[0];

  function timeAgo(ms: number): string {
    const diff = Date.now() - ms;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "just now";
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={["#12111C", colors.background]} style={styles.headerArea}>
        <Animated.View entering={FadeInDown.duration(350).springify()}>
          <Text style={[styles.screenTitle, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
            🏆 Leaderboard
          </Text>
          <Text style={[styles.screenSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
            Your personal best wins
          </Text>
        </Animated.View>

        {/* Player card */}
        <Animated.View entering={FadeInDown.duration(350).delay(60).springify()}>
          <View style={[styles.playerCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
            <LinearGradient colors={["#F5C84212", "#9B5DE512"]} style={StyleSheet.absoluteFill} />
            <View style={[styles.avatar, { backgroundColor: colors.goldMuted, borderColor: colors.goldBorder }]}>
              <Text style={styles.avatarEmoji}>🎰</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                You · Lvl {level}
              </Text>
              <Text style={[styles.playerTitle, { color: colors.gold, fontFamily: "Inter_500Medium" }]}>
                {title}
              </Text>
            </View>
            <View style={styles.balPill}>
              <Text style={[styles.balText, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
                ◉ {formatCoins(balance)}
              </Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Stats grid */}
        <Animated.View entering={FadeInDown.duration(350).delay(100).springify()} style={styles.statsGrid}>
          {[
            { label: "Win Rate",   value: `${winRate}%`,            sub: `${stats.gamesWon}/${stats.totalGames} games` },
            { label: "Best Win",   value: `+${formatCoins(stats.biggestWin)}`, sub: "single game" },
            { label: "Best Streak", value: `${longestStreak}`,       sub: "consecutive wins" },
            { label: "Wagered",    value: formatCoins(stats.totalWagered), sub: "total chips" },
          ].map((s, i) => (
            <View key={i} style={[styles.statCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statVal, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
                {s.label}
              </Text>
              <Text style={[styles.statSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                {s.sub}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Top wins */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
          TOP WINS
        </Text>

        {topWins.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(350).delay(160).springify()}>
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>🎲</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                No wins yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                Play games to record your best wins here
              </Text>
            </View>
          </Animated.View>
        ) : (
          topWins.map(({ rank, session }, i) => (
            <Animated.View
              key={session.id}
              entering={FadeInDown.duration(350).delay(160 + i * 50).springify()}
            >
              <View style={[styles.winRow, { backgroundColor: colors.card, borderColor: rank <= 3 ? colors.goldBorder : colors.border }]}>
                {rank <= 3
                  ? <Text style={styles.medal}>{MEDALS[rank - 1]}</Text>
                  : <View style={[styles.rankCircle, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[styles.rankNum, { color: colors.textTertiary, fontFamily: "Inter_700Bold" }]}>
                        {rank}
                      </Text>
                    </View>
                }
                <View style={styles.winMeta}>
                  <Text style={[styles.winGame, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                    {GAME_LABELS[session.game] ?? session.game}
                  </Text>
                  <Text style={[styles.winDetail, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                    {session.result} · bet {formatCoins(session.bet)} · {timeAgo(session.timestamp)}
                  </Text>
                </View>
                <View style={styles.winAmtCol}>
                  <Text style={[styles.winAmt, { color: colors.green, fontFamily: "Inter_700Bold" }]}>
                    +{formatCoins(session.net)}
                  </Text>
                  <Text style={[styles.winPayout, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                    {(session.payout / session.bet).toFixed(1)}× payout
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerArea: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  screenTitle: { fontSize: 26 },
  screenSub: { fontSize: 12, marginTop: 2 },
  playerCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 18, padding: 14, borderWidth: 1, overflow: "hidden",
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  avatarEmoji: { fontSize: 24 },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { fontSize: 15 },
  playerTitle: { fontSize: 12 },
  balPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  balText: { fontSize: 14 },
  body: { paddingHorizontal: 20, gap: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCell: {
    width: "47.5%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 2,
  },
  statVal: { fontSize: 22 },
  statLabel: { fontSize: 10, letterSpacing: 1 },
  statSub: { fontSize: 10 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.5, marginTop: 4 },
  emptyCard: {
    borderRadius: 18, borderWidth: 1, padding: 32, alignItems: "center", gap: 10,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 16 },
  emptySub: { fontSize: 13, textAlign: "center" },
  winRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 0,
  },
  medal: { fontSize: 24, width: 32, textAlign: "center" },
  rankCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  rankNum: { fontSize: 13 },
  winMeta: { flex: 1, gap: 2 },
  winGame: { fontSize: 13 },
  winDetail: { fontSize: 11 },
  winAmtCol: { alignItems: "flex-end", gap: 2 },
  winAmt: { fontSize: 18 },
  winPayout: { fontSize: 10 },
});
