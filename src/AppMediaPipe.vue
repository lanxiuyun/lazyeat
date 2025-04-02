<template>
  <n-message-provider>
    <div class="app-container">
      <h1>MediaPipe</h1>
      <div class="detection-container">
        <hand-landmark-detection />
      </div>
    </div>
  </n-message-provider>
</template>

<script setup lang="ts">
import HandLandmarkDetection from "@/hand_landmark/VideoDetector.vue";
</script>

<style scoped>
.app-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.detection-container {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}
</style>
