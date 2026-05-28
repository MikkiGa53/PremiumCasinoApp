import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { formatCoins } from "./BalanceDisplay";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  won: boolean;
  amount: number; // net gain (positive = win, negative = loss)
  label?: string;
  onDismiss: () => void;
}

export function WinOverlay({ visible, won, amount, label, onDismiss }: Props) {
  const colors = useColors();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSequence(
        withSpring(1.12, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 14 })
      );
      if (won) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      // auto-dismiss after 2.2s
      const t = setTimeout(onDismiss, 2200);
      return () => clearTimeout(t);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.85, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  const bgColor = won ? colors.green : colors.red;
  const bgMuted = won ? colors.greenMuted : colors.redMuted;
  const amtText = won ? `+${formatCoins(amount)}` : `-${formatCoins(Math.abs(amount))}`;

  return (
    <Animated.View style={[styles.backdrop, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: bgColor + "60",
            shadowColor: bgColor,
          },
          cardStyle,
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: bgMuted, borderColor: bgColor + "40" },
          ]}
        >
          <Text style={styles.emoji}>{won ? "🏆" : "💸"}</Text>
        </View>
        <Text
          style={[
            styles.title,
            { color: bgColor, fontFamily: "Inter_700Bold" },
          ]}
        >
          {won ? "YOU WIN!" : "YOU LOSE"}
        </Text>
        <Text
          style={[
            styles.amount,
            { color: won ? colors.gold : colors.red, fontFamily: "Inter_700Bold" },
          ]}
        >
          {amtText}
        </Text>
        {label ? (
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary, fontFamily: "Inter_400Regular" },
            ]}
          >
            {label}
          </Text>
        ) : null}
        <Pressable
          onPress={onDismiss}
          style={[styles.dismissBtn, { backgroundColor: bgColor }]}
        >
          <Text style={[styles.dismissText, { fontFamily: "Inter_600SemiBold" }]}>
            Continue
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,7,15,0.85)",
    zIndex: 100,
  },
  card: {
    width: 280,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emoji: { fontSize: 36 },
  title: { fontSize: 28, letterSpacing: 1 },
  amount: { fontSize: 36 },
  label: { fontSize: 14, textAlign: "center" },
  dismissBtn: {
    marginTop: 8,
    paddingHorizontal: 40,
    paddingVertical: 13,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  dismissText: { color: "#FFF", fontSize: 16 },
});
