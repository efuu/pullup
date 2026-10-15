<script setup lang="ts">
import { onMounted, ref } from "vue";
import { client, explain, fmtTime, fromLocalInput, secret, statusLabel, toLocalInput, type Status } from "../api";

defineProps<{ me: { user: string; name: string } }>();

type PlanRow = { plan: string; status: Status; title: string; place: string; startTime: string; cancelled: boolean; organizer: string };
const plans = ref<PlanRow[]>([]);
const loadError = ref("");

const title = ref("");
const place = ref("");
const start = ref(toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)));
const decide = ref(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
const error = ref("");
const busy = ref(false);
const created = ref("");

function startChanged() {
  // Default decide-by: four hours before start, never in the past.
  const s = new Date(start.value).getTime();
  decide.value = toLocalInput(new Date(Math.max(Date.now() + 60_000, s - 4 * 60 * 60 * 1000)));
}

async function load() {
  const r = await client.plans.mine({ secret: secret() });
  if ("error" in r) loadError.value = explain(r.error);
  else plans.value = r.list.plans;
}

async function create() {
  error.value = "";
  created.value = "";
  if (!title.value.trim() || !place.value.trim()) {
    error.value = "Give the plan a title and a place.";
    return;
  }
  if (new Date(start.value).getTime() <= Date.now()) {
    error.value = "Pick a start time that hasn't happened yet.";
    return;
  }
  if (new Date(decide.value).getTime() > new Date(start.value).getTime()) {
    error.value = "Decide-by has to be before the plan starts.";
    return;
  }
  busy.value = true;
  const r = await client.plans.create({
    secret: secret(),
    title: title.value.trim(),
    place: place.value.trim(),
    startTime: fromLocalInput(start.value),
    decideBy: fromLocalInput(decide.value),
  });
  busy.value = false;
  if ("error" in r) {
    error.value = explain(r.error, "Check the title, place and times.");
    return;
  }
  created.value = r.plan;
  title.value = "";
  place.value = "";
  await load();
  location.hash = `#/p/${encodeURIComponent(r.plan)}`;
}

onMounted(load);
</script>

<template>
  <h2>New plan</h2>
  <form class="card" @submit.prevent="create">
    <label>What <input v-model="title" maxlength="80" placeholder="KBBQ" /></label>
    <label>Where <input v-model="place" maxlength="80" placeholder="Koreana, Central Sq" /></label>
    <label>When <input v-model="start" type="datetime-local" @change="startChanged" /></label>
    <label>Maybes must decide by <input v-model="decide" type="datetime-local" /></label>
    <div class="row">
      <button class="primary" :disabled="busy">Create plan</button>
      <span v-if="error" class="error">{{ error }}</span>
    </div>
  </form>

  <h2>Your plans</h2>
  <p v-if="loadError" class="error">{{ loadError }}</p>
  <p v-else-if="plans.length === 0" class="muted">Nothing yet. Make a plan, or open a link someone sent you.</p>
  <ul v-else>
    <li v-for="p in plans" :key="p.plan">
      <span>
        <a :href="`#/p/${encodeURIComponent(p.plan)}`">{{ p.title }}</a>
        <span class="muted"> · {{ p.place }} · {{ fmtTime(p.startTime) }}</span>
        <span v-if="p.cancelled" class="pill">cancelled</span>
      </span>
      <span class="muted">{{ p.organizer === me.user ? "organizer" : statusLabel[p.status] }}</span>
    </li>
  </ul>
</template>
