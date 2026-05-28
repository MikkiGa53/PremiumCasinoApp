export type SlotCategory =
  | "classic" | "jackpot" | "fruits" | "vip" | "neon"
  | "adventure" | "egyptian" | "fantasy" | "lucky" | "retro";

export type BadgeType = "NEW" | "HOT" | "JACKPOT";

export interface SlotGame {
  id: string;
  name: string;
  emoji: string;
  category: SlotCategory;
  badge?: BadgeType;
  maxMultiplier: number;
  description: string;
  rtp: number;
  accent: string;
}

export interface CategoryMeta {
  key: SlotCategory;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "classic",   label: "Classic Slots",  emoji: "🎰", color: "#F5C842" },
  { key: "jackpot",   label: "Mega Jackpot",   emoji: "💎", color: "#FF6B35" },
  { key: "fruits",    label: "Fruits",          emoji: "🍒", color: "#FF3B5C" },
  { key: "vip",       label: "VIP",             emoji: "👑", color: "#9B5DE5" },
  { key: "neon",      label: "Neon",            emoji: "⚡", color: "#00D4FF" },
  { key: "adventure", label: "Adventure",       emoji: "🦁", color: "#00C851" },
  { key: "egyptian",  label: "Egyptian",        emoji: "🏺", color: "#FFB800" },
  { key: "fantasy",   label: "Fantasy",         emoji: "🐉", color: "#C84BFF" },
  { key: "lucky",     label: "Lucky",           emoji: "🍀", color: "#00D166" },
  { key: "retro",     label: "Retro",           emoji: "🕹️", color: "#FF9F00" },
];

