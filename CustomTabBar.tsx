import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

const { width: SW } = Dimensions.get("window");

const TAB_META: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  index:       { icon: "home",       label: "Home"    },
  coinflip:    { icon: "refresh-cw", label: "Flip"    },
  dice:        { icon: "grid",       label: "Dice"    },
  slots:       { icon: "layers",     label: "Slots"   },
  leaderboard: { icon: "award",      label: "Ranks"   },
  profile:     { icon: "user",       label: "Profile" },
};

const TAB_KEYS = Object.keys(TAB_META);
const TAB_COUNT = TAB_KEYS.length;

function TabItem({
  name, isFocused, onPress,
}: { name: string; isFocused: boolean; onPress: () => void }) {
  const colors = useColors();
  const meta = TAB_META[name];
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, { damping: 14, stiffness: 200 });
  }, [isFocused]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} style={styles.tabBtn} hitSlop={4}>
      <Animated.View style={[styles.tabInner, animStyle]}>
        <Feather
          name={meta.icon}
          size={20}
          color={isFocused ? colors.gold : colors.textTertiary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? colors.gold : colors.textTertiary,
              fontFamily: isFocused ? "Inter_600SemiBold" : "Inter_400Regular",
            },
          ]}
          numberOfLines={1}
        >
          {meta.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const bottom = insets.bottom || 8;

  // Filter to only tabs we recognise
  const visibleRoutes = state.routes.filter((r) => TAB_META[r.name]);
  const visibleCount = visibleRoutes.length;
  const tabW = SW / visibleCount;

  // Sliding pill tracks active tab
  const pillX = useSharedValue(state.index * tabW);
  React.useEffect(() => {
    pillX.value = withSpring(state.index * tabW, { damping: 18, stiffness: 200 });
  }, [state.index, tabW]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.value }] }));

  return (
    <View style={[styles.outer, { borderTopColor: colors.goldBorder }]}>
      {/* Background */}
      {isIOS ? (
        <BlurView
          intensity={85}
          tint="dark"
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface + "C8" }]}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
      )}

      {/* Gold glow line at top */}
      <View style={[styles.glowLine, { backgroundColor: colors.gold }]} />

      {/* Sliding active pill */}
      <Animated.View
        style={[styles.pill, { width: tabW - 16, backgroundColor: colors.goldMuted, shadowColor: colors.gold, pointerEvents: "none" }, pillStyle]}
      />

      {/* Tab items */}
      <View style={[styles.row, { paddingBottom: bottom }]}>
        {visibleRoutes.map((route, i) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          return (
            <TabItem
              key={route.key}
              name={route.name}
              isFocused={state.index === routeIndex}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (state.index !== routeIndex && !event.defaultPrevented) {
                  Haptics.selectionAsync();
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, overflow: "hidden",
  },
  glowLine: {
    height: 1, opacity: 0.5,
    shadowColor: "#F5C842",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 10,
  },
  // Sliding pill sits behind tab items
  pill: {
    position: "absolute",
    top: 10,
    marginLeft: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5C84230",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  row: {
    flexDirection: "row",
    paddingTop: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
  },
  tabInner: {
    alignItems: "center",
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
