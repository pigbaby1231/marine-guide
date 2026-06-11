// 補齊 species.json 中缺少摘要的物種：用學名查英文維基（順手再試一次中文）。
// 可重複執行，只處理 summary 為 null 的物種。

import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../data/species.json", import.meta.url);
const species = JSON.parse(readFileSync(file, "utf8"));
const todo = species.filter((s) => !s.summary);
console.log(`缺摘要：${todo.length} 種`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function summaryOf(lang, title) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      // Wikimedia 會擋沒有識別性 User-Agent 的請求；429 依 Retry-After 退避
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { headers: { "User-Agent": "marine-guide/0.1 (personal field guide builder)" } }
      );
      if (res.status === 429) {
        await sleep((Number(res.headers.get("retry-after")) || 3) * 1000);
        continue;
      }
      if (!res.ok) return null;
      const d = await res.json();
      if (d?.extract && d.type === "standard") {
        return { lang, text: d.extract, url: d.content_urls?.desktop?.page ?? "" };
      }
      return null;
    } catch {
      await sleep(2000);
    }
  }
  return null;
}

let filled = 0;
for (let i = 0; i < todo.length; i++) {
  const s = todo[i];
  const zhTitle = (s.commonName || "").split(/[（(\s/]/)[0].trim();
  let wiki = zhTitle ? await summaryOf("zh", zhTitle) : null;
  if (!wiki) wiki = await summaryOf("en", s.scientificName);
  if (wiki) {
    s.summary = wiki;
    if (!s.links.wikipedia) s.links.wikipedia = wiki.url;
    filled++;
  }
  process.stdout.write(`進度 ${i + 1}/${todo.length}（補到 ${filled}）\r`);
  await sleep(250);
}
console.log();

writeFileSync(file, JSON.stringify(species, null, 2));
const left = species.filter((s) => !s.summary).length;
console.log(`完成：補上 ${filled} 種，仍無摘要 ${left} 種`);
