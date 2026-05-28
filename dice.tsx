import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BalanceDisplay } from "@/components/BalanceDisplay";
import { BetControls } from "@/components/BetControls";
import { WinOverlay } from "@/components/WinOverlay";
import { DICE_BETS, DICE_DOTS, evalDice, MIN_BET } from "@/constants/gameConfig";
import { useGame } from "@/context/GameContext";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useColors } from "@/hooks/useColors";

function DiceFace({ value, size = 110 }: { value: number; size?: number }) {
  const colors = useColors();
  if (value < 1 || value > 6) return null;
  const dots = DICE_DOTS[value] ?? [];
  const cell = size / 3;
  const dot  = cell * 0.38;

  return (
    <View style={{ width: size, height: size, flexDirection: "row", flexWrap: "wrap" }}>
      {Array.from({ length: 9 }, (_, i) => (
        <View key={i} style={{ width: cell, height: cell, alignItems: "center", justifyContent: "center" }}>
          {dots.includes(i) && (
            <View style={{
              width: dot, height: dot, borderRadius: dot / 2,
              backgroundColor: colors.gold,
              shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8, shadowRadius: 4,
            }} />
          )}
        </View>
      ))}
    </View>
  );
}

export default function DiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, placeBet, currentStreak } = useGame();
  const sounds = useSoundEffects();

  const [betId, setBetId] = useState("high");
  const [bet, setBet] = useState(MIN_BET);
  const [roll, setRoll] = useState(6);
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState<{ won: boolean; amount: number; label: string } | null>(null);

  const diceX     = useSharedValue(0);
  const diceRot   = useSharedValue(0);
  const diceScale = useSharedValue(1);

  const topPad    = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPad = (insets.bottom || 20) + 90;

  function shakeAndRoll(onDone: () => void) {
    diceScale.value = withTiming(1.12, { duration: 120 });
    diceX.value = withSequence(
      withTiming(-14, { duration: 55 }),
      withRepeat(withTiming(14, { duration: 55 }), 9, true),
      withTiming(0, { duration: 55 }, () => {
        diceScale.value = withSpring(1, { damping: 10 });
        runOnJS(onDone)();
      }),
    );
    diceRot.value = withSequence(
      withTiming(-18, { duration: 55 }),
      withRepeat(withTiming(18, { duration: 55 }), 9, true),
      withTiming(0, { duration: 55 }),
    );
  }

  function handleRoll() {
    if (balance < bet || busy) return;
    setBusy(true);
    setOverlay(null);
    sounds.playRoll();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const result = Math.floor(Math.random() * 6) + 1;
    const betCfg = DICE_BETS.find((b) => b.id === betId)!;
    const won    = evalDice(result, betId);

    shakeAndRoll(async () => {
      setRoll(result);
      await new Promise((r) => setTimeout(r, 200));
      const payout = won ? Math.round(bet * betCfg.multiplier) : 0;
      await placeBet("dice", bet, payout, `Rolled ${result}`);
      if (won) { sounds.playWin(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      else sounds.playLose();
      setOverlay({
        won,
        amount: won ? payout - bet : bet,
        label: `Rolled ${result} · ${betCfg.label}`,
      });
      setBusy(false);
    });
  }

  const diceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: diceX.value },
      { rotate: `${diceRot.value}deg` },
      { scale: diceScale.value },
    ],
  }));

  const selectedBet = DICE_BETS.find((b) => b.id === betId)!;
  const topBets  = DICE_BETS.slice(0, 2);
  const exactBets = DICE_BETS.slice(2);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad, paddingHorizontal: 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              🎲 Dice Roll
            </Text>
            <Text style={[styles.screenSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
              High/Low 2× · Exact 5×
            </Text>
          </View>
          <BalanceDisplay balance={balance} size="sm" />
        </View>

        {/* Streak */}
        {currentStreak >= 2 && (
          <View style={[styles.streakBanner, { backgroundColor: colors.red + "18", borderColor: colors.red + "40" }]}>
            <Text style={[styles.streakText, { color: colors.red, fontFamily: "Inter_600SemiBold" }]}>
              🔥 {currentStreak} win streak!
            </Text>
          </View>
        )}

        {/* Dice */}
        <View style={styles.diceArea}>
          <Animated.View style={[styles.diceCard, { backgroundColor: colors.card, borderColor: colors.purple + "60", shadowColor: colors.purple }, diceStyle]}>
            <DiceFace value={roll} />
          </Animated.View>
          <Text style={[styles.rollNum, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
            {busy ? "Rolling…" : `Last: ${roll}`}
          </Text>
        </View>

        {/* High / Low */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            BET TYPE
          </Text>
          <View style={styles.betRow}>
            {topBets.map((b) => {
              const active = betId === b.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => { if (!busy) { setBetId(b.id); Haptics.selectionAsync(); } }}
                  style={[
                    styles.betTypeBtn,
                    {
                      backgroundColor: active ? colors.purple + "25" : colors.surfaceVariant,
                      borderColor: active ? colors.purple : colors.border,
                      flex: 1,
                    },
                  ]}
                >
                  <Text style={[styles.betTypeTxt, { color: active ? colors.purple : colors.textSecondary, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" }]}>
                    {b.label}
                  </Text>
                  <Text style={[styles.betTypeMult, { color: active ? colors.gold : colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
                    {b.multiplier}× win
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.cardLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold", marginTop: 4 }]}>
            EXACT NUMBER (5×)
          </Text>
          <View style={styles.exactRow}>
            {exactBets.map((b) => {
              const active = betId === b.id;
              const n = parseInt(b.id, 10);
              return (
                <Pressable
                  key={b.id}
                  onPress={() => { if (!busy) { setBetId(b.id); Haptics.selectionAsync(); } }}
                  style={[
                    styles.numBtn,
                    {
                      backgroundColor: active ? colors.gold : colors.surfaceVariant,
                      borderColor: active ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.numBtnTxt, { color: active ? "#07070F" : colors.textSecondary, fontFamily: "Inter_700Bold" }]}>
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Bet */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BetControls bet={bet} balance={balance} onChange={setBet} disabled={busy} />
        </View>

        {/* Roll button */}
        <Pressable
          onPress={handleRoll}
          disabled={busy || balance < MIN_BET}
          style={({ pressed }) => [
            styles.rollBtn,
            {
              opacity: pressed ? 0.85 : 1,
              shadowColor: colors.purple,
            },
          ]}
        >
          <LinearGradient
            colors={["#C48BFF", "#9B5DE5"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.rollBtnText, { fontFamily: "Inter_700Bold" }]}>
            {busy ? "Rolling…" : "ROLL DICE"}
          </Text>
        </Pressable>
      </ScrollView>

      {overlay && (
        <WinOverlay
          visible
          won={overlay.won}
          amount={overlay.amount}
          label={overlay.label}
          onDismiss={() => setOverlay(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  screenTitle: { fontSize: 24 },
  screenSub: { fontSize: 12, marginTop: 2 },
  streakBanner: { padding: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  streakText: { fontSize: 13 },
  diceArea: { alignItems: "center", gap: 10, paddingVertical: 6 },
  diceCard: {
    padding: 22, borderRadius: 22, borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 10,
  },
  rollNum: { fontSize: 13 },
  card: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 12 },
  cardLabel: { fontSize: 11, letterSpacing: 1.4 },
  betRow: { flexDirection: "row", gap: 10 },
  betTypeBtn: {
    padding: 12, borderRadius: 14, borderWidth: 1.5, alignItems: "center", gap: 4,
  },
  betTypeTxt: { fontSize: 13 },
  betTypeMult: { fontSize: 11 },
  exactRow: { flexDirection: "row", gap: 8 },
  numBtn: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  numBtnTxt: { fontSize: 18 },
  rollBtn: {
    height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
    overflow: "hidden", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.55,
    shadowRadius: 14, elevation: 8,
  },
  rollBtnText: { color: "#FFF", fontSize: 16, letterSpacing: 1 },
});
