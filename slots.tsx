import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BalanceDisplay } from "@/components/BalanceDisplay";
import { BetControls } from "@/components/BetControls";
import { WinOverlay } from "@/components/WinOverlay";
import {
  evalSlots, MIN_BET, randomSlotSymbol, SLOT_SYMBOLS, type SlotSymbol,
} from "@/constants/gameConfig";
import { useGame } from "@/context/GameContext";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useColors } from "@/hooks/useColors";

const INIT_REELS: SlotSymbol[] = [SLOT_SYMBOLS[0], SLOT_SYMBOLS[2], SLOT_SYMBOLS[4]];

function Reel({ sym, spinning, stopped }: { sym: SlotSymbol; spinning: boolean; stopped: boolean }) {
  const colors = useColors();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (stopped) {
      scale.value = withSequence(
        withTiming(1.18, { duration: 90 }),
        withSpring(1, { damping: 10 }),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [stopped]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        styles.reel,
        {
          backgroundColor: colors.card,
          borderColor: stopped ? sym.color + "80" : spinning ? colors.border : colors.borderBright,
          shadowColor: stopped ? sym.color : "transparent",
        },
        animStyle,
      ]}
    >
      {spinning && (
        <View style={[styles.reelBlurOverlay, { backgroundColor: colors.background + "40" }]} />
      )}
      <Text style={[styles.reelChar, { color: sym.color }]}>{sym.char}</Text>
    </Animated.View>
  );
}

const PAYTABLE = SLOT_SYMBOLS.slice(0, 5).map((s) => ({ ...s }));

