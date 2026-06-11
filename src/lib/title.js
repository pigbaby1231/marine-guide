import { watchEffect } from "vue";

const SITE = "海洋生物圖鑑";

// 在頁面元件 setup 中呼叫，依內容動態設定瀏覽器分頁標題
export function usePageTitle(getter) {
  watchEffect(() => {
    const t = getter();
    document.title = t ? `${t}｜${SITE}` : SITE;
  });
}
