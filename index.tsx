import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import Animated, {
  FadeInDown, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatCoins } from "@/components/BalanceDisplay";
import { XPBar } from "@/components/XPBar";
import { getDailyBonus, getXPProgress } from "@/constants/gameConfig";
import {
  CATEGORIES, SLOT_GAMES,
  type BadgeType, type SlotCategory, type SlotGame,
} from "@/constants/slotGames";
import { useGame } from "@/context/GameContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useColors } from "@/hooks/useColors";

const { width: SW } = Dimensions.get("window");
const CARD_W = SW * 0.76;          // featured playable game card
const SLOT_CARD_W = 138;           // slot game card (horizontal rows)
const GRID_CARD_W = (SW - 52) / 2; // slot card in search grid (2 col)

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function msToCountdown(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const BADGE_COLOR: Record<BadgeType, string> = {
  NEW:     "#00D4FF",
  HOT:     "#FF3B5C",
  JACKPOT: "#F5C842",
};

// ─────────────────────────────────────────────────────────────
// Playable game cards (top carousel)
// ─────────────────────────────────────────────────────────────
const PLAY_GAMES = [
  { key: "coinflip", emoji: "🪙", title: "Coin Flip",    tagline: "DOUBLE UP",    desc: "50/50 · Win 2×",  accent: "#00D4FF", grad: ["#00D4FF28","#00D4FF08","#07070F"] as const },
  { key: "dice",     emoji: "🎲", title: "Dice Roll",    tagline: "ROLL THE ODDS", desc: "Low/High 2× · Exact 5×", accent: "#9B5DE5", grad: ["#9B5DE528","#9B5DE508","#07070F"] as const },
  { key: "slots",    emoji: "🎰", title: "Slot Machine", tagline: "HIT JACKPOT",  desc: "3-reel · Up to 15×", accent: "#F5C842", grad: ["#F5C84228","#F5C84208","#07070F"] as const },
];

function PlayCard({ g, onPress }: { g: typeof PLAY_GAMES[0]; onPress: () => void }) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[{ width: CARD_W }, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 14, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 300 }); }}
        style={[s.playCard, { backgroundColor: colors.card, borderColor: g.accent + "55" }]}
      >
        <LinearGradient colors={g.grad} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={[s.playCardGlow, { backgroundColor: g.accent + "20", shadowColor: g.accent }]} />
        <View style={s.playCardBody}>
          <Text style={s.playEmoji}>{g.emoji}</Text>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[s.playTagline, { color: g.accent, fontFamily: "Inter_600SemiBold" }]}>{g.tagline}</Text>
            <Text style={[s.playTitle, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>{g.title}</Text>
            <Text style={[s.playDesc, { color: "#9090B8", fontFamily: "Inter_400Regular" }]}>{g.desc}</Text>
          </View>
        </View>
        <View style={[s.playBtn, { backgroundColor: g.accent, shadowColor: g.accent }]}>
          <Text style={[s.playBtnTxt, { fontFamily: "Inter_700Bold" }]}>PLAY NOW</Text>
          <Feather name="chevron-right" size={13} color="#07070F" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Badge pill
// ─────────────────────────────────────────────────────────────
function BadgePill({ type }: { type: BadgeType }) {
  const col = BADGE_COLOR[type];
  return (
    <View style={[s.badgePill, { backgroundColor: col + "28", borderColor: col + "60" }]}>
      <Text style={[s.badgeTxt, { color: col, fontFamily: "Inter_700Bold" }]}>{type}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Slot card (reused in rows + grid)
// ─────────────────────────────────────────────────────────────
function SlotCard({
  game, isFav, onFav, onPress, width,
}: {
  game: SlotGame; isFav: boolean;
  onFav: () => void; onPress: () => void; width: number;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.slotCard,
        { width, backgroundColor: colors.card, borderColor: game.accent + "40", opacity: pressed ? 0.88 : 1 },
      ]}
    >
      {/* Thumbnail */}
      <View style={s.thumb}>
        <LinearGradient
          colors={[game.accent + "30", game.accent + "08", "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <Text style={s.thumbEmoji}>{game.emoji}</Text>
        {game.badge && (
          <View style={s.badgePos}><BadgePill type={game.badge} /></View>
        )}
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onFav(); }}
          style={s.heartPos}
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={isFav ? "heart" : "heart-outline"}
            size={15}
            color={isFav ? "#FF3B5C" : colors.textTertiary}
          />
        </Pressable>
      </View>
      {/* Info */}
      <View style={s.cardInfo}>
        <Text style={[s.cardName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
          {game.name}
        </Text>
        <Text style={[s.cardMult, { color: game.accent, fontFamily: "Inter_700Bold" }]}>
          Up to {game.maxMultiplier}×
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// One category row (horizontal scroll)
// ─────────────────────────────────────────────────────────────
function CategoryRow({
  catKey, games, favorites, onToggleFav, onPressGame,
}: {
  catKey: SlotCategory;
  games: SlotGame[];
  favorites: string[];
  onToggleFav: (id: string) => void;
  onPressGame: (id: string) => void;
}) {
  const colors = useColors();
  const meta = CATEGORIES.find((c) => c.key === catKey)!;
  return (
    <View style={s.catRow}>
      <View style={[s.catRowHeader, { paddingHorizontal: 20 }]}>
        <Text style={[s.catRowTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          {meta.emoji}{"  "}{meta.label.toUpperCase()}
        </Text>
        <View style={[s.catCount, { backgroundColor: meta.color + "20", borderColor: meta.color + "40" }]}>
          <Text style={[s.catCountTxt, { color: meta.color, fontFamily: "Inter_600SemiBold" }]}>
            {games.length}
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}
      >
        {games.map((game) => (
          <SlotCard
            key={game.id}
            game={game}
            width={SLOT_CARD_W}
            isFav={favorites.includes(game.id)}
            onFav={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleFav(game.id); }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPressGame(game.id); }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    balance, totalXP, currentStreak,
    canClaimDaily, dailyTimeLeft, consecutiveDailyDays,
    claimDailyReward, stats,
  } = useGame();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const [searchQuery, setSearchQuery]     = useState("");
  const [activeCategory, setActiveCategory] = useState<SlotCategory | "all">("all");
  const searchRef = useRef<TextInput>(null);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (insets.bottom || 20) + 90;

  const nextBonus  = getDailyBonus(consecutiveDailyDays + 1);
  const { level }  = getXPProgress(totalXP);
  const winRate    = stats.totalGames > 0 ? Math.round((stats.gamesWon / stats.totalGames) * 100) : 0;

  // Pulse when daily reward ready
  const pulseScale = useSharedValue(1);
  React.useEffect(() => {
    if (canClaimDaily) {
      pulseScale.value = withRepeat(withSequence(withTiming(1.012, { duration: 850 }), withTiming(1, { duration: 850 })), -1, true);
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [canClaimDaily]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  async function handleClaim() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await claimDailyReward();
  }

  function navToGame(id: string) {
    router.push(`/game/${id}` as any);
  }

  // ── Filtered data ──
  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase();
    return SLOT_GAMES.filter(
      (g) => g.name.toLowerCase().includes(q) || g.category.includes(q),
    );
  }, [searchQuery, isSearching]);

  const featuredSlots = useMemo(
    () => SLOT_GAMES.filter((g) => g.badge === "HOT" || g.badge === "JACKPOT").slice(0, 8),
    [],
  );

  const favoriteGames = useMemo(
    () => SLOT_GAMES.filter((g) => favorites.includes(g.id)),
    [favorites],
  );

  // Categories to render (filtered or all)
  const categoriesToShow: SlotCategory[] = useMemo(() => {
    if (activeCategory !== "all") return [activeCategory];
    return CATEGORIES.map((c) => c.key);
  }, [activeCategory]);

  const gamesByCategory = useMemo(() => {
    const map: Record<string, SlotGame[]> = {};
    for (const c of CATEGORIES) {
      map[c.key] = SLOT_GAMES.filter((g) => g.category === c.key);
    }
    return map;
  }, []);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Sticky header ── */}
      <Animated.View
        entering={FadeInDown.duration(280)}
        style={[s.header, { paddingTop: topPad, borderBottomColor: colors.border }]}
      >
        <LinearGradient colors={["#13111F", colors.background]} style={StyleSheet.absoluteFill} />
        <Text style={[s.brand, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>🎰 LUCKY CASINO</Text>
        <View style={s.headerRight}>
          {currentStreak >= 2 && (
            <View style={[s.streakPill, { backgroundColor: "#FF3B5C14", borderColor: "#FF3B5C3A" }]}>
              <Text style={[s.streakTxt, { color: "#FF3B5C", fontFamily: "Inter_700Bold" }]}>🔥 {currentStreak}</Text>
            </View>
          )}
          <Pressable
            onPress={() => router.push("/profile" as any)}
            style={[s.lvlPill, { backgroundColor: colors.goldMuted, borderColor: colors.goldBorder }]}
          >
            <Text style={[s.lvlNum, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>{level}</Text>
            <Text style={[s.lvlLbl, { color: colors.gold + "AA", fontFamily: "Inter_400Regular" }]}>LVL</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Scroll body ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }} keyboardShouldPersistTaps="handled">

        {/* Balance hero card */}
        <Animated.View entering={FadeInDown.duration(380).delay(50).springify()} style={s.px}>
          <View style={[s.balCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
            <LinearGradient colors={["#F5C84214", "#9B5DE50A", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
            <View style={s.balGlob} />
            <Text style={[s.balLbl, { color: colors.textTertiary, fontFamily: "Inter_500Medium" }]}>VIRTUAL BALANCE</Text>
            <View style={s.balRow}>
              <Text style={[s.balIcon, { color: colors.gold }]}>◉</Text>
              <Text style={[s.balAmt, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>{formatCoins(balance)}</Text>
            </View>
            <Text style={[s.balChips, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>CHIPS</Text>
            <View style={[s.balDivider, { backgroundColor: colors.border }]} />
            <XPBar totalXP={totalXP} compact />
          </View>
        </Animated.View>

        {/* Daily reward */}
        <Animated.View entering={FadeInDown.duration(380).delay(100).springify()} style={s.px}>
          {canClaimDaily ? (
            <Animated.View style={pulseStyle}>
              <Pressable
                onPress={handleClaim}
                style={({ pressed }) => [s.rewardCard, { backgroundColor: colors.card, borderColor: colors.gold, shadowColor: colors.gold, opacity: pressed ? 0.9 : 1 }]}
              >
                <LinearGradient colors={["#F5C84220", "#9B5DE512", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Text style={s.rewardEmoji}>🎁</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.rewardTitle, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>Daily Bonus Ready!</Text>
                  <Text style={[s.rewardSub, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    Claim <Text style={{ color: colors.gold, fontFamily: "Inter_600SemiBold" }}>+{formatCoins(nextBonus)}</Text> chips
                    {consecutiveDailyDays > 0 ? ` · Day ${consecutiveDailyDays + 1}` : ""}
                  </Text>
                </View>
                <View style={[s.claimBtn, { backgroundColor: colors.gold, shadowColor: colors.gold }]}>
                  <Text style={[s.claimTxt, { fontFamily: "Inter_700Bold" }]}>CLAIM</Text>
                </View>
              </Pressable>
            </Animated.View>
          ) : (
            <View style={[s.rewardDim, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={s.rewardEmoji}>🎁</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.rewardTitle, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>Daily Bonus</Text>
                <Text style={[s.rewardSub, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>Day {consecutiveDailyDays + 1} · +{formatCoins(nextBonus)} chips</Text>
              </View>
              <View style={[s.timerPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Feather name="clock" size={11} color={colors.textTertiary} />
                <Text style={[s.timerTxt, { color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>{msToCountdown(dailyTimeLeft)}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Search bar */}
        <Animated.View entering={FadeInDown.duration(380).delay(150).springify()} style={s.px}>
          <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: isSearching ? colors.gold : colors.border }]}>
            <Feather name="search" size={16} color={isSearching ? colors.gold : colors.textTertiary} />
            <TextInput
              ref={searchRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search 24 games…"
              placeholderTextColor={colors.textTertiary}
              style={[s.searchInput, { color: colors.text, fontFamily: "Inter_400Regular" }]}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <Feather name="x-circle" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ── Search results ── */}
        {isSearching ? (
          <Animated.View entering={FadeInDown.duration(300).springify()} style={[s.px, { marginTop: 20 }]}>
            <View style={s.secRow}>
              <Text style={[s.secTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>RESULTS</Text>
              <View style={[s.secBadge, { backgroundColor: colors.goldMuted, borderColor: colors.goldBorder }]}>
                <Text style={[s.secBadgeTxt, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>{searchResults.length} found</Text>
              </View>
            </View>
            {searchResults.length === 0 ? (
              <View style={[s.emptySearch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={s.emptySearchEmoji}>🔍</Text>
                <Text style={[s.emptySearchTxt, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>No games match "{searchQuery}"</Text>
              </View>
            ) : (
              <View style={s.searchGrid}>
                {searchResults.map((game) => (
                  <SlotCard
                    key={game.id}
                    game={game}
                    width={GRID_CARD_W}
                    isFav={isFavorite(game.id)}
                    onFav={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavorite(game.id); }}
                    onPress={() => navToGame(game.id)}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        ) : (
          <>
            {/* ── Playable games carousel ── */}
            <Animated.View entering={FadeInDown.duration(380).delay(200).springify()}>
              <View style={[s.secRow, s.px, { marginTop: 24 }]}>
                <Text style={[s.secTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>PLAY NOW</Text>
                <View style={[s.secBadge, { backgroundColor: colors.goldMuted, borderColor: colors.goldBorder }]}>
                  <Text style={[s.secBadgeTxt, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>3 LIVE</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.carouselRow} snapToInterval={CARD_W + 14} decelerationRate="fast">
                {PLAY_GAMES.map((g) => (
                  <PlayCard
                    key={g.key}
                    g={g}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(`/${g.key}` as any); }}
                  />
                ))}
              </ScrollView>
            </Animated.View>

            {/* ── Quick stats ── */}
            <Animated.View entering={FadeInDown.duration(380).delay(250).springify()} style={[s.px, { marginTop: 20 }]}>
              <View style={s.statsRow}>
                {([
                  { lbl: "WIN RATE", val: stats.totalGames > 0 ? `${winRate}%` : "—", col: colors.green },
                  { lbl: "STREAK",   val: currentStreak > 0 ? `🔥 ${currentStreak}` : "0", col: currentStreak >= 3 ? "#FF3B5C" : colors.text },
                  { lbl: "BEST WIN", val: stats.biggestWin > 0 ? `+${formatCoins(stats.biggestWin)}` : "—", col: colors.gold },
                ] as const).map((stat) => (
                  <View key={stat.lbl} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.statVal, { color: stat.col, fontFamily: "Inter_700Bold" }]}>{stat.val}</Text>
                    <Text style={[s.statLbl, { color: colors.textTertiary, fontFamily: "Inter_400Regular" }]}>{stat.lbl}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* ─── SLOT LOBBY ─── */}

            {/* Divider */}
            <Animated.View entering={FadeInDown.duration(380).delay(290).springify()} style={[s.px, { marginTop: 28 }]}>
              <View style={[s.lobbyHeader, { borderColor: colors.goldBorder }]}>
                <LinearGradient colors={["#F5C84208", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
                <Text style={[s.lobbyTitle, { color: colors.gold, fontFamily: "Inter_700Bold" }]}>🎰  SLOT LOBBY</Text>
                <View style={[s.lobbyBadge, { backgroundColor: colors.goldMuted, borderColor: colors.goldBorder }]}>
                  <Text style={[s.lobbyBadgeTxt, { color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>24 GAMES</Text>
                </View>
              </View>
            </Animated.View>

            {/* Category filter pills */}
            <Animated.View entering={FadeInDown.duration(380).delay(320).springify()}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsRow}>
                {/* ALL pill */}
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setActiveCategory("all"); }}
                  style={[
                    s.filterPill,
                    activeCategory === "all"
                      ? { backgroundColor: colors.gold, borderColor: colors.gold }
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[s.filterPillTxt, {
                    color: activeCategory === "all" ? "#07070F" : colors.textSecondary,
                    fontFamily: activeCategory === "all" ? "Inter_700Bold" : "Inter_400Regular",
                  }]}>All</Text>
                </Pressable>
                {CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setActiveCategory(active ? "all" : cat.key);
                      }}
                      style={[
                        s.filterPill,
                        active
                          ? { backgroundColor: cat.color + "22", borderColor: cat.color }
                          : { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <Text style={s.filterPillEmoji}>{cat.emoji}</Text>
                      <Text style={[s.filterPillTxt, {
                        color: active ? cat.color : colors.textSecondary,
                        fontFamily: active ? "Inter_700Bold" : "Inter_400Regular",
                      }]}>{cat.label.split(" ")[0]}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Favorites section */}
            {favoriteGames.length > 0 && (
              <Animated.View entering={FadeInDown.duration(360).springify()}>
                <View style={[s.catRowHeader, { paddingHorizontal: 20, marginTop: 20 }]}>
                  <Text style={[s.catRowTitle, { color: "#FF3B5C", fontFamily: "Inter_700Bold" }]}>
                    ❤️{"  "}MY FAVORITES
                  </Text>
                  <View style={[s.catCount, { backgroundColor: "#FF3B5C20", borderColor: "#FF3B5C40" }]}>
                    <Text style={[s.catCountTxt, { color: "#FF3B5C", fontFamily: "Inter_600SemiBold" }]}>{favoriteGames.length}</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}>
                  {favoriteGames.map((game) => (
                    <SlotCard
                      key={game.id}
                      game={game}
                      width={SLOT_CARD_W}
                      isFav
                      onFav={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavorite(game.id); }}
                      onPress={() => navToGame(game.id)}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* HOT & FEATURED row (only when showing All) */}
            {activeCategory === "all" && (
              <Animated.View entering={FadeInDown.duration(380).delay(100).springify()}>
                <View style={[s.catRowHeader, { paddingHorizontal: 20, marginTop: 20 }]}>
                  <Text style={[s.catRowTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>🔥{"  "}HOT & FEATURED</Text>
                  <View style={[s.catCount, { backgroundColor: "#FF3B5C20", borderColor: "#FF3B5C40" }]}>
                    <Text style={[s.catCountTxt, { color: "#FF3B5C", fontFamily: "Inter_600SemiBold" }]}>{featuredSlots.length}</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}>
                  {featuredSlots.map((game) => (
                    <SlotCard
                      key={game.id}
                      game={game}
                      width={SLOT_CARD_W}
                      isFav={isFavorite(game.id)}
                      onFav={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFavorite(game.id); }}
                      onPress={() => navToGame(game.id)}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* Category rows */}
            {categoriesToShow.map((catKey) => (
              <CategoryRow
                key={catKey}
                catKey={catKey}
                games={gamesByCategory[catKey] ?? []}
                favorites={favorites}
                onToggleFav={toggleFavorite}
                onPressGame={navToGame}
              />
            ))}

            {/* Bottom padding spacer */}
            <View style={{ height: 16 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  px: { paddingHorizontal: 20, marginTop: 20 },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 13, borderBottomWidth: 1, overflow: "hidden", zIndex: 10 },
  brand: { fontSize: 17, letterSpacing: 0.4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  streakTxt: { fontSize: 13 },
  lvlPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  lvlNum: { fontSize: 15 },
  lvlLbl: { fontSize: 9, letterSpacing: 0.5 },

  // Balance card
  balCard: { borderRadius: 24, padding: 24, borderWidth: 1, overflow: "hidden", alignItems: "center", gap: 4, shadowColor: "#F5C842", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 10 },
  balGlob: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "#F5C84209", top: -70, alignSelf: "center" },
  balLbl: { fontSize: 10, letterSpacing: 2.5 },
  balRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  balIcon: { fontSize: 26 },
  balAmt: { fontSize: 52, letterSpacing: -1.5 },
  balChips: { fontSize: 9, letterSpacing: 3, marginTop: -4, marginBottom: 2 },
  balDivider: { width: "100%", height: 1, marginVertical: 12 },

  // Reward
  rewardCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 16, borderWidth: 1.5, overflow: "hidden", gap: 12, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  rewardDim: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 16, borderWidth: 1, gap: 12 },
  rewardEmoji: { fontSize: 30 },
  rewardTitle: { fontSize: 14 },
  rewardSub: { fontSize: 12 },
  claimBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 4 },
  claimTxt: { fontSize: 12, color: "#07070F", letterSpacing: 0.5 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  timerTxt: { fontSize: 13 },

  // Search
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  // Section headers
  secRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  secTitle: { fontSize: 12, letterSpacing: 1.5 },
  secBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  secBadgeTxt: { fontSize: 9, letterSpacing: 1 },

  // Playable game carousel
  carouselRow: { paddingHorizontal: 20, paddingBottom: 4, gap: 14 },
  playCard: { height: 172, borderRadius: 22, borderWidth: 1, overflow: "hidden", padding: 18, justifyContent: "space-between", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 8 },
  playCardGlow: { position: "absolute", width: 140, height: 140, borderRadius: 70, top: -35, right: -30, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 35 },
  playCardBody: { flexDirection: "row", alignItems: "center", gap: 14 },
  playEmoji: { fontSize: 52 },
  playTagline: { fontSize: 9, letterSpacing: 1.8 },
  playTitle: { fontSize: 22, lineHeight: 26 },
  playDesc: { fontSize: 12 },
  playBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 10 },
  playBtnTxt: { fontSize: 11, color: "#07070F", letterSpacing: 0.5 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 5, borderWidth: 1 },
  statVal: { fontSize: 19 },
  statLbl: { fontSize: 8, letterSpacing: 1 },

  // Lobby header
  lobbyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, overflow: "hidden" },
  lobbyTitle: { fontSize: 14, letterSpacing: 1 },
  lobbyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  lobbyBadgeTxt: { fontSize: 9, letterSpacing: 1 },

  // Category filter pills
  pillsRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  filterPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterPillEmoji: { fontSize: 12 },
  filterPillTxt: { fontSize: 12 },

  // Slot game card
  slotCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  thumb: { height: 110, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  thumbEmoji: { fontSize: 50 },
  badgePos: { position: "absolute", top: 8, left: 8 },
  heartPos: { position: "absolute", top: 8, right: 8 },
  badgePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  badgeTxt: { fontSize: 8, letterSpacing: 0.8 },
  cardInfo: { paddingHorizontal: 10, paddingVertical: 10, gap: 2 },
  cardName: { fontSize: 12 },
  cardMult: { fontSize: 11 },

  // Category row
  catRow: { marginTop: 24 },
  catRowHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  catRowTitle: { fontSize: 12, letterSpacing: 1.2 },
  catCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  catCountTxt: { fontSize: 9 },

  // Search grid
  searchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  emptySearch: { borderRadius: 18, padding: 30, borderWidth: 1, alignItems: "center", gap: 10 },
  emptySearchEmoji: { fontSize: 34 },
  emptySearchTxt: { fontSize: 14, textAlign: "center" },
});
