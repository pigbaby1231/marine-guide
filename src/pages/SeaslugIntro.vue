<script setup>
import { species } from "../lib/data.js";
import { usePageTitle } from "../lib/title.js";

usePageTitle(() => "認識海蛞蝓");

// 每個類群挑台灣觀察數最高、有照片的物種當代表
function representative(order) {
  return species
    .filter((s) => s.isSeaslug && s.group === order && s.photos.length)
    .sort((a, b) => b.observationsTaiwan - a.observationsTaiwan)[0];
}

const sections = [
  {
    order: "裸鰓目",
    latin: "Nudibranchia",
    text: "海蛞蝓裡最大、最繽紛的一群，成體完全沒有殼。再分兩大類：「多西海蛞蝓」背部後方有一圈像羽毛撢子的鰓羽，代表是各種多彩海蛞蝓和葉海麒麟；「枝背海蛞蝓」背上則是成排的露鰓（cerata），像穿了蓑衣，很多種還會把獵物的刺細胞偷來放在露鰓末端自衛。",
  },
  {
    order: "囊舌目",
    latin: "Sacoglossa",
    text: "吃素的海蛞蝓，齒舌特化成單列尖齒，刺進藻類細胞吸汁。最神奇的是「盜葉綠體」：把吃進來的葉綠體留在體內繼續行光合作用，所以多數成員是綠色系。代表是各種海天牛（Elysia），體側有一對翅膀般的側足。",
  },
  {
    order: "海兔（無楯目）",
    latin: "Aplysiida",
    text: "海蛞蝓中的大塊頭，頭上一對耳朵般的嗅角是名字的由來。吃海藻，春夏在潮間帶很常見。受到騷擾會噴出紫色墨汁。體內還留有一片退化的薄殼。",
  },
  {
    order: "頭楯目",
    latin: "Cephalaspidea",
    text: "頭部有一塊鏟狀「頭盾」，方便在沙裡犁地前進，多數還保有外殼（像氣泡一樣薄透的殼或卵圓形的殼）。住在沙地和藻場，跟住礁區的裸鰓目分據不同棲地。有些成員（擬海牛科）是兇猛的獵人，會追蹤其他海蛞蝓的黏液軌跡捕食。",
  },
  {
    order: "側鰓目",
    latin: "Pleurobranchida",
    text: "鰓不在背上也不外露——一片羽毛狀的鰓藏在身體右側。多數夜行性，能分泌強酸禦敵。體型常比其他海蛞蝓大上一圈。",
  },
].map((sec) => ({ ...sec, rep: representative(sec.order) }));
</script>

<template>
  <article class="mx-auto max-w-3xl">
    <h1 class="text-3xl font-bold">認識海蛞蝓</h1>
    <p class="mt-3 leading-relaxed text-slate-700">
      「海蛞蝓」不是一個正式的分類名稱，而是對一群<strong>殼退化或消失的海洋腹足類</strong>（異鰓類
      Heterobranchia）的俗稱。牠們放棄了堅硬的殼，改用毒素、強酸、偷來的刺細胞和警戒色保護自己——
      也因此演化出腹足類中最張揚的顏色。多數種類體長只有 1～5 公分，移動緩慢，是潛水和潮間帶觀察的人氣主角。
    </p>

    <h2 class="mt-8 text-xl font-bold">認海蛞蝓的三個部位</h2>
    <ul class="mt-3 space-y-2 leading-relaxed text-slate-700">
      <li>
        <strong>嗅角（rhinophores）</strong>：頭頂的一對「天線」，用來聞水中的化學訊號。
        是層板狀、光滑還是有環紋，是分科的重要線索。
      </li>
      <li>
        <strong>鰓</strong>：長在哪裡決定了大分類——背後方一圈羽毛（多西海蛞蝓）、
        滿背的露鰓（蓑海蛞蝓類）、藏在身體側邊（側鰓目、葉海麒麟），還是根本用皮膚呼吸。
      </li>
      <li>
        <strong>體色與花紋</strong>：同屬的種常靠邊框顏色層次、斑點分布來區分。
        拍照時把背面、嗅角、鰓都拍清楚，回家才好查。
      </li>
    </ul>

    <h2 class="mt-8 text-xl font-bold">五大類群</h2>
    <div class="mt-4 space-y-6">
      <section v-for="sec in sections" :key="sec.order" class="flex gap-4 rounded-2xl bg-white p-4 shadow">
        <RouterLink
          v-if="sec.rep"
          :to="`/species/${sec.rep.id}`"
          class="hidden h-32 w-32 shrink-0 overflow-hidden rounded-xl sm:block"
        >
          <img :src="sec.rep.photos[0].medium" :alt="sec.rep.commonName" class="h-full w-full object-cover" />
        </RouterLink>
        <div>
          <h3 class="font-bold">
            {{ sec.order }} <span class="ml-1 text-sm font-normal italic text-slate-400">{{ sec.latin }}</span>
          </h3>
          <p class="mt-1 text-sm leading-relaxed text-slate-700">{{ sec.text }}</p>
          <RouterLink
            v-if="sec.rep"
            :to="`/species/${sec.rep.id}`"
            class="mt-1 inline-block text-xs text-sky-700 hover:underline"
          >
            代表物種：{{ sec.rep.commonName || sec.rep.scientificName }} →
          </RouterLink>
        </div>
      </section>
    </div>

    <h2 class="mt-8 text-xl font-bold">去哪裡找？</h2>
    <p class="mt-3 leading-relaxed text-slate-700">
      口訣是<strong>「找食物，不找海蛞蝓」</strong>：多數海蛞蝓食性極專一，海綿上找多彩海蛞蝓、
      水螅叢找蓑海蛞蝓、綠藻上找海天牛、海葵旁找蓑海蛞蝓科、軟珊瑚上找三歧海蛞蝓。
      退潮後的潮池翻翻石頭（看完請放回原位）就有機會遇到海兔和枝鰓海蛞蝓；
      東北角、墾丁、小琉球、綠島都是台灣的熱點。
    </p>

    <RouterLink
      :to="`/g/${encodeURIComponent('海蛞蝓')}`"
      class="mt-8 inline-block rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white hover:bg-violet-500"
    >
      開始瀏覽海蛞蝓圖鑑 →
    </RouterLink>
  </article>
</template>
