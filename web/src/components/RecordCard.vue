<script setup lang="ts">
import { onMounted, ref } from "vue";
import { client, explain, fmtTime, secret } from "../api";

const props = defineProps<{ target: string }>();
type Card = { user: string; name: string; onTime: number; total: number; recent: Array<{ plan: string; title: string; startTime: string; minutesLate: number }> };
const card = ref<Card | null>(null);
const error = ref("");

onMounted(async () => {
  const r = await client.records.view({ secret: secret(), target: props.target });
  if ("error" in r) error.value = explain(r.error, "You can only see records of people you've shared a plan with.");
  else card.value = r.card;
});
</script>

<template>
  <p><a href="#/">← back</a></p>
  <p v-if="error" class="error">{{ error }}</p>
  <template v-else-if="card">
    <h2 style="margin-top: 0.5rem">{{ card.name }}</h2>
    <p class="count">On time {{ card.onTime }} of last {{ card.total }} plan{{ card.total === 1 ? "" : "s" }}</p>
    <ul>
      <li v-for="r in card.recent" :key="r.plan">
        <span><a :href="`#/p/${encodeURIComponent(r.plan)}`">{{ r.title }}</a> <span class="muted">{{ fmtTime(r.startTime) }}</span></span>
        <span :class="r.minutesLate === 0 ? 'ok' : 'error'">{{ r.minutesLate === 0 ? "on time" : `+${r.minutesLate} min` }}</span>
      </li>
      <li v-if="card.recent.length === 0" class="muted">no plans recorded yet</li>
    </ul>
    <p class="muted">Only people who've shared a plan with {{ card.name }} can see this. No fines, no scores, just the record.</p>
  </template>
</template>
