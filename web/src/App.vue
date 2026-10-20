<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { client, explain, forgetSecret, secret } from "./api";
import Home from "./components/Home.vue";
import NamePrompt from "./components/NamePrompt.vue";
import PlanPage from "./components/PlanPage.vue";
import RecordCard from "./components/RecordCard.vue";

const me = ref<{ user: string; name: string } | null>(null);
const checking = ref(true);
const route = ref(parse(location.hash));
const renaming = ref(false);
const newName = ref("");
const renameError = ref("");
const confirmForget = ref(false);

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
    if (r.error === "UNAUTHORIZED") forgetSecret();
    me.value = null;
  } else me.value = r;
  checking.value = false;
}

async function rename() {
  renameError.value = "";
  const r = await client.me.rename({ secret: secret(), name: newName.value.trim() });
  if ("error" in r) {
    renameError.value = explain(r.error, "Names are 1 to 40 characters.");
    return;
  }
  me.value = r;
  renaming.value = false;
}

function forget() {
  forgetSecret();
  me.value = null;
  renaming.value = false;
  confirmForget.value = false;
}

const onUnauthorized = () => {
  forgetSecret();
  me.value = null;
};

watch(
  [route, me],
  () => {
    document.title = route.value.page === "home" ? "PullUp" : route.value.page === "plan" ? "Plan · PullUp" : "Record · PullUp";
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener("hashchange", onHash);
  window.addEventListener("pullup:unauthorized", onUnauthorized);
  void whoAmI();
});
onUnmounted(() => {
  window.removeEventListener("hashchange", onHash);
  window.removeEventListener("pullup:unauthorized", onUnauthorized);
});
</script>

<template>
  <header class="topbar">
    <h1><a href="#/">PullUp</a></h1>
    <div v-if="me" class="who">
      <template v-if="renaming">
        <form class="row" style="margin: 0" @submit.prevent="rename">
          <input v-model="newName" maxlength="40" style="width: 10rem" aria-label="New name" />
          <button class="primary">Save</button>
          <button type="button" class="quiet" @click="renaming = false">cancel</button>
        </form>
        <span v-if="renameError" class="feedback error" style="margin: 0">{{ renameError }}</span>
      </template>
      <template v-else-if="confirmForget">
        <span>This browser will forget you're <strong>{{ me.name }}</strong>.</span>
        <button class="danger" @click="forget">Forget me</button>
        <button class="quiet" @click="confirmForget = false">keep</button>
      </template>
      <template v-else>
        <span>you're <strong>{{ me.name }}</strong></span>
        <button class="quiet" @click="renaming = true; newName = me.name">change name</button>
        <button class="quiet" @click="confirmForget = true">not you?</button>
      </template>
    </div>
  </header>

  <p v-if="checking" class="muted">Loading…</p>
  <NamePrompt v-else-if="!me" :opening-plan="route.page === 'plan'" @claimed="whoAmI" />
  <template v-else>
    <Home v-if="route.page === 'home'" :me="me" />
    <PlanPage v-else-if="route.page === 'plan'" :key="route.plan" :plan="route.plan" :me="me" />
    <RecordCard v-else-if="route.page === 'record'" :key="route.user" :target="route.user" />
  </template>
</template>
