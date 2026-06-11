// 從 iNaturalist 抓取台灣海域各類群的觀察數排行，產生候選物種清單。
// 「其他類群」會再用 WoRMS 過濾掉非海洋物種（例如淡水魚、淡水蝦蟹）。
// 輸出：data/candidates-seaslugs.{json,md}、data/candidates-others.{json,md}

import { writeFileSync, mkdirSync } from "node:fs";

const TAIWAN_PLACE_ID = 7887;
const INAT = "https://api.inaturalist.org/v1";
const WORMS = "https://www.marinespecies.org/rest";

// 海蛞蝓：異鰓類底下的各目（iNat taxon 名稱）
const SEASLUG_GROUPS = [
  { label: "裸鰓目", query: "Nudibranchia", rank: "order" },
  { label: "囊舌目", query: "Sacoglossa", rank: "order" },
  { label: "海兔（無楯目）", query: "Aplysiida", rank: "order" },
  { label: "頭楯目", query: "Cephalaspidea", rank: "order" },
  { label: "側鰓目", query: "Pleurobranchida", rank: "order" },
];

// 其他類群：label、iNat 查詢名、要取的候選數量
const OTHER_GROUPS = [
  { label: "硬骨魚", query: "Actinopterygii", rank: "class", take: 150 },
  { label: "軟骨魚（鯊・魟）", query: "Elasmobranchii", rank: "subclass", take: 20 },
  { label: "十足目（蝦蟹）", query: "Decapoda", rank: "order", take: 60 },
  { label: "口足目（蝦蛄）", query: "Stomatopoda", rank: "order", take: 10 },
  { label: "刺絲胞動物（珊瑚・水母・海葵）", query: "Cnidaria", rank: "phylum", take: 50 },
  { label: "棘皮動物", query: "Echinodermata", rank: "phylum", take: 40 },
  { label: "頭足類（章魚・烏賊）", query: "Cephalopoda", rank: "class", take: 20 },
  { label: "海洋哺乳類（鯨豚）", query: "Cetacea", rank: "infraorder", take: 12 },
  { label: "海龜", query: "Cheloniidae", rank: "family", take: 5 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "marine-guide-builder/0.1" } });
    if (res.ok) return res.json();
    if (res.status === 429) {
      await sleep(5000 * attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  throw new Error(`Rate limited repeatedly: ${url}`);
}

async function resolveTaxonId(query) {
  const data = await getJSON(`${INAT}/taxa?q=${encodeURIComponent(query)}&per_page=30`);
  const hit = data.results.find((t) => t.name === query && t.is_active) ?? data.results[0];
  if (!hit) throw new Error(`Taxon not found: ${query}`);
  return { id: hit.id, name: hit.name };
}

// 台灣境內某 taxon 的物種觀察數排行（含 zh-TW 俗名與代表照片）
async function speciesCounts(taxonId, maxResults) {
  const out = [];
  for (let page = 1; out.length < maxResults && page <= 3; page++) {
    const url =
      `${INAT}/observations/species_counts?place_id=${TAIWAN_PLACE_ID}` +
      `&taxon_id=${taxonId}&verifiable=true&photos=true&locale=zh-TW` +
      `&per_page=200&page=${page}`;
    const data = await getJSON(url);
    for (const r of data.results) {
      if (r.taxon.rank !== "species") continue; // 略過只鑑定到屬以上的
      out.push({
        scientificName: r.taxon.name,
        commonName: r.taxon.preferred_common_name ?? "",
        observations: r.count,
        inatTaxonId: r.taxon.id,
        photo: r.taxon.default_photo?.medium_url ?? "",
      });
    }
    if (data.results.length < 200) break;
    await sleep(1100); // iNat 禮貌性節流
  }
  return out.slice(0, maxResults);
}

// WoRMS 批次比對學名，回傳 Map<學名, {isMarine, isBrackish, isFreshwater}>
async function wormsMarineFlags(names) {
  const flags = new Map();
  const BATCH = 20;
  for (let i = 0; i < names.length; i += BATCH) {
    const batch = names.slice(i, i + BATCH);
    const qs = batch.map((n) => `scientificnames[]=${encodeURIComponent(n)}`).join("&");
    try {
      const res = await fetch(`${WORMS}/AphiaRecordsByMatchNames?${qs}&marine_only=false`);
      if (res.ok) {
        const data = await res.json();
        data.forEach((records, idx) => {
          const rec = records?.find((r) => r.status === "accepted") ?? records?.[0];
          if (rec) {
            flags.set(batch[idx], {
              isMarine: rec.isMarine === 1,
              isBrackish: rec.isBrackish === 1,
              isFreshwater: rec.isFreshwater === 1,
            });
          }
        });
      } else if (res.status !== 204) {
        console.warn(`  WoRMS batch ${i / BATCH + 1}: HTTP ${res.status}（該批視為未知，先保留）`);
      }
    } catch (e) {
      console.warn(`  WoRMS batch ${i / BATCH + 1} 失敗：${e.message}（該批視為未知，先保留）`);
    }
    process.stdout.write(`  WoRMS 海洋性檢查 ${Math.min(i + BATCH, names.length)}/${names.length}\r`);
    await sleep(1200);
  }
  console.log();
  return flags;
}

function toMarkdown(title, rows) {
  const lines = [
    `# ${title}`,
    "",
    `產生時間：${new Date().toISOString().slice(0, 10)}　來源：iNaturalist 台灣觀察數排行`,
    "",
    "| # | 學名 | 中文名 | 類群 | 觀察數 |",
    "|---|------|--------|------|--------|",
  ];
  rows.forEach((r, i) => {
    lines.push(`| ${i + 1} | *${r.scientificName}* | ${r.commonName || "—"} | ${r.group} | ${r.observations} |`);
  });
  return lines.join("\n") + "\n";
}

async function main() {
  mkdirSync(new URL("../data/", import.meta.url), { recursive: true });

  // ---------- 海蛞蝓 ----------
  console.log("=== 海蛞蝓候選清單 ===");
  const seaslugs = [];
  for (const g of SEASLUG_GROUPS) {
    const taxon = await resolveTaxonId(g.query);
    const rows = await speciesCounts(taxon.id, 200);
    rows.forEach((r) => seaslugs.push({ ...r, group: g.label }));
    console.log(`${g.label}（${g.query}, taxon ${taxon.id}）：${rows.length} 種`);
    await sleep(1100);
  }
  seaslugs.sort((a, b) => b.observations - a.observations);

  // ---------- 其他類群 ----------
  console.log("\n=== 其他類群候選清單 ===");
  const others = [];
  for (const g of OTHER_GROUPS) {
    const taxon = await resolveTaxonId(g.query);
    const rows = await speciesCounts(taxon.id, g.take * 2); // 多抓一倍，留過濾空間
    rows.forEach((r) => others.push({ ...r, group: g.label, take: g.take }));
    console.log(`${g.label}（${g.query}, taxon ${taxon.id}）：抓到 ${rows.length} 種`);
    await sleep(1100);
  }

  // WoRMS 過濾非海洋物種（查無資料者保留，人工再確認）
  console.log("\n用 WoRMS 過濾非海洋物種…");
  const flags = await wormsMarineFlags(others.map((r) => r.scientificName));
  const dropped = [];
  const marine = others.filter((r) => {
    const f = flags.get(r.scientificName);
    if (!f || !f.isMarine) {
      dropped.push({ ...r, reason: f ? "WoRMS 標記非海洋" : "WoRMS 查無紀錄" });
      return false;
    }
    return true;
  });
  // 每類群取回原定數量
  const byGroup = new Map();
  for (const r of marine) {
    const list = byGroup.get(r.group) ?? [];
    if (list.length < r.take) list.push(r);
    byGroup.set(r.group, list);
  }
  const othersFinal = [...byGroup.values()].flat();
  console.log(`過濾前 ${others.length} 種 → 海洋物種 ${marine.length} 種 → 依配額取 ${othersFinal.length} 種`);

  // ---------- 輸出 ----------
  const dataDir = new URL("../data/", import.meta.url);
  writeFileSync(new URL("candidates-seaslugs.json", dataDir), JSON.stringify(seaslugs, null, 2));
  writeFileSync(new URL("candidates-seaslugs.md", dataDir), toMarkdown("海蛞蝓候選物種清單", seaslugs));
  writeFileSync(new URL("candidates-others.json", dataDir), JSON.stringify(othersFinal, null, 2));
  writeFileSync(new URL("candidates-others.md", dataDir), toMarkdown("其他類群候選物種清單", othersFinal));
  writeFileSync(
    new URL("candidates-dropped.md", dataDir),
    toMarkdown("被過濾掉的物種（人工複查用）", dropped.map((r) => ({ ...r, group: `${r.group}／${r.reason}` })))
  );
  console.log(`\n完成：海蛞蝓 ${seaslugs.length} 種、其他類群 ${othersFinal.length} 種`);
  console.log("輸出：data/candidates-seaslugs.md、data/candidates-others.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
