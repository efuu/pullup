<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { client, explain, fmtClock, fmtTime, fromLocalInput, relative, secret, statusLabel, toLocalInput, type Status } from "../api";

const props = defineProps<{ plan: string; me: { user: string; name: string } }>();

type Page = {
  plan: string; organizer: string; organizerName: string; title: string; place: string;
  startTime: string; cancelled: boolean; decideBy: string; closed: boolean;
  responses: Array<{ user: string; name: string; status: Status; lapsed: boolean; onTime: number; total: number }>;
  onTheWay: Array<{ user: string; name: string; leftAt: string; etaMinutes: number }>;
  arrived: Array<{ user: string; name: string; leftAt: string; arrivedAt: string }>;
};

const page = ref<Page | null>(null);
const error = ref("");
const notice = ref("");
const busy = ref(false);
const now = ref(Date.now());
const eta = ref(10);
const newEta = ref(0);
const editingEta = ref(false);
const confirmCancel = ref(false);
const rescheduling = ref(false);
const newStart = ref("");
let timer: ReturnType<typeof setInterval> | undefined;

const link = computed(() => `${location.origin}${location.pathname}#/p/${encodeURIComponent(props.plan)}`);
const isOrganizer = computed(() => page.value?.organizer === props.me.user);
const myResponse = computed(() => page.value?.responses.find((r) => r.user === props.me.user) ?? null);
const mine = computed(() => myResponse.value?.status ?? null);
const decideByPassed = computed(() => !!page.value && new Date(page.value.decideBy).getTime() <= now.value);
const started = computed(() => !!page.value && new Date(page.value.startTime).getTime() <= now.value);
const closed = computed(() => !!page.value && (page.value.cancelled || page.value.closed));
/** Headcount as read now: a lapsed maybe is "never decided", not a maybe and not a no. */
const counts = computed(() => {
  const c = { GOING: 0, MAYBE: 0, NO: 0, LAPSED: 0 };
  for (const r of page.value?.responses ?? []) {
    if (r.status === "MAYBE" && r.lapsed) c.LAPSED++;
    else c[r.status]++;
  }
  return c;
});
type Group = Status | "LAPSED";
const groupLabel: Record<Group, string> = { GOING: "Going", MAYBE: "Maybe", LAPSED: "Said maybe, never decided", NO: "Can't" };
const byGroup = (g: Group) =>
  (page.value?.responses ?? []).filter((r) => (g === "LAPSED" ? r.status === "MAYBE" && r.lapsed : r.status === g && !(r.status === "MAYBE" && r.lapsed)));
const myArrival = computed(() => page.value?.arrived.find((a) => a.user === props.me.user) ?? null);
const myTrip = computed(() => page.value?.onTheWay.find((a) => a.user === props.me.user) ?? null);
const notLeft = computed(() =>
  (page.value?.responses ?? []).filter(
    (r) => r.status === "GOING" && !page.value!.onTheWay.some((w) => w.user === r.user) && !page.value!.arrived.some((a) => a.user === r.user),
  ),
);
const lateBy = (arrivedAt: string) => Math.max(0, Math.floor((new Date(arrivedAt).getTime() - new Date(page.value!.startTime).getTime()) / 60_000));

async function load() {
  const r = await client.plans.view({ secret: secret(), plan: props.plan });
  now.value = Date.now();
  if ("error" in r) {
    error.value = explain(r.error);
    return;
  }
  error.value = "";
  page.value = r.page;
  document.title = `${r.page.title} · PullUp`;
}

async function act<T extends { error: string } | object>(call: () => Promise<T>, conflict: string, done: string) {
  busy.value = true;
  notice.value = "";
  const r = await call();
  busy.value = false;
  if ("error" in r) error.value = explain(r.error, conflict);
  else {
    error.value = "";
    notice.value = done;
  }
  await load(); // the page re-forms from the backend; nothing is guessed client-side
}

const respond = (status: Status) =>
  act(
    () => client.plans.respond({ secret: secret(), plan: props.plan, status }),
    status === "MAYBE" ? "It's past the decide-by time, so pick Going or Can't." : "This plan isn't taking responses any more.",
    `You're ${statusLabel[status].toLowerCase()}.`,
  );
const leave = () =>
  act(() => client.plans.leave({ secret: secret(), plan: props.plan, etaMinutes: Number(eta.value) || 0 }), "You already said you're pulling up.", "Everyone can see you're on the way.");