export default function SlotsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, placeBet, currentStreak } = useGame();
  const sounds = useSoundEffects();

  const [reels, setReels] = useState<SlotSymbol[]>([...INIT_REELS]);
  const [bet, setBet] = useState(MIN_BET);
  const [spinning, setSpinning] = useState(false);
  const [stopped, setStopped] = useState([true, true, true]);
  const [overlay, setOverlay] = useState<{ won: boolean; amount: number; label: string } | null>(null);
  const [lastResult, setLastResult] = useState<{ multiplier: number; label: string } | null>(null);
  const [showPay, setShowPay] = useState(false);

  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);
  const timeoutRefs  = useRef<ReturnType<typeof setTimeout>[]>([]);

  const topPad    = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPad = (insets.bottom || 20) + 90;

  function clearTimers() {
    intervalRefs.current.forEach(clearInterval);
    timeoutRefs.current.forEach(clearTimeout);
    intervalRefs.current = [];
    timeoutRefs.current = [];
  }

  useEffect(() => () => clearTimers(), []);

  function handleSpin() {
    if (balance < bet || spinning) return;
    clearTimers();
    setSpinning(true);
    setStopped([false, false, false]);
    setLastResult(null);
    setOverlay(null);
    sounds.playSpin();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result: SlotSymbol[] = [randomSlotSymbol(), randomSlotSymbol(), randomSlotSymbol()];

    // Spin all 3 reels
    const ivals = [0, 1, 2].map((ri) =>
      setInterval(() => {
        setReels((prev) => {
          const n = [...prev];
          n[ri] = randomSlotSymbol();
          return n;
        });
      }, 75)
    );
    intervalRefs.current = ivals;

    // Cascade stop
    [0, 1, 2].forEach((ri) => {
      const t = setTimeout(() => {
        clearInterval(ivals[ri]);
        setReels((prev) => {
          const n = [...prev];
          n[ri] = result[ri];
          return n;
        });
        setStopped((prev) => {
          const n = [...prev];
          n[ri] = true;
          return n;
        });

        if (ri === 2) {
          const evaluation = evalSlots(result);
          setLastResult(evaluation);
          setSpinning(false);
          const payout = Math.round(bet * evaluation.multiplier);
          const won = payout > 0;
          const t2 = setTimeout(async () => {
            await placeBet("slots", bet, payout, evaluation.label);
            if (won) {
              sounds.playWin();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              sounds.playLose();
            }
            setOverlay({ won, amount: won ? payout - bet : bet, label: evaluation.label });
          }, 300);
          timeoutRefs.current.push(t2);
        }
      }, 1050 + ri * 420);
      timeoutRefs.current.push(t);
    });
  }

  const totalPayout = lastResult ? Math.round(bet * lastResult.multiplier) : 0;
  const netResult   = totalPayout - bet;

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
              🎰 Slot Machine
            </Text>
            <Text style={[styles.screenSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
              3×7 jackpot · 15× payout
            </Text>
          </View>
          <BalanceDisplay balance={balance} size="sm" />
        </View>

        {currentStreak >= 2 && (
          <View style={[styles.streakBanner, { backgroundColor: colors.red + "18", borderColor: colors.red + "40" }]}>
            <Text style={[styles.streakText, { color: colors.red, fontFamily: "Inter_600SemiBold" }]}>
              🔥 {currentStreak} win streak!
            </Text>
          </View>
        )}

        {/* Machine cabinet */}
        <View style={[styles.cabinet, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
          <LinearGradient colors={["#F5C84208", "#9B5DE508"]} style={StyleSheet.absoluteFill} />

          {/* Payline indicator */}
          <View style={[styles.paylineBar, { backgroundColor: colors.gold + "18", borderColor: colors.goldBorder }]}>
            <Text style={[styles.paylineText, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>
              ── PAYLINE ──
            </Text>
          </View>

          {/* Reels */}
          <View style={styles.reelsRow}>
            {reels.map((sym, i) => (
              <Reel key={i} sym={sym} spinning={spinning && !stopped[i]} stopped={stopped[i] && spinning === false && i < reels.length} />
            ))}
          </View>

          {/* Result label */}
          <View style={styles.resultArea}>
            {lastResult ? (
              <Text style={[
                styles.resultLabel,
                {
                  color: lastResult.multiplier > 0 ? colors.gold : colors.textTertiary,
                  fontFamily: "Inter_700Bold",
                },
              ]}>
                {lastResult.label}
              </Text>
            ) : (
              <Text style={[styles.resultLabel, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
                {spinning ? "Spinning…" : "Good luck!"}
              </Text>
            )}
            {lastResult && lastResult.multiplier > 0 && (
              <Text style={[styles.resultMult, { color: colors.green, fontFamily: "Inter_700Bold" }]}>
                +{totalPayout - bet} coins
              </Text>
            )}
          </View>
        </View>

        {/* Bet controls */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BetControls bet={bet} balance={balance} onChange={setBet} disabled={spinning} />
        </View>

        {/* Spin button */}
        <Pressable
          onPress={handleSpin}
          disabled={spinning || balance < MIN_BET}
          style={({ pressed }) => [
            styles.spinBtn,
            { opacity: pressed ? 0.85 : 1, shadowColor: colors.gold },
          ]}
        >
          <LinearGradient
            colors={spinning || balance < MIN_BET ? [colors.surfaceVariant, colors.surfaceVariant] : ["#FFE080", "#F5C842", "#C49B0A"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[
            styles.spinBtnText,
            { color: spinning || balance < MIN_BET ? colors.textTertiary : "#07070F", fontFamily: "Inter_700Bold" },
          ]}>
            {spinning ? "⟳  SPINNING…" : "SPIN"}
          </Text>
        </Pressable>

        {/* Paytable toggle */}
        <Pressable
          onPress={() => setShowPay((v) => !v)}
          style={[styles.payTableToggle, { borderColor: colors.border }]}
        >
          <Text style={[styles.payTableToggleTxt, { color: colors.textTertiary, fontFamily: "Inter_500Medium" }]}>
            {showPay ? "Hide" : "Show"} Paytable ▾
          </Text>
        </Pressable>

        {showPay && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
              PAYTABLE
            </Text>
            {PAYTABLE.map((s) => (
              <View key={s.id} style={styles.payRow}>
                <Text style={[styles.payChar, { color: s.color }]}>{s.char} {s.char} {s.char}</Text>
                <Text style={[styles.payMult, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  {s.payout3}× bet
                </Text>
              </View>
            ))}
            <View style={styles.payRow}>
              <Text style={[styles.payChar, { color: colors.textSecondary }]}>Any pair</Text>
              <Text style={[styles.payMult, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>1.5× bet</Text>
            </View>
          </View>
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
  cabinet: {
    borderRadius: 22, borderWidth: 1.5, padding: 20, gap: 16,
    alignItems: "center", overflow: "hidden",
    shadowColor: "#F5C842", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 6,
  },
  paylineBar: {
    width: "100%", paddingVertical: 6, borderRadius: 8, borderWidth: 1,
    alignItems: "center",
  },
  paylineText: { fontSize: 11, letterSpacing: 1 },
  reelsRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  reel: {
    width: 88, height: 88, borderRadius: 16, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
    overflow: "hidden",
  },
  reelBlurOverlay: { ...StyleSheet.absoluteFillObject },
  reelChar: { fontSize: 44, fontFamily: "Inter_700Bold" },
  resultArea: { alignItems: "center", gap: 4, minHeight: 40 },
  resultLabel: { fontSize: 16, textAlign: "center" },
  resultMult: { fontSize: 22 },
  card: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 12 },
  cardLabel: { fontSize: 11, letterSpacing: 1.4 },
  spinBtn: {
    height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center",
    overflow: "hidden", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  spinBtnText: { fontSize: 18, letterSpacing: 2 },
  payTableToggle: { alignItems: "center", padding: 10, borderRadius: 12, borderWidth: 1 },
  payTableToggleTxt: { fontSize: 13 },
  payRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#252438",
  },
  payChar: { fontSize: 18, letterSpacing: 4 },
  payMult: { fontSize: 14 },
});
