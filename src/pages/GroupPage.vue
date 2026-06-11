<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { groups, seaslugOrders } from "../lib/data.js";
import { usePageTitle } from "../lib/title.js";
import SpeciesCard from "../components/SpeciesCard.vue";

const route = useRoute();
const groupName = computed(() => decodeURIComponent(route.params.group));
usePageTitle(() => groupName.value);
const group = computed(() => groups.find((g) => g.name === groupName.value));
const isSeaslugGroup = computed(() => groupName.value === "海蛞蝓");

const orderFilter = ref("全部");
watch(groupName, () => (orderFilter.value = "全部"));

const list = computed(() => {
  if (!group.value) return [];
  if (!isSeaslugGroup.value || orderFilter.value === "全部") return group.value.list;
  return group.value.list.filter((s) => s.group === orderFilter.value);
});
</script>

<template>
  <div v-if="group">
    <h1 class="text-2xl font-bold">{{ group.name }}</h1>
    <p class="mt-1 text-sm text-slate-500">共 {{ group.list.length }} 種，依台灣觀察數排序</p>

    <div v-if="isSeaslugGroup" class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="o in ['全部', ...seaslugOrders]"
        :key="o"
        class="rounded-full px-3 py-1 text-sm transition"
        :class="orderFilter === o ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 shadow hover:bg-violet-50'"
        @click="orderFilter = o"
      >
        {{ o }}
      </button>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <SpeciesCard v-for="s in list" :key="s.id" :s="s" />
    </div>
  </div>
  <div v-else class="py-20 text-center text-slate-500">找不到這個類群。</div>
</template>
