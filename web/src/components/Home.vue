<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { client, explain, fmtTime, fromLocalInput, relative, secret, statusLabel, toLocalInput, type Status } from "../api";

defineProps<{ me: { user: string; name: string } }>();

type PlanRow = { plan: string; status: Status; title: string; place: string; startTime: string; cancelled: boolean; organizer: string };
const plans = ref<PlanRow[]>([]);
const loadError = ref("");
const loaded = ref(false);

const title = ref("");
const place = ref("");
const start = ref(toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)));
const decide = ref(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
const error = ref("");
const busy = ref(false);

const upcoming = computed(() => plans.value.filter((p) => !p.cancelled && new Date(p.startTime).getTime() > Date.now() - 6 * 3600_000));
const past = computed(() => plans.value.filter((p) => p.cancelled || new Date(p.startTime).getTime() <= Date.now() - 6 * 3600_000));

function startChanged() {
  const s = new Date(start.value).getTime();
  decide.value = toLocalInput(new Date(Math.max(Date.now() + 60_000, s - 4 * 60 * 60 * 1000)));
}

async function load() {
  const r = await client.plans.mine({ secret: secret() });
  loaded.value = true;
  if ("error" in r) loadError.value = explain(r.error);
  else plans.value = r.list.plans;
}

async function create() {
  error.value = "";
  if (!title.value.trim() || !place.value.trim()) return (error.value = "Give the plan a title and a place."), undefined;
  if (new Date(start.value).getTime() <= Date.now()) return (error.value = "Pick a start time that hasn't happened yet."), undefined;
  if (new Date(decide.value).getTime() > new Date(start.value).getTime()) return (error.value = "Decide-by has to be before the plan starts."), undefined;
  busy.value = true;
  const r = await client.plans.create({
    secret: secret(),
    title: title.value.trim(),
    place: place.value.trim(),
    startTime: fromLocalInput(start.value),
    decideBy: fromLocalInput(decide.value),
  });
  busy.value = false;
  if ("error" in r) return (error.value = explain(r.error, "Check the title, place and times.")), undefined;
  location.hash = `#/p/${encodeURIComponent(r.plan)}`;
}

onMounted(load);
</script>

<template>
  <h3>New plan</h3>
  <form class="card" @submit.prevent="create">
    <div class="grid2">
      <label>What <input v-model="title" maxlength="80" placeholder="KBBQ" /></label>
      <label>Where <input v-model="place" maxlength="80" placeholder="Koreana, Central Sq" /></label>
    </div>
    <div class="grid2">
      <label>When <input v-model="start" type="datetime-local" @change="startChanged" /></label>
      <label>Maybes must decide by <input v-model="decide" type="datetime-local" /></label>
    </div>
    <div class="row">
      <button class="primary" :disabled="busy">Create plan</button>
      <span class="muted small">You'll get a link to paste in the chat.</span>
    </div>
    <p v-if="error" class="feedback error">{{ error }}</p>
  </form>

  <h3>Upcoming</h3>
  <p v-if="loadError" class="feedback error">{{ loadError }}</p>
  <p v-else-if="loaded && upcoming.length === 0" class="empty">Nothing coming up. Make a plan, or open a link someone sent you.</p>
  <ul v-else class="list">
    <li v-for="p in upcoming" :key="p.plan">
      <span>
        <span class="name"><a :href="`#/p/${encodeURIComponent(p.plan)}`">{{ p.title }}</a></span>
        <span class="muted small"> · {{ p.place }} · {{ fmtTime(p.startTime) }} ({{ relative(p.startTime) }})</span>
      </span>
      <span class="pill" :class="{ good: p.status === 'GOING', warn: p.status === 'MAYBE', bad: p.status === 'NO' }">
        {{ p.organizer === me.user ? "organizer" : statusLabel[p.status] }}
      </span>
    </li>
  </ul>

  <template v-if="past.length">
    <h3>Earlier</h3>
    <ul class="list">
      <li v-for="p in past" :key="p.plan">
        <span>
          <span class="name"><a :href="`#/p/${encodeURIComponent(p.plan)}`">{{ p.title }}</a></span>
          <span class="muted small"> · {{ fmtTime(p.startTime) }}</span>
        </span>
        <span class="pill" :class="{ bad: p.cancelled }">{{ p.cancelled ? "cancelled" : statusLabel[p.status] }}</span>
      </li>
    </ul>
  </template>
</template>
