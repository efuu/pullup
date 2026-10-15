<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { client, explain, fmtClock, fmtTime, secret, statusLabel, type Status } from "../api";

const props = defineProps<{ plan: string; me: { user: string; name: string } }>();

type Page = {
  plan: string; organizer: string; organizerName: string; title: string; place: string;
  startTime: string; cancelled: boolean; decideBy: string;
  responses: Array<{ user: string; name: string; status: Status; onTime: number; total: number }>;
  onTheWay: Array<{ user: string; name: string; leftAt: string; etaMinutes: number }>;
  arrived: Array<{ user: string; name: string; leftAt: string; arrivedAt: string }>;
};

const page = ref<Page | null>(null);
const error = ref("");
const notice = ref("");
const eta = ref(10);
const busy = ref(false);
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

const link = computed(() => `${location.origin}${location.pathname}#/p/${encodeURIComponent(props.plan)}`);
const isOrganizer = computed(() => page.value?.organizer === props.me.user);
const mine = computed(() => page.value?.responses.find((r) => r.user === props.me.user)?.status ?? null);
const decideByPassed = computed(() => !!page.value && new Date(page.value.decideBy).getTime() <= now.value);
const counts = computed(() => {
  const c = { GOING: 0, MAYBE: 0, NO: 0 };
  for (const r of page.value?.responses ?? []) c[r.status]++;
  return c;
});
const myArrival = computed(() => page.value?.arrived.find((a) => a.user === props.me.user) ?? null);
const myTrip = computed(() => page.value?.onTheWay.find((a) => a.user === props.me.user) ?? null);
const notLeft = computed(() =>
  (page.value?.responses ?? []).filter(
    (r) => r.status === "GOING" && !page.value!.onTheWay.some((w) => w.user === r.user) && !page.value!.arrived.some((a) => a.user === r.user),
  ),
);
const byStatus = (s: Status) => (page.value?.responses ?? []).filter((r) => r.status === s);

async function load() {
  const r = await client.plans.view({ secret: secret(), plan: props.plan });
  now.value = Date.now();
  if ("error" in r) {
    error.value = explain(r.error);
    return;
  }
  error.value = "";
  page.value = r.page;
}

async function act<T extends { error: string } | object>(call: () => Promise<T>, conflict: string, done: string) {
  busy.value = true;
  notice.value = "";
  const r = await call();
  busy.value = false;
  if ("error" in r) {
    error.value = explain(r.error, conflict);
  } else {
    error.value = "";
    notice.value = done;
  }
  await load(); // the page re-forms from the backend; nothing here is guessed
}

const respond = (status: Status) =>
  act(
    () => client.plans.respond({ secret: secret(), plan: props.plan, status }),
    "It's past the decide-by time, so pick Going or Can't.",
    `You're ${statusLabel[status].toLowerCase()}.`,
  );
const leave = () =>
  act(
    () => client.plans.leave({ secret: secret(), plan: props.plan, etaMinutes: Number(eta.value) || 0 }),
    "You already said you're pulling up.",
    "Everyone can see you're on the way.",
  );
const arrive = () =>
  act(
    () => client.plans.arrive({ secret: secret(), plan: props.plan }),
    "You're already marked as here.",
    "Marked as here.",
  );
const cancel = () =>
  act(() => client.plans.cancel({ secret: secret(), plan: props.plan }), "Only the organizer can cancel this plan.", "Plan cancelled.");

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value);
    notice.value = "Link copied. Paste it in the group chat.";
  } catch {
    notice.value = "Select the link above and copy it.";
  }
}

