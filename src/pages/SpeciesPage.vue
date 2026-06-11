<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { byId, seaslugInfo, similarSeaslugs, topGroup } from "../lib/data.js";
import { usePageTitle } from "../lib/title.js";
import SpeciesCard from "../components/SpeciesCard.vue";

const route = useRoute();
const s = computed(() => byId.get(String(route.params.id)));
usePageTitle(() => (s.value ? s.value.commonName || s.value.scientificName : "找不到物種"));
const info = computed(() => (s.value ? seaslugInfo(s.value) : null));
const similar = computed(() => (s.value ? similarSeaslugs(s.value) : []));

const photoIdx = ref(0);
watch(() => route.params.id, () => (photoIdx.value = 0));

const taxonomyRows = computed(() => {
  if (!s.value) return [];
  const t = s.value.taxonomy;
  return [
    ["門", t.phylum],
    ["綱", t.class],
    ["目", t.order],
    ["科", t.family],
    ["屬", t.genus],
  ].filter(([, v]) => v);
});
</script>

<template>
  <div v-if="s">
    <nav class="text-sm text-slate-500">
      <RouterLink to="/" class="hover:underline">首頁</RouterLink>
      <span> / </span>
      <RouterLink :to="`/g/${encodeURIComponent(topGroup(s))}`" class="hover:underline">{{ topGroup(s) }}</RouterLink>
    </nav>

    <div class="mt-3 grid gap-6 lg:grid-cols-2">
      <!-- 照片區 -->
      <div>
        <div class="overflow-hidden rounded-2xl bg-slate-200 shadow">
          <img
            v-if="s.photos[photoIdx]"
            :src="s.photos[photoIdx].large"
            :alt="s.commonName || s.scientificName"
            class="aspect-square w-full object-cover"
          />
          <div v-else class="flex aspect-square w-full items-center justify-center text-6xl">🐚</div>
        </div>
        <p v-if="s.photos[photoIdx]" class="mt-1 text-right text-[11px] text-slate-400">
          {{ s.photos[photoIdx].attribution }}
        </p>
        <div v-if="s.photos.length > 1" class="mt-2 flex gap-2">
          <button
            v-for="(p, i) in s.photos"
            :key="i"
            class="h-16 w-16 overflow-hidden rounded-lg ring-2 transition"
            :class="i === photoIdx ? 'ring-sky-600' : 'ring-transparent hover:ring-sky-300'"
            @click="photoIdx = i"
          >
            <img :src="p.medium" class="h-full w-full object-cover" :alt="`照片 ${i + 1}`" />
          </button>
        </div>
      </div>

      <!-- 資訊區 -->
      <div>
        <h1 class="text-3xl font-bold">{{ s.commonName || s.scientificName }}</h1>
        <p class="mt-1 text-lg italic text-slate-500">{{ s.scientificName }}</p>
        <div class="mt-2 flex flex-wrap gap-2 text-xs">
          <span class="rounded-full bg-sky-100 px-2.5 py-1 text-sky-800">{{ topGroup(s) }}</span>
          <span v-if="s.isSeaslug" class="rounded-full bg-violet-100 px-2.5 py-1 text-violet-800">{{ s.group }}</span>
          <span class="rounded-full bg-teal-100 px-2.5 py-1 text-teal-800">台灣觀察 {{ s.observationsTaiwan }} 筆</span>
        </div>

        <p v-if="s.summary" class="mt-4 leading-relaxed text-slate-700">
          {{ s.summary.text }}
          <span v-if="s.summary.lang === 'en'" class="text-xs text-slate-400">（暫只有英文簡介）</span>
        </p>

        <table class="mt-4 w-full text-sm">
          <tbody>
            <tr v-for="[rank, name] in taxonomyRows" :key="rank" class="border-b border-slate-100">
              <td class="w-16 py-1.5 text-slate-400">{{ rank }}</td>
              <td class="py-1.5 italic">{{ name }}</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4 flex gap-3 text-sm">
          <a :href="s.links.inat" target="_blank" rel="noopener" class="text-sky-700 hover:underline">
            iNaturalist 觀察紀錄 ↗
          </a>
          <a v-if="s.links.wikipedia" :href="s.links.wikipedia" target="_blank" rel="noopener" class="text-sky-700 hover:underline">
            Wikipedia ↗
          </a>
        </div>
      </div>
    </div>

    <!-- 海蛞蝓深度介紹 -->
    <section v-if="info" class="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6">
      <h2 class="text-lg font-bold text-violet-900">
        🔍 海蛞蝓觀察筆記
        <span class="ml-2 text-sm font-normal text-violet-600">
          {{ info.zhName }}{{ s.taxonomy.family ? `（${s.taxonomy.family}）` : "" }}
        </span>
      </h2>
      <dl class="mt-3 space-y-3 text-sm leading-relaxed">
        <div>
          <dt class="font-semibold text-violet-800">辨識特徵</dt>
          <dd class="text-slate-700">{{ info.traits }}</dd>
        </div>
        <div>
          <dt class="font-semibold text-violet-800">食性</dt>
          <dd class="text-slate-700">{{ info.diet }}</dd>
        </div>
        <div>
          <dt class="font-semibold text-violet-800">觀察小提示</dt>
          <dd class="text-slate-700">{{ info.tips }}</dd>
        </div>
      </dl>
      <p class="mt-3 text-xs text-violet-400">以上為科／目層級的通則描述，個別物種可能有例外。</p>
    </section>

    <!-- 相似種 -->
    <section v-if="similar.length" class="mt-8">
      <h2 class="mb-3 text-lg font-bold">容易搞混的同科物種</h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SpeciesCard v-for="x in similar" :key="x.id" :s="x" />
      </div>
    </section>
  </div>
  <div v-else class="py-20 text-center text-slate-500">找不到這個物種。</div>
</template>