export const SLOT_GAMES: SlotGame[] = [
  // ── Classic Slots ──
  {
    id: "lucky-7s",
    name: "Lucky 7s",
    emoji: "7️⃣",
    category: "classic",
    badge: "HOT",
    maxMultiplier: 15,
    description: "The legendary classic. Three 7s means maximum fortune. A timeless icon of the casino floor.",
    rtp: 96.5,
    accent: "#F5C842",
  },
  {
    id: "triple-bar",
    name: "Triple Bar",
    emoji: "🎰",
    category: "classic",
    badge: undefined,
    maxMultiplier: 12,
    description: "Bar symbols stacked three high. A timeless favourite that never goes out of style.",
    rtp: 95.8,
    accent: "#C49B0A",
  },
  {
    id: "diamond-spin",
    name: "Diamond Spin",
    emoji: "💠",
    category: "classic",
    badge: "NEW",
    maxMultiplier: 10,
    description: "Diamonds glitter on every reel. Shine bright and watch your balance grow.",
    rtp: 95.2,
    accent: "#00D4FF",
  },

  // ── Mega Jackpot ──
  {
    id: "mega-fortune",
    name: "Mega Fortune",
    emoji: "💎",
    category: "jackpot",
    badge: "JACKPOT",
    maxMultiplier: 100,
    description: "Life-changing jackpots await the bold. Spin and dream bigger than ever.",
    rtp: 96.0,
    accent: "#FF6B35",
  },
  {
    id: "golden-empire",
    name: "Golden Empire",
    emoji: "🏆",
    category: "jackpot",
    badge: "JACKPOT",
    maxMultiplier: 50,
    description: "Build your empire chip by chip. The gold is yours for the taking.",
    rtp: 95.5,
    accent: "#FFD700",
  },
  {
    id: "diamond-king",
    name: "Diamond King",
    emoji: "👑",
    category: "jackpot",
    badge: "HOT",
    maxMultiplier: 25,
    description: "The king of jackpots. One glorious spin to rule them all.",
    rtp: 96.2,
    accent: "#E040FB",
  },

  // ── Fruits ──
  {
    id: "fruit-frenzy",
    name: "Fruit Frenzy",
    emoji: "🍒",
    category: "fruits",
    badge: "HOT",
    maxMultiplier: 8,
    description: "A colourful explosion of cherries, lemons, and melons. Fast and fruity wins.",
    rtp: 96.5,
    accent: "#FF3B5C",
  },
  {
    id: "cherry-bliss",
    name: "Cherry Bliss",
    emoji: "🍑",
    category: "fruits",
    badge: undefined,
    maxMultiplier: 6,
    description: "Sweet and juicy wins on every spin. The orchard of fortune awaits.",
    rtp: 95.3,
    accent: "#FF6B8A",
  },
  {
    id: "watermelon-spin",
    name: "Watermelon Spin",
    emoji: "🍉",
    category: "fruits",
    badge: "NEW",
    maxMultiplier: 5,
    description: "Fresh-off-the-vine fun. Match the slices and taste sweet victory.",
    rtp: 95.0,
    accent: "#00C851",
  },

  // ── VIP ──
  {
    id: "vip-lounge",
    name: "VIP Lounge",
    emoji: "🥂",
    category: "vip",
    badge: undefined,
    maxMultiplier: 20,
    description: "Exclusive access to premium wins. For the distinguished few who play at the highest level.",
    rtp: 97.0,
    accent: "#9B5DE5",
  },
  {
    id: "platinum-palace",
    name: "Platinum Palace",
    emoji: "🏛️",
    category: "vip",
    badge: "HOT",
    maxMultiplier: 15,
    description: "Marble floors and golden reels. Welcome to the most prestigious game in the house.",
    rtp: 96.8,
    accent: "#C084FC",
  },

  // ── Neon ──
  {
    id: "neon-rush",
    name: "Neon Rush",
    emoji: "🌟",
    category: "neon",
    badge: "NEW",
    maxMultiplier: 10,
    description: "Neon lights flash with every winning combination. Feel the electric rush of victory.",
    rtp: 95.8,
    accent: "#00D4FF",
  },
  {
    id: "electric-storm",
    name: "Electric Storm",
    emoji: "⚡",
    category: "neon",
    badge: "HOT",
    maxMultiplier: 12,
    description: "High-voltage spins with electrifying payouts that light up the night.",
    rtp: 96.0,
    accent: "#7DF9FF",
  },

  // ── Adventure ──
  {
    id: "safari-wild",
    name: "Safari Wild",
    emoji: "🦁",
    category: "adventure",
    badge: undefined,
    maxMultiplier: 8,
    description: "Wild animals roam the reels for untamed riches. Brave the savanna for fortune.",
    rtp: 95.5,
    accent: "#00C851",
  },
  {
    id: "jungle-quest",
    name: "Jungle Quest",
    emoji: "🌿",
    category: "adventure",
    badge: "NEW",
    maxMultiplier: 6,
    description: "Trek through the jungle canopy in search of hidden treasure and ancient glory.",
    rtp: 95.2,
    accent: "#2ECC71",
  },

  // ── Egyptian ──
  {
    id: "pharaohs-gold",
    name: "Pharaoh's Gold",
    emoji: "🏺",
    category: "egyptian",
    badge: "JACKPOT",
    maxMultiplier: 30,
    description: "Unlock the secrets of the ancients. Infinite gold lies beneath the desert sands.",
    rtp: 96.3,
    accent: "#FFB800",
  },
  {
    id: "cleopatras-eye",
    name: "Cleopatra's Eye",
    emoji: "🔮",
    category: "egyptian",
    badge: "HOT",
    maxMultiplier: 15,
    description: "The all-seeing eye watches over your fortune. Align the symbols, claim the throne.",
    rtp: 95.9,
    accent: "#F0A500",
  },

  // ── Fantasy ──
  {
    id: "dragons-lair",
    name: "Dragon's Lair",
    emoji: "🐉",
    category: "fantasy",
    badge: "HOT",
    maxMultiplier: 20,
    description: "Enter the lair and claim the dragon's legendary treasure hoard for yourself.",
    rtp: 96.5,
    accent: "#C84BFF",
  },
  {
    id: "enchanted-forest",
    name: "Enchanted Forest",
    emoji: "🧙",
    category: "fantasy",
    badge: undefined,
    maxMultiplier: 12,
    description: "Magic spells and enchanted reels bring mystical wins from beyond the veil.",
    rtp: 95.7,
    accent: "#A78BFA",
  },

  // ── Lucky ──
  {
    id: "lucky-clover",
    name: "Lucky Clover",
    emoji: "🍀",
    category: "lucky",
    badge: "NEW",
    maxMultiplier: 10,
    description: "Four leaves, four fortunes. Let the luck of the Irish find you on every spin.",
    rtp: 96.0,
    accent: "#00D166",
  },
  {
    id: "fortune-dragon",
    name: "Fortune Dragon",
    emoji: "🐲",
    category: "lucky",
    badge: "HOT",
    maxMultiplier: 15,
    description: "The great dragon of fortune brings prosperity and abundance to every champion.",
    rtp: 96.2,
    accent: "#4ADE80",
  },
  {
    id: "golden-buddha",
    name: "Golden Buddha",
    emoji: "🪬",
    category: "lucky",
    badge: undefined,
    maxMultiplier: 8,
    description: "Meditate on your luck and let the sacred reels align in your favour.",
    rtp: 95.5,
    accent: "#FBBF24",
  },

  // ── Retro ──
  {
    id: "retro-arcade",
    name: "Retro Arcade",
    emoji: "🕹️",
    category: "retro",
    badge: "NEW",
    maxMultiplier: 8,
    description: "Eight-bit style reels take you back to the golden age of arcade gaming.",
    rtp: 95.0,
    accent: "#FF9F00",
  },
  {
    id: "classic-vegas",
    name: "Classic Vegas",
    emoji: "🎲",
    category: "retro",
    badge: "HOT",
    maxMultiplier: 10,
    description: "Old-school Vegas glamour. The original one-armed bandit in digital form.",
    rtp: 95.8,
    accent: "#FCA311",
  },
];
