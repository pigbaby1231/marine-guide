import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import Home from "./pages/Home.vue";
import GroupPage from "./pages/GroupPage.vue";
import SpeciesPage from "./pages/SpeciesPage.vue";
import SearchPage from "./pages/SearchPage.vue";
import SeaslugIntro from "./pages/SeaslugIntro.vue";
import "./index.css";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/g/:group", component: GroupPage },
    { path: "/species/:id", component: SpeciesPage },
    { path: "/search", component: SearchPage },
    { path: "/seaslug-intro", component: SeaslugIntro },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

createApp(App).use(router).mount("#root");
