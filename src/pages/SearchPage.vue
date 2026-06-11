<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { searchSpecies } from "../lib/search.js";
import SpeciesCard from "../components/SpeciesCard.vue";

const route = useRoute();
const q = computed(() => (route.query.q ?? "").toString());
const results = computed(() => (q.value ? searchSpecies(q.value) : []));
</script>

<template>
  <h1 class="text-2xl font-bold">搜尋：「{{ q }}」</h1>
  <p class="mt-1 text-sm text-slate-500">{{ results.length }} 筆結果</p>
  <div v-if="results.length" class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
    <SpeciesCard v-for="s in results" :key="s.id" :s="s" />
  </div>
  <div v-else class="py-20 text-center text-slate-500">
    沒有找到符合的物種。試試中文名（如「海兔」）、學名（如「Chromodoris」）或科名。
  </div>
</template>
