<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const q = ref("");

function submit() {
  if (q.value.trim()) router.push({ path: "/search", query: { q: q.value.trim() } });
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <header class="sticky top-0 z-20 bg-gradient-to-r from-sky-900 via-cyan-800 to-teal-800 text-white shadow-lg">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <RouterLink to="/" class="text-xl font-bold tracking-wide">🌊 海洋生物圖鑑</RouterLink>
        <form class="ml-auto flex w-full max-w-xs items-center sm:w-auto" @submit.prevent="submit">
          <input
            v-model="q"
            placeholder="搜尋中文名／學名…"
            class="w-full min-w-0 rounded-l-full bg-white/90 px-4 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            class="shrink-0 whitespace-nowrap rounded-r-full bg-amber-400 px-4 py-1.5 text-sm font-bold text-sky-950 hover:bg-amber-300"
          >
            搜尋
          </button>
        </form>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <RouterView />
    </main>
    <footer class="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
      資料來源：iNaturalist（觀察紀錄與照片，依各照片標示之 CC 授權）、WoRMS、Wikipedia。照片版權屬原攝影者所有。
    </footer>
  </div>
</template>
