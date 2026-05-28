import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue,
  withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BalanceDisplay } from "@/components/BalanceDisplay";
import { BetControls } from "@/components/BetControls";
import { WinOverlay } from "@/components/WinOverlay";
import { MIN_BET } from "@/constants/gameConfig";
import { useGame } from "@/context/GameContext";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useColors } from "@/hooks/useColors";

type Face = "heads" | "tails";

const FACE_CONFIG: Record<Face, { symbol: string; bg: string; label: string }> = {
  heads: { symbol: "♔", bg: "#F5C842", label: "HEADS" },
  tails: { symbol: "◉", bg: "#9B5DE5", label: "TAILS" },
};

export default function CoinFlipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, placeBet, currentStreak } = useGame();
  const sounds = useSoundEffects();

  const [selected, setSelected] = useState<Face | null>(null);
  const [displayFace, setDisplayFace] = useState<Face>("heads");
  const [bet, setBet] = useState(MIN_BET);
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState<{ won: boolean; amount: number; label: string } | null>(null);

  const coinScaleX = useSharedValue(1);
  const coinScaleY = useSharedValue(1);
  const coinRotate = useSharedValue(0);
  const btnScale   = useSharedValue(1);

  const topPad    = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPad = (insets.bottom || 20) + 90;

  function doFlip(targetFace: Face, onDone: () => void) {
    const faces: Face[] = ["tails", "heads", "tails", "heads", "tails", targetFace];
    let i = 0;

    function step() {
      coinScaleX.value = withTiming(0.05, { duration: 90 }, () => {
        runOnJS(setDisplayFace)(faces[i]);
        coinScaleX.value = withTiming(1, { duration: 90 }, () => {
          i++;
          if (i < faces.length) {
            step();
          } else {
            coinScaleY.value = withSequence(withSpring(1.15, { damping: 8 }), withSpring(1));
            runOnJS(onDone)();
          }
        });
      });
    }
    step();
  }

  function handleFlip() {
    if (!selected || balance < bet || busy) return;
    setBusy(true);
    setOverlay(null);
    sounds.playFlip();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    btnScale.value = withSequence(withTiming(0.94, { duration: 80 }), withSpring(1));

    const result: Face = Math.random() < 0.5 ? "heads" : "tails";
    const won = result === selected;

    doFlip(result, async () => {
      const payout = won ? bet * 2 : 0;
      await placeBet("coinflip", bet, payout, result);
      if (won) sounds.playWin(); else sounds.playLose();
      if (won) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOverlay({ won, amount: won ? bet : bet, label: `Landed ${result.toUpperCase()}!` });
      setBusy(false);
    });
  }

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: coinScaleX.value }, { scaleY: coinScaleY.value }],
  }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const cfg = FACE_CONFIG[displayFace];
  const canFlip = !!selected && balance >= MIN_BET && !busy;

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
              🪙 Coin Flip
            </Text>
            <Text style={[styles.screenSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
              Pick a side · Win 2×
            </Text>
          </View>
          <BalanceDisplay balance={balance} size="sm" />
        </View>

        {/* Streak */}
        {currentStreak >= 2 && (
          <View style={[styles.streakBanner, { backgroundColor: colors.red + "18", borderColor: colors.red + "40" }]}>
            <Text style={[styles.streakText, { color: colors.red, fontFamily: "Inter_600SemiBold" }]}>
              🔥 {currentStreak} win streak! Keep it going!
            </Text>
          </View>
        )}

        {/* Coin display */}
        <View style={styles.coinArea}>
          <Animated.View style={[styles.coinOuter, { shadowColor: cfg.bg }, coinStyle]}>
            <View style={[styles.coin, { backgroundColor: cfg.bg }]}>
              <Text style={styles.coinSymbol}>{cfg.symbol}</Text>
              <Text style={[styles.coinLabel, { color: displayFace === "heads" ? "#07070F" : "#FFF", fontFamily: "Inter_700Bold" }]}>
                {cfg.label}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Pick side */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
            PICK YOUR SIDE
          </Text>
          <View style={styles.sideRow}>
            {(["heads", "tails"] as Face[]).map((f) => {
              const fc = FACE_CONFIG[f];
              const active = selected === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => { if (!busy) { setSelected(f); Haptics.selectionAsync(); } }}
                  style={({ pressed }) => [
                    styles.sideBtn,
                    {
                      backgroundColor: active ? fc.bg + "20" : colors.surfaceVariant,
                      borderColor: active ? fc.bg : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={styles.sideBtnEmoji}>{f === "heads" ? "♔" : "◉"}</Text>
                  <Text style={[
                    styles.sideBtnText,
                    { color: active ? fc.bg : colors.textSecondary, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" },
                  ]}>
                    {fc.label}
                  </Text>
                  <Text style={[styles.sideBtnOdds, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                    2× payout
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

        {/* Flip button */}
        <Animated.View style={btnStyle}>
          <Pressable
            onPress={handleFlip}
            disabled={!canFlip}
            style={({ pressed }) => [
              styles.flipBtn,
              {
                backgroundColor: canFlip ? colors.gold : colors.surfaceVariant,
                opacity: pressed ? 0.85 : 1,
                shadowColor: canFlip ? colors.gold : "transparent",
              },
            ]}
          >
            <LinearGradient
              colors={canFlip ? ["#FFE080", "#F5C842"] : [colors.surfaceVariant, colors.surfaceVariant]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.flipBtnText, { color: canFlip ? "#07070F" : colors.textTertiary, fontFamily: "Inter_700Bold" }]}>
              {busy ? "Flipping…" : "FLIP COIN"}
            </Text>
          </Pressable>
        </Animated.View>

        {!selected && (
          <Text style={[styles.hint, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
            Pick heads or tails to start
          </Text>
        )}
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
  coinArea: { alignItems: "center", paddingVertical: 10 },
  coinOuter: {
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 10,
  },
  coin: {
    width: 148, height: 148, borderRadius: 74,
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  coinSymbol: { fontSize: 52 },
  coinLabel: { fontSize: 13, letterSpacing: 1.5 },
  card: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 12 },
  cardLabel: { fontSize: 11, letterSpacing: 1.4 },
  sideRow: { flexDirection: "row", gap: 12 },
  sideBtn: {
    flex: 1, alignItems: "center", gap: 6, padding: 16,
    borderRadius: 14, borderWidth: 1.5,
  },
  sideBtnEmoji: { fontSize: 28 },
  sideBtnText: { fontSize: 15 },
  sideBtnOdds: { fontSize: 11 },
  flipBtn: {
    height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
    overflow: "hidden", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5,
    shadowRadius: 14, elevation: 8,
  },
  flipBtnText: { fontSize: 16, letterSpacing: 1 },
  hint: { textAlign: "center", fontSize: 13 },
});
