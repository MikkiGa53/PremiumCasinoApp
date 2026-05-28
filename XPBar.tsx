import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { getXPProgress } from "@/constants/gameConfig";
import { useColors } from "@/hooks/useColors";

interface Props {
  totalXP: number;
  compact?: boolean;
}

export function XPBar({ totalXP, compact = false }: Props) {
  const colors = useColors();
  const { level, currentXP, requiredXP, title } = getXPProgress(totalXP);
  const pct = requiredXP > 0 ? currentXP / requiredXP : 0;

  const width = useSharedValue(0);
  React.useEffect(() => {
    width.value = withSpring(pct, { damping: 18, stiffness: 80 });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, width.value) * 100}%` as any,
  }));

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <View style={[styles.levelBadgeSm, { backgroundColor: colors.goldMuted, borderColor: colors.goldBorder }]}>
          <Text style={[styles.levelNumSm, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
            {level}
          </Text>
        </View>
        <View style={styles.compactBarWrap}>
          <View style={[styles.barBg, { backgroundColor: colors.border, height: 5 }]}>
            <Animated.View style={[styles.barFill, barStyle, { height: 5 }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={[styles.levelBadge, { backgroundColor: colors.goldMuted, borderColor: colors.goldBorder }]}>
          <Text style={[styles.levelNum, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
            {level}
          </Text>
        </View>
        <View style={styles.labelCol}>
          <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            {title}
          </Text>
          <Text style={[styles.xpText, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
            {currentXP} / {requiredXP} XP
          </Text>
        </View>
        <Text style={[styles.levelLabel, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
          Lvl {level}
        </Text>
      </View>
      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 14, padding: 14, gap: 10, borderWidth: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelBadge: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  levelNum: { fontSize: 18 },
  labelCol: { flex: 1, gap: 1 },
  title: { fontSize: 15 },
  xpText: { fontSize: 11 },
  levelLabel: { fontSize: 11 },
  barBg: { borderRadius: 4, height: 7, overflow: "hidden" },
  barFill: {
    height: "100%", borderRadius: 4,
    backgroundColor: "#F5C842",
    shadowColor: "#F5C842", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 6,
  },
  // compact
  compactRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  levelBadgeSm: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  levelNumSm: { fontSize: 11 },
  compactBarWrap: { flex: 1 },
});
