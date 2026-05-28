import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORIES, SLOT_GAMES } from "@/constants/slotGames";
import { useFavorites } from "@/hooks/useFavorites";
import { useColors } from "@/hooks/useColors";

const BADGE_COLORS: Record<string, string> = {
  NEW:     "#00D4FF",
  HOT:     "#FF3B5C",
  JACKPOT: "#F5C842",
};

function SmallSlotCard({ game, isFav, onFav, onPress }: {
  game: typeof SLOT_GAMES[0];
  isFav: boolean;
  onFav: () => void;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.relCard,
        { backgroundColor: colors.card, borderColor: game.accent + "40", opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <LinearGradient
        colors={[game.accent + "28", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      />
      <View style={[s.relThumb, { backgroundColor: game.accent + "18" }]}>
        <Text style={s.relEmoji}>{game.emoji}</Text>
      </View>
      <Text style={[s.relName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
        {game.name}
      </Text>
      <Text style={[s.relMult, { color: game.accent, fontFamily: "Inter_700Bold" }]}>
        {game.maxMultiplier}×
      </Text>
      <Pressable onPress={(e) => { e.stopPropagation(); onFav(); }} style={s.relHeart}>
        <MaterialCommunityIcons name={isFav ? "heart" : "heart-outline"} size={15} color={isFav ? "#FF3B5C" : colors.textTertiary} />
      </Pressable>
    </Pressable>
  );
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();

  const game = SLOT_GAMES.find((g) => g.id === id);
  const category = CATEGORIES.find((c) => c.key === game?.category);
  const relatedGames = SLOT_GAMES.filter(
    (g) => g.category === game?.category && g.id !== id,
  ).slice(0, 6);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (insets.bottom || 16) + 24;

  if (!game || !category) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, paddingTop: topPad + 20 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={[s.notFound, { color: colors.textTertiary }]}>Game not found.</Text>
      </View>
    );
  }

  const isFav = isFavorite(game.id);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>
        {/* Hero */}
        <View style={s.hero}>
          <LinearGradient
            colors={[game.accent + "38", game.accent + "12", colors.background]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          />
          {/* Top bar */}
          <View style={[s.topBar, { paddingTop: topPad + 8 }]}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
              style={[s.backBtn, { backgroundColor: colors.surface + "CC", borderColor: colors.border }]}
            >
              <Feather name="arrow-left" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavorite(game.id); }}
              style={[s.favBtn, { backgroundColor: colors.surface + "CC", borderColor: isFav ? "#FF3B5C50" : colors.border }]}
            >
              <MaterialCommunityIcons name={isFav ? "heart" : "heart-outline"} size={19} color={isFav ? "#FF3B5C" : colors.textSecondary} />
            </Pressable>
          </View>

          {/* Emoji glow */}
          <Animated.View entering={FadeInDown.duration(400).springify()} style={s.emojiWrap}>
            <View style={[s.emojiGlow, { backgroundColor: game.accent + "20", shadowColor: game.accent }]} />
            <Text style={s.heroEmoji}>{game.emoji}</Text>
          </Animated.View>

          {/* Title + badges */}
          <Animated.View entering={FadeInDown.duration(400).delay(60).springify()} style={s.heroInfo}>
            <View style={s.badgeRow}>
              <View style={[s.catPill, { backgroundColor: category.color + "20", borderColor: category.color + "40" }]}>
                <Text style={[s.catPillTxt, { color: category.color, fontFamily: "Inter_600SemiBold" }]}>
                  {category.emoji} {category.label.toUpperCase()}
                </Text>
              </View>
              {game.badge && (
                <View style={[s.badgePill, { backgroundColor: BADGE_COLORS[game.badge] + "22", borderColor: BADGE_COLORS[game.badge] + "55" }]}>
                  <Text style={[s.badgePillTxt, { color: BADGE_COLORS[game.badge], fontFamily: "Inter_700Bold" }]}>
                    {game.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[s.heroTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              {game.name}
            </Text>
          </Animated.View>
        </View>

        {/* Stats row */}
        <Animated.View entering={FadeInUp.duration(380).delay(80).springify()} style={[s.statsRow, { paddingHorizontal: 20 }]}>
          {[
            { label: "MAX PAYOUT", value: `${game.maxMultiplier}×`, color: game.accent },
            { label: "RTP",        value: `${game.rtp}%`,          color: colors.green },
            { label: "CATEGORY",   value: category.label.split(" ")[0].toUpperCase(), color: colors.textSecondary },
          ].map((stat) => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.statVal, { color: stat.color, fontFamily: "Inter_700Bold" }]}>{stat.value}</Text>
              <Text style={[s.statLbl, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInUp.duration(380).delay(130).springify()} style={[s.descCard, { marginHorizontal: 20, backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.descTitle, { color: colors.textTertiary, fontFamily: "Inter_600SemiBold" }]}>ABOUT THIS GAME</Text>
          <Text style={[s.descText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {game.description}
          </Text>
        </Animated.View>

        {/* Game features */}
        <Animated.View entering={FadeInUp.duration(380).delay(180).springify()} style={{ paddingHorizontal: 20 }}>
          <View style={s.featuresGrid}>
            {[
              { icon: "zap" as const,        label: "Fast Spins",      sub: "Instant results"     },
              { icon: "shield" as const,      label: "Safe Play",       sub: "Virtual chips only"  },
              { icon: "trending-up" as const, label: "XP Rewards",      sub: "Every bet counts"    },
              { icon: "gift" as const,        label: "Daily Bonus",     sub: "Free chips daily"    },
            ].map((f) => (
              <View key={f.icon} style={[s.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.featureIconWrap, { backgroundColor: game.accent + "18" }]}>
                  <Feather name={f.icon} size={16} color={game.accent} />
                </View>
                <Text style={[s.featureLabel, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>{f.label}</Text>
                <Text style={[s.featureSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>{f.sub}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Play button */}
        <Animated.View entering={FadeInUp.duration(380).delay(230).springify()} style={[s.playWrap, { paddingHorizontal: 20 }]}>
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace("/(tabs)/slots");
            }}
            style={({ pressed }) => [
              s.playBtn,
              { backgroundColor: game.accent, shadowColor: game.accent, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Text style={[s.playBtnTxt, { fontFamily: "Inter_700Bold" }]}>PLAY NOW</Text>
            <Feather name="play" size={16} color="#07070F" />
          </Pressable>
          <Text style={[s.playNote, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>
            Virtual chips only · No real money
          </Text>
        </Animated.View>

        {/* Related games */}
        {relatedGames.length > 0 && (
          <Animated.View entering={FadeInUp.duration(380).delay(280).springify()}>
            <View style={[s.secHeader, { paddingHorizontal: 20 }]}>
              <Text style={[s.secTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                MORE IN {category.label.toUpperCase()}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {relatedGames.map((rg) => (
                <SmallSlotCard
                  key={rg.id}
                  game={rg}
                  isFav={isFavorite(rg.id)}
                  onFav={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleFavorite(rg.id);
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.replace(`/game/${rg.id}` as any);
                  }}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  notFound: { textAlign: "center", fontSize: 15, marginTop: 40 },

  // Hero
  hero: { paddingBottom: 24, overflow: "hidden" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  favBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  emojiWrap: { alignItems: "center", marginVertical: 12 },
  emojiGlow: {
    position: "absolute",
    width: 160, height: 160, borderRadius: 80,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 40,
  },
  heroEmoji: { fontSize: 90 },
  heroInfo: { alignItems: "center", paddingHorizontal: 20, gap: 10, marginTop: 8 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  catPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  catPillTxt: { fontSize: 10, letterSpacing: 1 },
  badgePill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  badgePillTxt: { fontSize: 10, letterSpacing: 1 },
  heroTitle: { fontSize: 32, textAlign: "center", letterSpacing: -0.5 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 14,
    alignItems: "center", gap: 4, borderWidth: 1,
  },
  statVal: { fontSize: 18 },
  statLbl: { fontSize: 8, letterSpacing: 1 },

  // Description
  descCard: {
    borderRadius: 18, padding: 18,
    borderWidth: 1, marginTop: 14, gap: 8,
  },
  descTitle: { fontSize: 10, letterSpacing: 1.5 },
  descText: { fontSize: 14, lineHeight: 22 },

  // Features
  featuresGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14,
  },
  featureCard: {
    width: "47.5%", borderRadius: 14, padding: 14,
    gap: 6, borderWidth: 1,
  },
  featureIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  featureLabel: { fontSize: 13 },
  featureSub: { fontSize: 11 },

  // Play
  playWrap: { marginTop: 20, gap: 10, alignItems: "center" },
  playBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    width: "100%", justifyContent: "center",
    paddingVertical: 18, borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  playBtnTxt: { fontSize: 17, color: "#07070F", letterSpacing: 1 },
  playNote: { fontSize: 11 },

  // Related games
  secHeader: { marginTop: 28, marginBottom: 12 },
  secTitle: { fontSize: 12, letterSpacing: 1.5 },
  relCard: {
    width: 120, borderRadius: 16, borderWidth: 1,
    overflow: "hidden", padding: 12, gap: 6,
  },
  relThumb: {
    width: "100%", height: 70, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  relEmoji: { fontSize: 32 },
  relName: { fontSize: 12, lineHeight: 16 },
  relMult: { fontSize: 13 },
  relHeart: { position: "absolute", top: 10, right: 10 },
});
