# 🌊 海洋生物圖鑑

收錄台灣海域常見海洋生物的線上圖鑑，**海蛞蝓深度收錄**。
照片與觀察紀錄來自 [iNaturalist](https://www.inaturalist.org/) 社群的真實觀察。

**線上版：<https://pigbaby1231.github.io/marine-guide/>**

## 收錄內容

| 類群 | 種數 |
|------|-----:|
| 海蛞蝓（裸鰓目、囊舌目、海兔、頭楯目、側鰓目） | 120 |
| 硬骨魚 | 120 |
| 十足目（蝦蟹） | 60 |
| 刺絲胞動物（珊瑚・水母・海葵） | 50 |
| 棘皮動物 | 40 |
| 軟骨魚（鯊・魟）、頭足類、鯨豚、蝦蛄、海龜 | 66 |
| **合計** | **456** |

物種依 iNaturalist 台灣觀察數排序篩選，並以 WoRMS 海洋性標記過濾淡水物種。

## 功能

- **分類瀏覽**：十大類群照片牆；海蛞蝓可再依五大目篩選
- **搜尋**：中文名／學名／科屬名模糊搜尋（Fuse.js）
- **物種頁**：多張 CC 授權照片（含攝影者標註）、中／英文簡介、分類階層、外部連結
- **海蛞蝓觀察筆記**：每種海蛞蝓附科級辨識特徵、食性、觀察小提示，與同科相似種比對
- **入門文章**：〈認識海蛞蝓〉——三個辨識部位、五大類群、棲地口訣

## 開發

```bash
npm install
npm run dev        # 開發伺服器
npm run build      # 正式建置（輸出 dist/）
```

推到 `main` 分支會由 GitHub Actions 自動建置並部署到 GitHub Pages。

## 資料管線

圖鑑資料是建置期預先抓取的靜態 JSON（`data/species.json`），不在執行期呼叫外部 API。
要更新資料：

```bash
npm run fetch:candidates   # 1. 從 iNat 台灣觀察排行產生候選清單（WoRMS 過濾淡水種）
npm run fetch:species      # 2. 批次抓取物種詳細資料（照片、分類、維基摘要）
npm run backfill           # 3. 補抓缺漏的維基摘要（單線＋429 退避，可重複執行）
```

海蛞蝓的科級特徵資料（`data/seaslug-traits.json`）為人工編寫。

## 技術

Vue 3 · vue-router（hash 模式）· Tailwind CSS 4 · Fuse.js · Vite

## 資料來源與授權

- 物種資料、照片：[iNaturalist](https://www.inaturalist.org/)（照片依各自標示之 CC 授權，版權屬原攝影者）
- 海洋性判定：[WoRMS — World Register of Marine Species](https://www.marinespecies.org/)
- 物種簡介：[Wikipedia](https://www.wikipedia.org/)（CC BY-SA）

## 後續規畫

- [ ] 測驗模式（看照片猜物種、相似種二選一）
- [ ] 「我的圖鑑」收集進度（localStorage）
- [ ] 特徵篩選器（顏色 × 類群，海蛞蝓優先）