const saveEta = () =>
  act(() => client.plans.eta({ secret: secret(), plan: props.plan, etaMinutes: Number(newEta.value) || 0 }), "You're not on the way right now.", "Estimate updated.").then(() => (editingEta.value = false));
const arrive = () =>
  act(() => client.plans.arrive({ secret: secret(), plan: props.plan }), "You're already marked as here.", "Marked as here.");
const cancel = () =>
  act(() => client.plans.cancel({ secret: secret(), plan: props.plan }), "Only the organizer can cancel this plan.", "Plan cancelled. Everyone will see it on the page.").then(() => (confirmCancel.value = false));
const reschedule = () => {
  if (new Date(newStart.value).getTime() <= Date.now()) return (error.value = "Pick a time that hasn't happened yet."), undefined;
  return act(
    () => client.plans.reschedule({ secret: secret(), plan: props.plan, startTime: fromLocalInput(newStart.value) }),
    "Only the organizer can change the time.",
    "Time changed.",
  ).then(() => (rescheduling.value = false));
};

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value);
    notice.value = "Link copied. Paste it in the group chat.";
  } catch {
    notice.value = "Select the link below and copy it.";
  }
}

onMounted(() => {
  void load();
  timer = setInterval(() => void load(), 3000); // live board, no refresh
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <p v-if="error && !page" class="feedback error">{{ error }}</p>
  <p v-else-if="!page" class="muted">Loading plan…</p>
  <template v-if="page">
    <div class="row between" style="align-items: baseline">
      <h2>{{ page.title }}</h2>
      <span class="row" style="gap: 0.6rem">
        <span class="meta">{{ relative(page.startTime, now) }}</span>
        <button v-if="isOrganizer && !page.cancelled" class="quiet" @click="copyLink">copy link</button>
      </span>
    </div>
    <p class="meta">{{ page.place }} · {{ fmtTime(page.startTime) }} · organized by {{ page.organizerName }}</p>
    <div class="count">
      <span class="going">{{ counts.GOING }} going</span>
      <span class="maybe">{{ counts.MAYBE }} maybe</span>
      <span class="cant">{{ counts.NO }} can't</span>
      <span v-if="counts.LAPSED" class="muted">{{ counts.LAPSED }} never decided</span>
    </div>

    <p v-if="page.cancelled" class="banner">This plan was cancelled by {{ page.organizerName }}.</p>
    <p v-if="error" class="feedback error">{{ error }}</p>
    <p v-else-if="notice" class="feedback ok">{{ notice }}</p>

    <template v-if="!closed">
      <div class="card">
        <div class="label muted">Are you coming?</div>
        <div class="row" style="margin-top: 0.4rem">
          <button :class="['going', { on: mine === 'GOING' }]" :disabled="busy" @click="respond('GOING')">Going</button>
          <button :class="['maybe', { on: mine === 'MAYBE' }]" :disabled="busy || decideByPassed" :title="decideByPassed ? 'Past the decide-by time' : ''" @click="respond('MAYBE')">Maybe</button>
          <button :class="['cant', { on: mine === 'NO' }]" :disabled="busy" @click="respond('NO')">Can't</button>
        </div>
        <p v-if="myResponse?.lapsed" class="feedback warn" style="margin-top: 0.5rem">
          You said maybe and the decide-by time has passed, so you're not counted as coming. Pick Going or Can't.
        </p>
        <p class="muted small" style="margin-top: 0.5rem">
          <template v-if="decideByPassed">Decide-by ({{ fmtTime(page.decideBy) }}) has passed. A maybe that never became an answer isn't counted as coming.</template>
          <template v-else>Maybe is allowed until {{ fmtTime(page.decideBy) }} ({{ relative(page.decideBy, now) }}); after that, undecided people aren't counted.</template>
        </p>
      </div>

      <div v-if="mine === 'GOING'" class="card">
        <div class="label muted">{{ started ? "It's time." : "On the day" }}</div>
        <div v-if="myArrival" style="margin-top: 0.4rem">
          <span class="status"><span class="dot here"></span>You pulled up at {{ fmtClock(myArrival.arrivedAt) }}<span v-if="lateBy(myArrival.arrivedAt) > 0" class="pill bad">+{{ lateBy(myArrival.arrivedAt) }} min</span><span v-else class="pill good">on time</span></span>
        </div>
        <div v-else-if="myTrip" class="row" style="margin-top: 0.4rem">
          <span class="status"><span class="dot way"></span>On the way since {{ fmtClock(myTrip.leftAt) }}, ~{{ myTrip.etaMinutes }} min</span>
          <button class="primary" :disabled="busy" @click="arrive">Pulled up</button>
          <button v-if="!editingEta" class="quiet" @click="editingEta = true; newEta = myTrip.etaMinutes">fix estimate</button>
          <form v-else class="row" style="margin: 0" @submit.prevent="saveEta">
            <input v-model="newEta" type="number" min="0" max="600" style="width: 5rem" aria-label="Minutes away" /> <span class="small">min</span>
            <button :disabled="busy">Save</button>
          </form>
        </div>
        <div v-else class="row" style="margin-top: 0.4rem">
          <button class="primary" :disabled="busy" @click="leave">Pulling up</button>
          <label class="row" style="color: var(--ink); font-size: 0.95rem">about <input v-model="eta" type="number" min="0" max="600" style="width: 4.5rem" /> min away</label>
          <button :disabled="busy" @click="arrive">Pulled up</button>
        </div>
      </div>
    </template>

    <h3>Who's where</h3>
    <ul class="list">
      <li v-for="a in page.arrived" :key="a.user">
        <span class="name"><a :href="`#/u/${encodeURIComponent(a.user)}`">{{ a.name }}</a></span>
        <span class="status"><span class="dot here"></span>here <span class="muted">{{ fmtClock(a.arrivedAt) }}</span><span v-if="lateBy(a.arrivedAt) > 0" class="pill bad">+{{ lateBy(a.arrivedAt) }}</span></span>
      </li>
      <li v-for="w in page.onTheWay" :key="w.user">
        <span class="name"><a :href="`#/u/${encodeURIComponent(w.user)}`">{{ w.name }}</a></span>
        <span class="status"><span class="dot way"></span>{{ w.etaMinutes }} min away <span class="muted">left {{ fmtClock(w.leftAt) }}</span></span>
      </li>
      <li v-for="r in notLeft" :key="r.user">
        <span class="name"><a :href="`#/u/${encodeURIComponent(r.user)}`">{{ r.name }}</a></span>
        <span class="status muted"><span class="dot notleft"></span>hasn't left yet</span>
      </li>
      <li v-if="page.arrived.length + page.onTheWay.length + notLeft.length === 0" class="empty">{{ page.cancelled ? "Nobody was going." : "Nobody's going yet. Share the link below." }}</li>
    </ul>

    <h3>Responses</h3>
    <template v-for="g in (['GOING', 'MAYBE', 'LAPSED', 'NO'] as Group[])" :key="g">
      <div v-if="byGroup(g).length" class="label muted" style="margin-top: 0.5rem">{{ groupLabel[g] }}</div>
      <ul class="list">
        <li v-for="r in byGroup(g)" :key="r.user">
          <span>
            <span class="name"><a :href="`#/u/${encodeURIComponent(r.user)}`">{{ r.name }}</a></span>
            <span v-if="r.total > 0" class="pill" :class="r.onTime === r.total ? 'good' : r.onTime * 2 < r.total ? 'bad' : ''">on time {{ r.onTime }}/{{ r.total }}</span>
            <span v-else class="pill">new</span>
          </span>
          <span v-if="r.user === page.organizer" class="muted small">organizer</span>
        </li>
      </ul>
    </template>

    <h3>Share</h3>
    <div class="link">{{ link }}</div>
    <div class="row" style="margin-top: 0.5rem"><button @click="copyLink">Copy link</button></div>

    <template v-if="isOrganizer && !page.cancelled">
      <h3>Organizer</h3>
      <div class="card flat">
        <div class="row">
          <button v-if="!rescheduling" @click="rescheduling = true; newStart = toLocalInput(new Date(page.startTime))">Change time</button>
          <form v-else class="row" style="margin: 0" @submit.prevent="reschedule">
            <input v-model="newStart" type="datetime-local" style="width: auto" aria-label="New start time" />
            <button class="primary" :disabled="busy">Save time</button>
            <button type="button" class="quiet" @click="rescheduling = false">cancel</button>
          </form>
        </div>
        <div class="row" style="margin-top: 0.6rem">
          <button v-if="!confirmCancel" class="danger" @click="confirmCancel = true">Cancel plan…</button>
          <template v-else>
            <span class="small">Cancel {{ page.title }} for everyone?</span>
            <button class="danger" :disabled="busy" @click="cancel">Yes, cancel it</button>
            <button class="quiet" @click="confirmCancel = false">keep it</button>
          </template>
        </div>
      </div>
    </template>
  </template>
</template>
