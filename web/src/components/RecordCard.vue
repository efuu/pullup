<script setup lang="ts">
import { onMounted, ref } from "vue";
import { client, explain, fmtTime, secret } from "../api";

const props = defineProps<{ target: string }>();
type Card = { user: string; name: string; onTime: number; total: number; recent: Array<{ plan: string; title: string; startTime: string; minutesLate: number }> };
const card = ref<Card | null>(null);
const error = ref("");

/** Back to the plan you came from when there is one, otherwise home. */
function back() {
  if (window.history.length > 1) window.history.back();
  else window.location.hash = "#/";
}

onMounted(async () => {
  const r = await client.records.view({ secret: secret(), target: props.target });
  if ("error" in r) error.value = explain(r.error, "You can only see records of people you've shared a plan with.");
  else card.value = r.card;
});
</script>

<template>
  <p><a href="#/" @click.prevent="back">← back</a></p>
  <p v-if="error" class="feedback error">{{ error }}</p>
  <template v-else-if="card">
    <h2>{{ card.name }}</h2>
    <p class="count"><span :class="card.total && card.onTime === card.total ? 'going' : ''">On time {{ card.onTime }} of last {{ card.total }} plan{{ card.total === 1 ? "" : "s" }}</span></p>
    <div v-if="card.total" class="bar"><span v-for="r in [...card.recent].reverse()" :key="r.plan" :class="{ on: r.minutesLate === 0 }"></span></div>
    <ul class="list">
      <li v-for="r in card.recent" :key="r.plan">
        <span><span class="name"><a :href="`#/p/${encodeURIComponent(r.plan)}`">{{ r.title }}</a></span> <span class="muted small">{{ fmtTime(r.startTime) }}</span></span>
        <span class="pill" :class="r.minutesLate === 0 ? 'good' : 'bad'">{{ r.minutesLate === 0 ? "on time" : `+${r.minutesLate} min` }}</span>
      </li>
      <li v-if="card.recent.length === 0" class="empty">No plans recorded yet.</li>
    </ul>
    <p class="muted small">Only people who've shared a plan with {{ card.name }} can see this. Late means arriving after the plan's start time. No fines, no scores, just the record.</p>
  </template>
</template>
