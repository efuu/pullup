<script setup lang="ts">
import { ref } from "vue";
import { client, explain, rememberSecret } from "../api";

defineProps<{ openingPlan?: boolean }>();
const emit = defineEmits<{ claimed: [] }>();
const name = ref("");
const error = ref("");
const busy = ref(false);

async function claim() {
  error.value = "";
  if (!name.value.trim()) {
    error.value = "Enter a name first.";
    return;
  }
  busy.value = true;
  const r = await client.me.claim({ name: name.value.trim() });
  busy.value = false;
  if ("error" in r) {
    error.value = explain(r.error, "Names are 1 to 40 characters.");
    return;
  }
  rememberSecret(r.secret);
  emit("claimed");
}
</script>

<template>
  <div class="card">
    <h2 style="margin-top: 0.25rem">{{ openingPlan ? "Someone sent you a plan" : "Who are you?" }}</h2>
    <p class="muted">
      <template v-if="openingPlan">Enter the name your friends know you by and you'll see it. No account.</template>
      <template v-else>No account. Just the name your friends will see on plans.</template>
    </p>
    <form @submit.prevent="claim">
      <label>Your name <input v-model="name" maxlength="40" autofocus placeholder="Dylan" /></label>
      <div class="row">
        <button class="primary" :disabled="busy">{{ openingPlan ? "See the plan" : "That's me" }}</button>
      </div>
      <p v-if="error" class="feedback error">{{ error }}</p>
    </form>
    <p class="muted small">This browser remembers you. On another device you'd enter a name again.</p>
  </div>
</template>
