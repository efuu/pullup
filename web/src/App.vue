<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { client, explain, forgetSecret, secret } from "./api";
import NamePrompt from "./components/NamePrompt.vue";
import Home from "./components/Home.vue";
import PlanPage from "./components/PlanPage.vue";
import RecordCard from "./components/RecordCard.vue";

/** Who this browser is, or null until the name prompt is answered. */
const me = ref<{ user: string; name: string } | null>(null);
const checking = ref(true);
const route = ref(parse(location.hash));

function parse(hash: string): { page: "home" } | { page: "plan"; plan: string } | { page: "record"; user: string } {
  const m = hash.match(/^#\/(p|u)\/([^/]+)/);
  if (m?.[1] === "p") return { page: "plan", plan: decodeURIComponent(m[2]!) };
  if (m?.[1] === "u") return { page: "record", user: decodeURIComponent(m[2]!) };
  return { page: "home" };
}
const onHash = () => (route.value = parse(location.hash));

async function whoAmI() {
  checking.value = true;
  const s = secret();
  if (!s) {
    me.value = null;
    checking.value = false;
    return;
  }
  const r = await client.me.current({ secret: s });
  if ("error" in r) {
    forgetSecret();
    me.value = null;
  } else me.value = r;
  checking.value = false;
}

function signOut() {
  forgetSecret();
  me.value = null;
}

onMounted(() => {
  window.addEventListener("hashchange", onHash);
  void whoAmI();
});
onUnmounted(() => window.removeEventListener("hashchange", onHash));
defineExpose({ explain });
</script>

<template>
  <header class="row" style="justify-content: space-between">
    <h1><a href="#/">PullUp</a></h1>
    <span v-if="me" class="muted">
      you're <strong>{{ me.name }}</strong>
      <button @click="signOut" style="margin-left: 0.5rem">not you?</button>
    </span>
  </header>

  <p v-if="checking" class="muted">…</p>
  <NamePrompt v-else-if="!me" @claimed="whoAmI" />
  <template v-else>
    <Home v-if="route.page === 'home'" :me="me" />
    <PlanPage v-else-if="route.page === 'plan'" :key="route.plan" :plan="route.plan" :me="me" />
    <RecordCard v-else-if="route.page === 'record'" :key="route.user" :target="route.user" />
  </template>
</template>
