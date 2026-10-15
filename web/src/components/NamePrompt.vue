<script setup lang="ts">
import { ref } from "vue";
import { client, explain, rememberSecret } from "../api";

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
    error.value = explain(r.error, "Names are at most 40 characters.");
    return;
  }
  rememberSecret(r.secret);
  emit("claimed");
}
</script>

<template>
  <div class="card">
    <p>No account needed. What should people see you as?</p>
    <form @submit.prevent="claim">
      <label>Your name <input v-model="name" maxlength="40" autofocus placeholder="Dylan" /></label>
      <div class="row">
        <button class="primary" :disabled="busy">That's me</button>
        <span v-if="error" class="error">{{ error }}</span>
      </div>
    </form>
    <p class="muted">This browser will remember you. Your name is shown on plans you respond to.</p>
  </div>
</template>
