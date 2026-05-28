import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BalanceDisplay, formatCoins } from "@/components/BalanceDisplay";
import { XPBar } from "@/components/XPBar";
import { getXPProgress, STARTING_BALANCE } from "@/constants/gameConfig";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const {
    balance, totalXP, stats, currentStreak,
    longestStreak, resetProgress, consecutiveDailyDays,
  } = useGame();

  const topPad    = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPad = (insets.bottom || 20) + 90;

  const [soundOn,    setSoundOn]    = useState(true);
  const [hapticsOn,  setHapticsOn]  = useState(true);

  const { level, title, currentXP, requiredXP } = getXPProgress(totalXP);
  const winRate = stats.totalGames > 0
    ? Math.round((stats.gamesWon / stats.totalGames) * 100)
    : 0;
  const profitLoss = stats.netWon;
  const profitPos  = profitLoss >= 0;

  const favGame = [
    { label: "Coin Flip 🪙", count: stats.coinflipGames },
    { label: "Dice 🎲",       count: stats.diceGames      },
    { label: "Slots 🎰",      count: stats.slotsGames     },
  ].sort((a, b) => b.count - a.count)[0];

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Reset All Progress",
      `Balance resets to ${formatCoins(STARTING_BALANCE)} coins · XP, stats & history wiped.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetProgress();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={["#12111C", colors.background]} style={styles.headerArea}>
        <Animated.View entering={FadeInDown.duration(350).springify()} style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: colors.goldBorder }]}>
            <View style={[styles.avatar, { backgroundColor: colors.goldMuted }]}>
              <Text style={styles.avatarEmoji}>🎰</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: colors.gold }]}>
              <Text style={[styles.levelBadgeTxt, { fontFamily: "Inter_700Bold" }]}>{level}</Text>
            </View>
          </View>
          <View style={styles.identityCol}>
            <Text style={[styles.rankTitle, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
              {title}
            </Text>
            <Text style={[styles.xpHint, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
              {currentXP} / {requiredXP} XP  ·  Level {level + 1} next
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(50).springify()}>
          <XPBar totalXP={totalXP} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(80).springify()} style={styles.balRow}>
          <BalanceDisplay balance={balance} size="lg" />
        </Animated.View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Stats grid */}
        <Animated.View entering={FadeInDown.duration(350).delay(110).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            STATISTICS
          </Text>
          <View style={styles.statsGrid}>
            {[
              { icon: "activity",    label: "Games",       value: String(stats.totalGames)    },
              { icon: "trending-up", label: "Win Rate",    value: `${winRate}%`               },
              { icon: "award",       label: "Best Win",    value: `+${formatCoins(stats.biggestWin)}` },
              { icon: "zap",         label: "Best Streak", value: `${longestStreak}×`         },
              {
                icon: "dollar-sign",
                label: "Net P/L",
                value: (profitPos ? "+" : "") + formatCoins(profitLoss),
                color: profitPos ? colors.green : colors.red,
              },
              { icon: "star", label: "Fav Game", value: favGame?.label ?? "—" },
            ].map((s, i) => (
              <View key={i} style={[styles.statCell, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={s.icon as any} size={16} color={s.color ?? colors.gold} />
                <Text style={[styles.statVal, { color: s.color ?? colors.text, fontFamily: "Inter_700Bold" }]}>
                  {s.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Game breakdown */}
        <Animated.View entering={FadeInDown.duration(350).delay(160).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            GAME BREAKDOWN
          </Text>
          <View style={[styles.breakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { emoji: "🪙", label: "Coin Flip", count: stats.coinflipGames, color: "#00D4FF"     },
              { emoji: "🎲", label: "Dice",       count: stats.diceGames,     color: colors.purple },
              { emoji: "🎰", label: "Slots",      count: stats.slotsGames,    color: colors.gold   },
            ].map((g, i) => {
              const pct = stats.totalGames > 0 ? g.count / stats.totalGames : 0;
              return (
                <View key={g.label} style={[styles.gameRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                  <Text style={styles.gameEmoji}>{g.emoji}</Text>
                  <View style={styles.gameInfo}>
                    <View style={styles.gameTopRow}>
                      <Text style={[styles.gameLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                        {g.label}
                      </Text>
                      <Text style={[styles.gameCount, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                        {g.count} games
                      </Text>
                    </View>
                    <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniBarFill, { width: `${pct * 100}%` as any, backgroundColor: g.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Daily streak */}
        <Animated.View entering={FadeInDown.duration(350).delay(200).springify()}>
          <View style={[styles.bonusCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
            <LinearGradient colors={["#F5C84210", "#9B5DE510"]} style={StyleSheet.absoluteFill} />
            <Text style={styles.bonusEmoji}>📆</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.bonusTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                Daily Login Streak
              </Text>
              <Text style={[styles.bonusSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                {consecutiveDailyDays} day{consecutiveDailyDays !== 1 ? "s" : ""} in a row · bonus grows each day
              </Text>
            </View>
            <Text style={styles.flameText}>
              {consecutiveDailyDays >= 7 ? "🔥🔥" : consecutiveDailyDays >= 3 ? "🔥" : "⭐"}
            </Text>
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.duration(350).delay(240).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            SETTINGS
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: "volume-2",   label: "Sound Effects",    sub: "Game audio",           value: soundOn,   set: setSoundOn   },
              { icon: "smartphone", label: "Haptic Feedback",  sub: "Vibration on actions", value: hapticsOn, set: setHapticsOn },
            ].map((row, i) => (
              <View key={row.label} style={[styles.settingsRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <Feather name={row.icon as any} size={16} color={colors.gold} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.settingsLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.settingsSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                    {row.sub}
                  </Text>
                </View>
                <Switch
                  value={row.value}
                  onValueChange={row.set}
                  trackColor={{ false: colors.border, true: colors.gold + "60" }}
                  thumbColor={row.value ? colors.gold : colors.textTertiary}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Reset */}
        <Animated.View entering={FadeInDown.duration(350).delay(280).springify()}>
          <View style={[styles.dangerCard, { backgroundColor: colors.redMuted, borderColor: colors.red + "40" }]}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.dangerTitle, { color: colors.red, fontFamily: "Inter_600SemiBold" }]}>
                Reset All Progress
              </Text>
              <Text style={[styles.dangerSub, { color: colors.red + "A0", fontFamily: "Inter_400Regular" }]}>
                Chips reset · XP &amp; history cleared
              </Text>
            </View>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.dangerBtn, { backgroundColor: colors.red, opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="trash-2" size={14} color="#FFF" />
              <Text style={[styles.dangerBtnTxt, { fontFamily: "Inter_600SemiBold" }]}>Reset</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Text style={[styles.footer, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
          Lucky Casino · For entertainment only{"\n"}No real money · No real prizes
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerArea: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  avatarSection: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarRing: {
    borderWidth: 2, borderRadius: 38, width: 72, height: 72,
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 30 },
  levelBadge: {
    position: "absolute", bottom: -4, right: -4,
    width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  levelBadgeTxt: { fontSize: 11, color: "#07070F" },
  identityCol: { gap: 4 },
  rankTitle: { fontSize: 20 },
  xpHint: { fontSize: 11 },
  balRow: { alignItems: "center" },
  body: { paddingHorizontal: 20, gap: 16 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.5, marginBottom: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCell: {
    width: "30.5%", borderRadius: 14, padding: 12, borderWidth: 1,
    alignItems: "center", gap: 4,
  },
  statVal: { fontSize: 16, textAlign: "center" },
  statLabel: { fontSize: 10, textAlign: "center" },
  breakCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  gameRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  gameEmoji: { fontSize: 22 },
  gameInfo: { flex: 1, gap: 6 },
  gameTopRow: { flexDirection: "row", justifyContent: "space-between" },
  gameLabel: { fontSize: 14 },
  gameCount: { fontSize: 12 },
  miniBarBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 2 },
  bonusCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 18, borderWidth: 1, padding: 16, overflow: "hidden",
  },
  bonusEmoji: { fontSize: 28 },
  bonusTitle: { fontSize: 14 },
  bonusSub: { fontSize: 12 },
  flameText: { fontSize: 22 },
  settingsCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingsLabel: { fontSize: 14 },
  settingsSub: { fontSize: 11 },
  dangerCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 18, borderWidth: 1, padding: 16,
  },
  dangerTitle: { fontSize: 14 },
  dangerSub: { fontSize: 11 },
  dangerBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
  },
  dangerBtnTxt: { color: "#FFF", fontSize: 13 },
  footer: { textAlign: "center", fontSize: 11, lineHeight: 18, marginTop: 4 },
});