onMounted(() => {
  void load();
  timer = setInterval(() => void load(), 3000); // live board: re-form every 3 s, no page refresh
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <p v-if="error && !page" class="error">{{ error }}</p>
  <template v-if="page">
    <h2 style="margin-top: 0.5rem">
      {{ page.title }} <span v-if="page.cancelled" class="pill">cancelled</span>
    </h2>
    <p class="muted">{{ page.place }} · {{ fmtTime(page.startTime) }} · by {{ page.organizerName }}</p>
    <p class="count">{{ counts.GOING }} going · {{ counts.MAYBE }} maybe · {{ counts.NO }} can't</p>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="notice" class="ok">{{ notice }}</p>

    <div class="card">
      <div class="muted">You ({{ me.name }}):</div>
      <div class="row">
        <button :class="{ on: mine === 'GOING' }" :disabled="busy || page.cancelled" @click="respond('GOING')">Going</button>
        <button :class="{ on: mine === 'MAYBE' }" :disabled="busy || page.cancelled || decideByPassed" @click="respond('MAYBE')">Maybe</button>
        <button :class="{ on: mine === 'NO' }" :disabled="busy || page.cancelled" @click="respond('NO')">Can't</button>
      </div>
      <p class="muted">
        <template v-if="decideByPassed">Decide-by ({{ fmtTime(page.decideBy) }}) has passed: leftover maybes were counted as can't.</template>
        <template v-else>Maybes auto-flip to "can't" at {{ fmtTime(page.decideBy) }}.</template>
      </p>
    </div>

    <div class="card" v-if="mine === 'GOING' && !page.cancelled">
      <div class="muted">Day of:</div>
      <div v-if="myArrival">You pulled up at {{ fmtClock(myArrival.arrivedAt) }}.</div>
      <div v-else-if="myTrip" class="row">
        You're on the way (left {{ fmtClock(myTrip.leftAt) }}, ~{{ myTrip.etaMinutes }} min).
        <button class="primary" :disabled="busy" @click="arrive">Pulled up</button>
      </div>
      <div v-else class="row">
        <button class="primary" :disabled="busy" @click="leave">Pulling up</button>
        <label class="row">about <input v-model="eta" type="number" min="0" max="600" style="width: 5rem" /> min away</label>
        <button :disabled="busy" @click="arrive">Pulled up</button>
      </div>
    </div>

    <h2>Who's where</h2>
    <ul>
      <li v-for="a in page.arrived" :key="a.user">
        <span><a :href="`#/u/${encodeURIComponent(a.user)}`">{{ a.name }}</a></span>
        <span>here <span class="muted">{{ fmtClock(a.arrivedAt) }}</span></span>
      </li>
      <li v-for="w in page.onTheWay" :key="w.user">
        <span><a :href="`#/u/${encodeURIComponent(w.user)}`">{{ w.name }}</a></span>
        <span>{{ w.etaMinutes }} min away <span class="muted">left {{ fmtClock(w.leftAt) }}</span></span>
      </li>
      <li v-for="r in notLeft" :key="r.user">
        <span><a :href="`#/u/${encodeURIComponent(r.user)}`">{{ r.name }}</a></span>
        <span class="muted">hasn't left yet</span>
      </li>
      <li v-if="page.arrived.length + page.onTheWay.length + notLeft.length === 0" class="muted">nobody going yet</li>
    </ul>

    <h2>Responses</h2>
    <template v-for="s in (['GOING', 'MAYBE', 'NO'] as Status[])" :key="s">
      <div v-if="byStatus(s).length" class="muted" style="margin-top: 0.5rem">{{ statusLabel[s] }}</div>
      <ul>
        <li v-for="r in byStatus(s)" :key="r.user">
          <span>
            <a :href="`#/u/${encodeURIComponent(r.user)}`">{{ r.name }}</a>
            <span v-if="r.total > 0" class="pill">on time {{ r.onTime }}/{{ r.total }}</span>
            <span v-else class="pill">new</span>
          </span>
          <span v-if="r.user === page.organizer" class="muted">organizer</span>
        </li>
      </ul>
    </template>

    <h2>Share</h2>
    <div class="link">{{ link }}</div>
    <div class="row" style="margin-top: 0.5rem">
      <button @click="copyLink">Copy link</button>
      <button v-if="isOrganizer && !page.cancelled" :disabled="busy" @click="cancel">Cancel plan</button>
    </div>
  </template>
</template>
