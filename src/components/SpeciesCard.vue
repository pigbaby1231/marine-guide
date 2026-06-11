<script setup>
defineProps({ s: { type: Object, required: true } });
</script>

<template>
  <RouterLink
    :to="`/species/${s.id}`"
    class="group overflow-hidden rounded-xl bg-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div class="relative aspect-square overflow-hidden bg-slate-200">
      <img
        v-if="s.photos[0]"
        :src="s.photos[0].medium"
        :alt="s.commonName || s.scientificName"
        loading="lazy"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-4xl">🐚</div>
      <span
        v-if="s.isSeaslug"
        class="absolute left-2 top-2 rounded-full bg-violet-600/90 px-2 py-0.5 text-[10px] font-bold text-white"
      >
        {{ s.group }}
      </span>
    </div>
    <div class="p-3">
      <div class="truncate font-semibold">{{ s.commonName || s.scientificName }}</div>
      <div class="truncate text-xs italic text-slate-500">{{ s.scientificName }}</div>
    </div>
  </RouterLink>
</template>
