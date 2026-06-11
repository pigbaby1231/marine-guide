<script setup>
import { groups, species } from "../lib/data.js";
import { usePageTitle } from "../lib/title.js";
import SpeciesCard from "../components/SpeciesCard.vue";

usePageTitle(() => "");

const seaslugCount = species.filter((s) => s.isSeaslug).length;
const featured = groups.find((g) => g.name === "海蛞蝓")?.list.slice(0, 6) ?? [];

// 類群封面：取觀察數最高且「有照片」的物種（榜首可能沒有 CC 授權照片）
const cover = (g) => g.list.find((s) => s.photos.length)?.photos[0];
</script>

<template>
  <section class="rounded-2xl bg-gradient-to-br from-sky-800 to-teal-700 px-6 py-10 text-white shadow-lg">
    <h1 class="text-3xl font-bold">探索台灣海域的生物</h1>
    <p class="mt-2 max-w-2xl text-sky-100">
      收錄 {{ species.length }} 種台灣海域常見海洋生物，其中海蛞蝓 {{ seaslugCount }} 種為深度收錄。
      照片與紀錄來自 iNaturalist 社群的真實觀察。
    </p>
    <RouterLink
      to="/seaslug-intro"
      class="mt-4 inline-block rounded-full bg-amber-400 px-5 py-2 font-bold text-sky-950 hover:bg-amber-300"
    >
      新手入門：怎麼認識海蛞蝓？
    </RouterLink>
  </section>

  <section class="mt-8">
    <h2 class="mb-3 text-xl font-bold">依類群瀏覽</h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <RouterLink
        v-for="g in groups"
        :key="g.name"
        :to="`/g/${encodeURIComponent(g.name)}`"
        class="overflow-hidden rounded-xl bg-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div class="aspect-video overflow-hidden bg-slate-200">
          <img
            v-if="cover(g)"
            :src="cover(g).medium"
            :alt="g.name"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-3xl">🦐</div>
        </div>
        <div class="p-2.5">
          <div class="text-sm font-semibold">{{ g.name }}</div>
          <div class="text-xs text-slate-500">{{ g.list.length }} 種</div>
        </div>
      </RouterLink>
    </div>
  </section>

  <section class="mt-10">
    <div class="mb-3 flex items-baseline justify-between">
      <h2 class="text-xl font-bold">本站特色：海蛞蝓圖鑑</h2>
      <RouterLink :to="`/g/${encodeURIComponent('海蛞蝓')}`" class="text-sm text-sky-700 hover:underline">
        看全部 {{ seaslugCount }} 種 →
      </RouterLink>
    </div>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <SpeciesCard v-for="s in featured" :key="s.id" :s="s" />
    </div>
  </section>
</template>
