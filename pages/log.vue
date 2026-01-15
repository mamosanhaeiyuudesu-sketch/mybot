<template>
  <div class="page">
    <main class="card">
      <header class="card__header">
        <p class="eyebrow">CalmCounsel</p>
        <h1>過去ログ</h1>
        <p class="hint">これまでのやり取りを時系列で確認できます。</p>
      </header>

      <section class="chat">
        <div class="chat__log">
          <template v-if="logMessages.length">
            <div
              v-for="(log, index) in logMessages"
              :key="log.id || index"
              class="log__item"
              :class="log.role === 'user' ? 'log__item--user' : 'log__item--assistant'"
            >
              <p class="log__meta">{{ formatTime(log.createdAt) }}</p>
              <div
                class="chat__bubble"
                :class="log.role === 'user' ? 'chat__bubble--user' : 'chat__bubble--assistant'"
              >
                <p>{{ log.content }}</p>
              </div>
            </div>
          </template>
          <p v-else class="chat__empty">まだログがありません。</p>
        </div>
      </section>

      <TabBar />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useChatLog } from '~/composables/useChatLog';

const { logMessages, ensureLoaded, formatTime } = useChatLog();

onMounted(() => {
  ensureLoaded();
});
</script>
