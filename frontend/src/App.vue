<script setup lang="ts">
import ControllerPage from "./pages/ControllerPage.vue";
import { state } from "./utils/socket";
</script>

<template>
  <ControllerPage />
  <div class="state-container">
    <span v-if="state.connected">
      <span class="circle online-circle"></span>
      <span class="status-text">Online</span>
    </span>
    <span v-else>
      <span class="circle offline-circle"></span>
      <span class="status-text">Offline</span>
    </span>
  </div>
</template>