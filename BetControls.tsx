import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BET_PRESETS, MIN_BET } from "@/constants/gameConfig";
import { useColors } from "@/hooks/useColors";
import { formatCoins } from "./BalanceDisplay";

interface Props {
  bet: number;
  balance: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}

export function BetControls({ bet, balance, onChange, disabled = false }: Props) {
  const colors = useColors();

  function set(val: number) {
    if (disabled) return;
    Haptics.selectionAsync();
    onChange(Math.max(MIN_BET, Math.min(val, balance)));
  }

  const canIncrease = bet < balance;
  const canDecrease = bet > MIN_BET;

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>
          BET
        </Text>
        <View style={[styles.amountRow, { backgroundColor: colors.surface, borderColor: colors.borderGold }]}>
          <Pressable
            onPress={() => set(bet - (bet <= 50 ? 10 : bet <= 200 ? 25 : 50))}
            disabled={disabled || !canDecrease}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed || !canDecrease ? 0.4 : 1 })}
          >
            <Feather name="minus" size={16} color={colors.gold} />
          </Pressable>
          <Text style={[styles.betAmount, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
            {formatCoins(bet)}
          </Text>
          <Pressable
            onPress={() => set(bet + (bet < 50 ? 10 : bet < 200 ? 25 : 50))}
            disabled={disabled || !canIncrease}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed || !canIncrease ? 0.4 : 1 })}
          >
            <Feather name="plus" size={16} color={colors.gold} />
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
        {BET_PRESETS.filter((p) => p <= balance).map((p) => {
          const active = bet === p;
          return (
            <Pressable
              key={p}
              onPress={() => set(p)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? colors.gold : colors.surfaceVariant,
                  borderColor: active ? colors.gold : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[
                styles.chipText,
                { color: active ? "#07070F" : colors.textSecondary, fontFamily: active ? "Inter_700Bold" : "Inter_500Medium" },
              ]}>
                {formatCoins(p)}
              </Text>
            </Pressable>
          );
        })}
        {balance >= MIN_BET && (
          <Pressable
            onPress={() => set(balance)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: colors.purpleMuted, borderColor: colors.purple, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={[styles.chipText, { color: colors.purple, fontFamily: "Inter_700Bold" }]}>
              ALL IN
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 11, letterSpacing: 1.4 },
  amountRow: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  betAmount: { fontSize: 20, minWidth: 60, textAlign: "center" },
  presets: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12 },
});
