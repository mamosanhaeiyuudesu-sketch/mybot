<template>
  <div class="page">
    <button
      v-if="logMode === 'delete' && hasSelection"
      class="delete-action"
      type="button"
      @click="handleDelete"
    >
      削除する
    </button>
    <main class="card">
      <header class="card__header">
        <p class="eyebrow">CalmCounsel</p>
        <h1>過去ログ</h1>
        <p class="hint">これまでのやり取りを時系列で確認できます。</p>
        <div class="log-mode" role="radiogroup" aria-label="表示モード">
          <label class="log-mode__option">
            <input v-model="logMode" type="radio" name="logMode" value="normal" />
            通常
          </label>
          <label class="log-mode__option">
            <input v-model="logMode" type="radio" name="logMode" value="delete" />
            削除
          </label>
        </div>
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
                <label v-if="logMode === 'delete'" class="log-select">
                  <input v-model="selectedIds" type="checkbox" :value="log.id" />
                  <span>{{ log.content }}</span>
                </label>
                <p v-else>{{ log.content }}</p>
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
import { computed, onMounted, ref, watch } from 'vue';
import { useChatLog } from '~/composables/useChatLog';

const { logMessages, ensureLoaded, formatTime, removeLogMessages } = useChatLog();
const logMode = ref<'normal' | 'delete'>('normal');
const selectedIds = ref<string[]>([]);
const hasSelection = computed(() => selectedIds.value.length > 0);

onMounted(() => {
  ensureLoaded();
});

const handleDelete = () => {
  if (!selectedIds.value.length) return;
  removeLogMessages(selectedIds.value);
  selectedIds.value = [];
};

watch(logMode, (value) => {
  if (value !== 'delete') {
    selectedIds.value = [];
  }
});
</script>

<style scoped>
.delete-action {
  position: fixed;
  top: 18px;
  width:150px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 22px;
  border-radius: 999px;
  border: 1px solid rgba(182, 73, 67, 0.3);
  background: rgba(182, 73, 67, 0.8);
  color: #7b1f1a;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 12px 24px rgba(123, 31, 26, 0.12);
  z-index: 30;
}

.log-mode {
  display: flex;
  gap: 14px;
  margin-top: 12px;
  color: #6f5b4f;
  font-size: 14px;
}

.log-mode__option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.log-mode__option input {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(82, 67, 56, 0.4);
  background: #ffffff;
  appearance: none;
  display: grid;
  place-content: center;
}

.log-mode__option input::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #3a2a1f;
  transform: scale(0);
  transition: transform 0.12s ease;
}

.log-mode__option input:checked::before {
  transform: scale(1);
}

.log-select {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
}

.log-select input {
  margin-top: 4px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(82, 67, 56, 0.4);
  background: #ffffff;
  appearance: none;
  display: inline-flex;
  align-self: flex-start;
  flex: 0 0 auto;
  line-height: 1;
  box-sizing: border-box;
}

.log-select input::before {
  content: '';
  width: 6px;
  height: 10px;
  border-right: 2px solid #3a2a1f;
  border-bottom: 2px solid #3a2a1f;
  transform: rotate(45deg) scale(0);
  transform-origin: center;
  transition: transform 0.12s ease;
  display: inline-block;
  margin: 2px 0 0 5px;
}

.log-select input:checked::before {
  transform: rotate(45deg) scale(1);
}
</style>
