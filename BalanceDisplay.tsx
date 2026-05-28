import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  balance: number;
  size?: "sm" | "md" | "lg";
}

export function formatCoins(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export function BalanceDisplay({ balance, size = "md" }: Props) {
  const colors = useColors();

  const iconSize = size === "lg" ? 20 : size === "md" ? 16 : 13;
  const textSize = size === "lg" ? 32 : size === "md" ? 22 : 15;
  const labelSize = size === "lg" ? 11 : size === "md" ? 10 : 9;

  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: colors.goldMuted, borderColor: colors.goldBorder }]}>
        <Feather name="circle" size={iconSize} color={colors.gold} />
        <Text
          style={[
            styles.amount,
            {
              fontSize: textSize,
              color: colors.gold,
              fontFamily: "Inter_700Bold",
            },
          ]}
        >
          {formatCoins(balance)}
        </Text>
      </View>
      <Text
        style={[
          styles.label,
          {
            fontSize: labelSize,
            color: colors.textTertiary,
            fontFamily: "Inter_400Regular",
          },
        ]}
      >
        COINS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 3,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  amount: {
    letterSpacing: 0.5,
  },
  label: {
    letterSpacing: 1.5,
  },
});
