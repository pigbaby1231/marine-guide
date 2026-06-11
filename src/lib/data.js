import speciesRaw from "../../data/species.json";
import seaslugTraits from "../../data/seaslug-traits.json";

export const species = speciesRaw;

export const byId = new Map(species.map((s) => [String(s.id), s]));

// 類群順序（首頁與導覽列用）
const GROUP_ORDER = [
  "海蛞蝓",
  "硬骨魚",
  "軟骨魚（鯊・魟）",
  "十足目（蝦蟹）",
  "口足目（蝦蛄）",
  "刺絲胞動物（珊瑚・水母・海葵）",
  "棘皮動物",
  "頭足類（章魚・烏賊）",
  "海洋哺乳類（鯨豚）",
  "海龜",
];

// 海蛞蝓物種的 group 欄位是「裸鰓目」等子類群，統一掛在「海蛞蝓」大類下
export function topGroup(s) {
  return s.isSeaslug ? "海蛞蝓" : s.group;
}

export const groups = GROUP_ORDER.map((name) => ({
  name,
  list: species
    .filter((s) => topGroup(s) === name)
    .sort((a, b) => b.observationsTaiwan - a.observationsTaiwan),
})).filter((g) => g.list.length > 0);

export const seaslugOrders = [...new Set(species.filter((s) => s.isSeaslug).map((s) => s.group))];

// 海蛞蝓加值資訊：先查科，查不到退到目（類群）層級的通用描述
export function seaslugInfo(s) {
  if (!s.isSeaslug) return null;
  return seaslugTraits.families[s.taxonomy.family] ?? seaslugTraits.orders[s.group] ?? null;
}

// 相似種：同科的其他海蛞蝓（外觀最容易混淆的範圍）
export function similarSeaslugs(s, limit = 6) {
  if (!s.isSeaslug) return [];
  return species
    .filter((x) => x.isSeaslug && x.id !== s.id && x.taxonomy.family === s.taxonomy.family)
    .sort((a, b) => b.observationsTaiwan - a.observationsTaiwan)
    .slice(0, limit);
}

export function displayName(s) {
  return s.commonName || s.scientificName;
}
