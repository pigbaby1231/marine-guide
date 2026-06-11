// 對候選清單中的物種抓取詳細資料，產出前端用的 species.json。
// 每種抓：iNat 分類階層、zh-TW 俗名、最多 5 張 CC 授權照片（含攝影者）、
// 中文維基摘要（缺則退英文維基）。
//
// 用法：
//   node scripts/fetch-species.mjs --pilot   試抓 15 種混合類群＋10 種海蛞蝓 → data/species-pilot.json
//   node scripts/fetch-species.mjs --full    海蛞蝓 120 種＋其他類群約 330 種 → data/species.json

import { readFileSync, writeFileSync } from "node:fs";

const INAT = "https://api.inaturalist.org/v1";
const dataDir = new URL("../data/", import.meta.url);

// 河海洄游或以淡水為主、不適合海洋圖鑑的物種，人工剔除
const EXCLUDE = new Set([
  "Monopterus albus", // 黃鱔
  "Oncorhynchus masou", // 櫻花鉤吻鮭
  "Anguilla marmorata", // 鱸鰻
  "Sicyopterus japonicus", // 日本禿頭鯊（溪流）
  "Stiphodon percnopterygionus", // 黑鰭枝牙鰕虎（溪流）
]);

const FULL_QUOTA = { 硬骨魚: 120 }; // 其他類群依候選檔配額，全收

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, { tolerate404 = false } = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "marine-guide-builder/0.1" } });
    if (res.ok) return res.json();
    if (res.status === 404 && tolerate404) return null;
    if (res.status === 429 || res.status >= 500) {
      await sleep(4000 * attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return null;
}

function pickAncestor(ancestors, rank) {
  return ancestors?.find((a) => a.rank === rank)?.name ?? "";
}

// 抓單一物種的 iNat 詳細資料
async function fetchTaxon(inatTaxonId) {
  const data = await getJSON(`${INAT}/taxa/${inatTaxonId}?locale=zh-TW`);
  const t = data?.results?.[0];
  if (!t) return null;
  const photos = (t.taxon_photos ?? [])
    .filter((tp) => tp.photo?.license_code) // 只取 CC 授權
    .slice(0, 5)
    .map((tp) => ({
      medium: tp.photo.medium_url ?? tp.photo.url,
      large: tp.photo.large_url ?? tp.photo.medium_url ?? tp.photo.url,
      attribution: tp.photo.attribution,
      license: tp.photo.license_code,
    }));
  return {
    scientificName: t.name,
    commonName: t.preferred_common_name ?? "",
    rank: t.rank,
    inatTaxonId: t.id,
    observationsGlobal: t.observations_count,
    wikipediaUrl: t.wikipedia_url ?? "",
    taxonomy: {
      phylum: pickAncestor(t.ancestors, "phylum"),
      class: pickAncestor(t.ancestors, "class"),
      order: pickAncestor(t.ancestors, "order"),
      family: pickAncestor(t.ancestors, "family"),
      genus: pickAncestor(t.ancestors, "genus"),
    },
    photos,
  };
}

// 維基摘要：先試中文（俗名→學名），再退英文
async function fetchWikiSummary(commonName, scientificName, enWikipediaUrl) {
  const zhTitles = [];
  if (commonName) zhTitles.push(commonName.split(/[（(\s/]/)[0].trim());
  zhTitles.push(scientificName);
  for (const title of zhTitles) {
    if (!title) continue;
    const d = await getJSON(
      `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { tolerate404: true }
    );
    if (d?.extract && d.type === "standard") {
      return { lang: "zh", text: d.extract, url: d.content_urls?.desktop?.page ?? "" };
    }
    await sleep(120);
  }
  if (enWikipediaUrl) {
    const title = decodeURIComponent(enWikipediaUrl.split("/wiki/")[1] ?? "");
    if (title) {
      const d = await getJSON(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { tolerate404: true }
      );
      if (d?.extract && d.type === "standard") {
        return { lang: "en", text: d.extract, url: d.content_urls?.desktop?.page ?? "" };
      }
    }
  }
  return null;
}

function selectSpecies(mode) {
  const seaslugs = JSON.parse(readFileSync(new URL("candidates-seaslugs.json", dataDir), "utf8"));
  const others = JSON.parse(readFileSync(new URL("candidates-others.json", dataDir), "utf8"));
  const ok = (r) => !EXCLUDE.has(r.scientificName);

  if (mode === "pilot") {
    // 各類群輪流取，湊 15 種混合 + 10 種海蛞蝓
    const groups = [...new Set(others.map((r) => r.group))];
    const mixed = [];
    for (let i = 0; mixed.length < 15; i++) {
      for (const g of groups) {
        const row = others.filter((r) => r.group === g && ok(r))[i];
        if (row && mixed.length < 15) mixed.push(row);
      }
    }
    return { seaslugs: seaslugs.filter(ok).slice(0, 10), others: mixed };
  }

  const counts = new Map();
  const othersFull = others.filter((r) => {
    if (!ok(r)) return false;
    const quota = FULL_QUOTA[r.group];
    if (!quota) return true;
    const n = (counts.get(r.group) ?? 0) + 1;
    counts.set(r.group, n);
    return n <= quota;
  });
  return { seaslugs: seaslugs.filter(ok).slice(0, 120), others: othersFull };
}

async function main() {
  const mode = process.argv.includes("--full") ? "full" : "pilot";
  const { seaslugs, others } = selectSpecies(mode);
  const queue = [
    ...seaslugs.map((r) => ({ ...r, isSeaslug: true })),
    ...others.map((r) => ({ ...r, isSeaslug: false })),
  ];
  console.log(`模式：${mode}　共 ${queue.length} 種（海蛞蝓 ${seaslugs.length}／其他 ${others.length}）`);

  const out = [];
  const failures = [];
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i];
    try {
      const taxon = await fetchTaxon(c.inatTaxonId);
      if (!taxon) throw new Error("iNat 查無此 taxon");
      await sleep(150);
      const wiki = await fetchWikiSummary(
        taxon.commonName || c.commonName,
        taxon.scientificName,
        taxon.wikipediaUrl
      );
      out.push({
        id: taxon.inatTaxonId,
        scientificName: taxon.scientificName,
        commonName: taxon.commonName || c.commonName,
        group: c.group,
        isSeaslug: c.isSeaslug,
        observationsTaiwan: c.observations,
        taxonomy: taxon.taxonomy,
        photos: taxon.photos,
        summary: wiki,
        links: {
          inat: `https://www.inaturalist.org/taxa/${taxon.inatTaxonId}`,
          wikipedia: wiki?.url ?? taxon.wikipediaUrl,
        },
      });
    } catch (e) {
      failures.push({ name: c.scientificName, error: e.message });
    }
    process.stdout.write(`進度 ${i + 1}/${queue.length}（失敗 ${failures.length}）\r`);
    await sleep(950);
  }
  console.log();

  // 品質統計
  const stat = (list, label) => {
    if (!list.length) return;
    const zhName = list.filter((s) => /[一-鿿]/.test(s.commonName)).length;
    const zhWiki = list.filter((s) => s.summary?.lang === "zh").length;
    const noPhoto = list.filter((s) => s.photos.length === 0).length;
    const avgPhotos = (list.reduce((a, s) => a + s.photos.length, 0) / list.length).toFixed(1);
    console.log(
      `${label}：${list.length} 種｜中文名 ${zhName}（${Math.round((zhName / list.length) * 100)}%）` +
        `｜中文維基 ${zhWiki}（${Math.round((zhWiki / list.length) * 100)}%）` +
        `｜平均照片 ${avgPhotos} 張｜無照片 ${noPhoto} 種`
    );
  };
  stat(out.filter((s) => s.isSeaslug), "海蛞蝓");
  stat(out.filter((s) => !s.isSeaslug), "其他類群");
  if (failures.length) console.log("失敗：", failures);

  const file = mode === "full" ? "species.json" : "species-pilot.json";
  writeFileSync(new URL(file, dataDir), JSON.stringify(out, null, 2));
  console.log(`輸出：data/${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
