/**
 * ARS-BG-PRO: Curated Professional Color Palettes Library
 * 
 * Handcrafted, designer-approved 4 to 6-color palettes with harmonic color distribution.
 */

export interface ColorHuntPalette {
  id: string
  name: string
  category:
    | "vintage"
    | "pastel"
    | "neon"
    | "warm"
    | "cold"
    | "summer"
    | "autumn"
    | "dark"
    | "luxury"
  colors: string[]
  likes?: number
}

export const COLOR_HUNT_CATEGORIES = [
  { id: "all", label: "All Palettes" },
  { id: "vintage", label: "Vintage & Retro" },
  { id: "pastel", label: "Pastel Dream" },
  { id: "neon", label: "Neon & Cyber" },
  { id: "warm", label: "Warm Sunset" },
  { id: "cold", label: "Cold Ocean" },
  { id: "summer", label: "Summer Vibrant" },
  { id: "autumn", label: "Autumn Earthy" },
  { id: "dark", label: "Dark & Moody" },
  { id: "luxury", label: "Gold & Luxury" },
] as const

export const COLOR_HUNT_PALETTES: ColorHuntPalette[] = [
  // --- VINTAGE & RETRO ---
  {
    id: "vintage-1",
    name: "70s Vinyl Lounge",
    category: "vintage",
    colors: ["#2B2A4C", "#EA906C", "#EEE2DE", "#B31312"],
    likes: 8420,
  },
  {
    id: "vintage-2",
    name: "Burnt Terracotta",
    category: "vintage",
    colors: ["#865D36", "#A68868", "#E3C8AC", "#93785B", "#493323"],
    likes: 7190,
  },
  {
    id: "vintage-3",
    name: "Antique Parchment",
    category: "vintage",
    colors: ["#393053", "#443C68", "#635985", "#18122B"],
    likes: 6540,
  },
  {
    id: "vintage-4",
    name: "Retro Cassette",
    category: "vintage",
    colors: ["#FF6000", "#FFA559", "#FFE6C7", "#454545"],
    likes: 9120,
  },
  {
    id: "vintage-5",
    name: "Aged Letterpress",
    category: "vintage",
    colors: ["#5B9A8B", "#445069", "#F7E987", "#252B48"],
    likes: 5880,
  },
  {
    id: "vintage-6",
    name: "Dusty Olive Grooves",
    category: "vintage",
    colors: ["#40514E", "#2F3E46", "#354F52", "#52796F", "#84A98C"],
    likes: 6730,
  },
  {
    id: "vintage-7",
    name: "Vintage Bookstore",
    category: "vintage",
    colors: ["#2D2727", "#413543", "#8F43EE", "#F0EB8D"],
    likes: 7450,
  },

  // --- PASTEL DREAM ---
  {
    id: "pastel-1",
    name: "Cotton Candy Cloud",
    category: "pastel",
    colors: ["#F4EEFF", "#DCD6F7", "#A6B1E1", "#424874"],
    likes: 12400,
  },
  {
    id: "pastel-2",
    name: "Lavender Whisper",
    category: "pastel",
    colors: ["#FFC7EA", "#D8B4F8", "#C4C1E0", "#FBF9F1"],
    likes: 9800,
  },
  {
    id: "pastel-3",
    name: "Mint Frosting",
    category: "pastel",
    colors: ["#E8F9FD", "#79DAE8", "#0AA1DD", "#2155CD"],
    likes: 8900,
  },
  {
    id: "pastel-4",
    name: "Peach Milkshake",
    category: "pastel",
    colors: ["#FFE6E6", "#FFC7C7", "#8785A2", "#F6F6F6"],
    likes: 7600,
  },
  {
    id: "pastel-5",
    name: "Baby Sky & Cream",
    category: "pastel",
    colors: ["#E0F4FF", "#87C4FF", "#39A7FF", "#FFEED9"],
    likes: 8250,
  },
  {
    id: "pastel-6",
    name: "Matcha Macaron",
    category: "pastel",
    colors: ["#C7E9B0", "#DDFFBB", "#B3E5BE", "#F9F5EB"],
    likes: 6100,
  },

  // --- NEON & CYBERPUNK ---
  {
    id: "neon-1",
    name: "Tokyo Synthwave",
    category: "neon",
    colors: ["#00F0FF", "#7000FF", "#FF007A", "#10002B"],
    likes: 15300,
  },
  {
    id: "neon-2",
    name: "Laser Matrix",
    category: "neon",
    colors: ["#00FFC6", "#050505", "#08D9D6", "#FF2E93"],
    likes: 11200,
  },
  {
    id: "neon-3",
    name: "Cyber Violet & Lime",
    category: "neon",
    colors: ["#FA26A0", "#05DFD7", "#FFF591", "#303960"],
    likes: 8940,
  },
  {
    id: "neon-4",
    name: "Electric Sunset",
    category: "neon",
    colors: ["#120024", "#FF007F", "#00F0FF", "#7928CA"],
    likes: 13400,
  },
  {
    id: "neon-5",
    name: "Radioactive Pulse",
    category: "neon",
    colors: ["#00FF66", "#03203A", "#0EA5A4", "#7DD3C0"],
    likes: 7890,
  },

  // --- WARM & SUNSET ---
  {
    id: "warm-1",
    name: "Golden Hour Mirage",
    category: "warm",
    colors: ["#FF4C29", "#334756", "#2C394B", "#082032"],
    likes: 10450,
  },
  {
    id: "warm-2",
    name: "Tuscan Sunset",
    category: "warm",
    colors: ["#FF884B", "#FFD384", "#FFF9B0", "#34B3F1"],
    likes: 8750,
  },
  {
    id: "warm-3",
    name: "Fiery Horizon",
    category: "warm",
    colors: ["#FD5D5D", "#FFB830", "#FF8E9E", "#FFEFEF"],
    likes: 9230,
  },
  {
    id: "warm-4",
    name: "Apricot Amber",
    category: "warm",
    colors: ["#FF9F45", "#FFBC80", "#F76E11", "#FC4F4F"],
    likes: 6790,
  },
  {
    id: "warm-5",
    name: "Desert Dune Campfire",
    category: "warm",
    colors: ["#2B0908", "#DC2626", "#FACC15", "#EA580C"],
    likes: 8120,
  },

  // --- COLD & OCEAN ---
  {
    id: "cold-1",
    name: "Deep Ocean Trench",
    category: "cold",
    colors: ["#001C30", "#176B87", "#64CCC5", "#DAFFFB"],
    likes: 13800,
  },
  {
    id: "cold-2",
    name: "Aegean Sea Foam",
    category: "cold",
    colors: ["#0B2447", "#19376D", "#576CBC", "#A5D7E8"],
    likes: 10900,
  },
  {
    id: "cold-3",
    name: "Arctic Glacier",
    category: "cold",
    colors: ["#1D3557", "#457B9D", "#A8DADC", "#F1FAEE"],
    likes: 14200,
  },
  {
    id: "cold-4",
    name: "Nordic Fjord",
    category: "cold",
    colors: ["#083344", "#0891B2", "#22D3EE", "#A5F3FC"],
    likes: 7400,
  },

  // --- SUMMER & VIBRANT ---
  {
    id: "summer-1",
    name: "Tropical Papaya",
    category: "summer",
    colors: ["#F94A29", "#FCE22A", "#30E3DF", "#116A7B"],
    likes: 9940,
  },
  {
    id: "summer-2",
    name: "Ibiza Pool Party",
    category: "summer",
    colors: ["#F24C3D", "#F29727", "#F2BE22", "#22A699"],
    likes: 8810,
  },
  {
    id: "summer-3",
    name: "Watermelon Slice",
    category: "summer",
    colors: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C"],
    likes: 11600,
  },
  {
    id: "summer-4",
    name: "Sunny Citrus",
    category: "summer",
    colors: ["#FFF4B8", "#FFD23F", "#FF8C42", "#B5E655"],
    likes: 7200,
  },

  // --- AUTUMN & EARTHY ---
  {
    id: "autumn-1",
    name: "Cinnamon Maple Leaf",
    category: "autumn",
    colors: ["#583101", "#603808", "#6F4E37", "#8B5E3C", "#DDB892"],
    likes: 7850,
  },
  {
    id: "autumn-2",
    name: "Spiced Pumpkin Latte",
    category: "autumn",
    colors: ["#4A3E3D", "#8C6239", "#C49767", "#E8C5A5"],
    likes: 6940,
  },
  {
    id: "autumn-3",
    name: "Forest Moss & Bark",
    category: "autumn",
    colors: ["#0D2B1D", "#00B87C", "#00E5FF", "#00473E", "#FAAE2B"],
    likes: 8320,
  },

  // --- DARK & MOODY ---
  {
    id: "dark-1",
    name: "Midnight Espresso",
    category: "dark",
    colors: ["#1A120B", "#3C2A21", "#D5CEA3", "#E5E5CB"],
    likes: 12100,
  },
  {
    id: "dark-2",
    name: "Obsidian & Amber",
    category: "dark",
    colors: ["#000000", "#14213D", "#FCA311", "#E5E5E5"],
    likes: 14700,
  },
  {
    id: "dark-3",
    name: "Cyber Charcoal",
    category: "dark",
    colors: ["#1E1E24", "#222831", "#393E46", "#00ADB5"],
    likes: 9550,
  },
  {
    id: "dark-4",
    name: "Gothic Amethyst",
    category: "dark",
    colors: ["#0B1026", "#1B2A6B", "#4F46E5", "#7C3AED"],
    likes: 10300,
  },

  // --- LUXURY & GOLD ---
  {
    id: "luxury-1",
    name: "Champagne Royale",
    category: "luxury",
    colors: ["#D4AF37", "#1C1C1C", "#F7F7F7", "#2C2C2C"],
    likes: 13200,
  },
  {
    id: "luxury-2",
    name: "Rose Gold & Slate",
    category: "luxury",
    colors: ["#B76E79", "#2C3E50", "#ECF0F1", "#95A5A6"],
    likes: 8640,
  },
  {
    id: "luxury-3",
    name: "Emerald & Brushed Brass",
    category: "luxury",
    colors: ["#044343", "#0B666A", "#35A29F", "#97FEED", "#E0A96D"],
    likes: 9150,
  },
]

/**
 * Returns a random palette from Color Hunt collections.
 */
export function getRandomColorHuntPalette(category?: string): ColorHuntPalette {
  const filtered =
    category && category !== "all"
      ? COLOR_HUNT_PALETTES.filter((p) => p.category === category)
      : COLOR_HUNT_PALETTES
  return filtered[Math.floor(Math.random() * filtered.length)]
}
