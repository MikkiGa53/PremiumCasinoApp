import {
  Inter_400Regular, Inter_500Medium,
  Inter_600SemiBold, Inter_700Bold, useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameProvider } from "@/context/GameContext";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function CasinoSplash({ onDone }: { onDone: () => void }) {
  const logoOpacity = useSharedValue(0);
  const logoScale   = useSharedValue(0.7);
  const subtitleOp  = useSharedValue(0);
  const glowScale   = useSharedValue(0.8);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700 });
    logoScale.value   = withSpring(1, { damping: 12, stiffness: 100 });
    subtitleOp.value  = withTiming(1, { duration: 900 });
    glowScale.value   = withSpring(1.15, { damping: 8 });

    // Start fade-out at 1.4s, call onDone at 1.8s regardless of animation state
    const t1 = setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 350 });
      subtitleOp.value  = withTiming(0, { duration: 300 });
      glowScale.value   = withTiming(1.4, { duration: 350 });
    }, 1400);
    const t2 = setTimeout(() => onDone(), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const logoStyle   = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const subStyle    = useAnimatedStyle(() => ({ opacity: subtitleOp.value }));
  const glowStyle   = useAnimatedStyle(() => ({ transform: [{ scale: glowScale.value }], opacity: logoOpacity.value * 0.35 }));

  return (
    <View style={splash.root}>
      {/* Background glow */}
      <Animated.View style={[splash.glow, glowStyle]} />

      <Animated.View style={[splash.logoWrap, logoStyle]}>
        <Text style={splash.emoji}>🎰</Text>
        <Text style={splash.title}>LUCKY{"\n"}CASINO</Text>
      </Animated.View>

      <Animated.View style={[splash.subtitleWrap, subStyle]}>
        <Text style={splash.subtitle}>Play · Win · Repeat</Text>
        <View style={splash.dotsRow}>
          {[0, 1, 2].map((i) => <PulsingDot key={i} delay={i * 200} />)}
        </View>
      </Animated.View>
    </View>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const op = useSharedValue(0.3);
  useEffect(() => {
    const t = setTimeout(() => {
      function pulse() {
        op.value = withTiming(1, { duration: 500 }, () => {
          op.value = withTiming(0.3, { duration: 500 }, pulse);
        });
      }
      pulse();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.View style={[splash.dot, s]} />;
}

const splash = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: "#07070F",
    alignItems: "center", justifyContent: "center", gap: 32,
  },
  glow: {
    position: "absolute", width: 300, height: 300, borderRadius: 150,
    backgroundColor: "#F5C842",
  },
  logoWrap: { alignItems: "center", gap: 16 },
  emoji: { fontSize: 72 },
  title: {
    fontSize: 46, color: "#F5C842", textAlign: "center",
    fontFamily: "Inter_700Bold", letterSpacing: 6, lineHeight: 52,
    textShadowColor: "#F5C842", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  subtitleWrap: { alignItems: "center", gap: 16 },
  subtitle: {
    color: "#9090B8", fontSize: 14, letterSpacing: 3,
    fontFamily: "Inter_400Regular",
  },
  dotsRow: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F5C842" },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  // Skip the casino splash on web so the preview loads instantly
  const [splashDone, setSplashDone] = useState(Platform.OS === "web");

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (!splashDone) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <CasinoSplash onDone={() => setSplashDone(true)} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GameProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="game/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
                </Stack>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </GameProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
