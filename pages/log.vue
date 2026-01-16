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
          <label class="log-mode__option">
            <input v-model="logMode" type="radio" name="logMode" value="feedback" />
            フィードバック
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
                <label v-if="isSelectableMode" class="log-select">
                  <input v-model="selectedIds" type="checkbox" :value="log.id" />
                  <span>{{ log.content }}</span>
                </label>
                <p v-else>{{ log.content }}</p>
              </div>
            </div>
          </template>
          <p v-else class="chat__empty">まだログがありません。</p>
        </div>

        <div v-if="logMode === 'feedback' && hasSelection" class="feedback-panel">
          <label class="feedback-panel__label" for="feedback-input">フィードバック</label>
          <textarea
            id="feedback-input"
            v-model="feedbackText"
            class="feedback-panel__input"
            placeholder="気づいた点や改善してほしい点など"
            rows="4"
          ></textarea>
          <div class="feedback-panel__actions">
            <button
              class="primary"
              type="button"
              :disabled="!canSubmit || isSubmitting"
              @click="handleFeedback"
            >
              送信する
            </button>
            <p v-if="statusMessage" :class="statusClass">{{ statusMessage }}</p>
          </div>
        </div>
      </section>

      <TabBar />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useChatLog } from '~/composables/useChatLog';
import { useUserName } from '~/composables/useUserName';

const { logMessages, ensureLoaded, formatTime, removeLogMessages } = useChatLog();
const { userName, ensureLoaded: ensureNameLoaded } = useUserName();
const logMode = ref<'normal' | 'delete' | 'feedback'>('normal');
const selectedIds = ref<string[]>([]);
const feedbackText = ref('');
const isSubmitting = ref(false);
const statusMessage = ref('');
const statusTone = ref<'success' | 'error' | ''>('');
const hasSelection = computed(() => selectedIds.value.length > 0);
const isSelectableMode = computed(() => logMode.value !== 'normal');
const canSubmit = computed(
  () => logMode.value === 'feedback' && hasSelection.value && feedbackText.value.trim().length > 0
);
const statusClass = computed(() =>
  statusTone.value === 'success' ? 'status status--success' : 'status'
);

onMounted(() => {
  ensureLoaded();
  ensureNameLoaded();
});

const handleDelete = () => {
  if (!selectedIds.value.length) return;
  removeLogMessages(selectedIds.value);
  selectedIds.value = [];
};

watch(logMode, (value) => {
  selectedIds.value = [];
  feedbackText.value = '';
  statusMessage.value = '';
  statusTone.value = '';
});

const handleFeedback = async () => {
  if (!canSubmit.value || isSubmitting.value) return;
  isSubmitting.value = true;
  statusMessage.value = '';
  statusTone.value = '';
  try {
    const idSet = new Set(selectedIds.value);
    const logs = logMessages.value
      .filter((item) => idSet.has(item.id))
      .map((item) => `${item.role === 'assistant' ? 'ボット' : 'ユーザー'}：${item.content}`)
      .join('\n');
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        logs,
        feedback: feedbackText.value.trim(),
        name: userName.value,
      },
    });
    selectedIds.value = [];
    feedbackText.value = '';
    statusMessage.value = '送信しました。';
    statusTone.value = 'success';
  } catch (err: any) {
    statusMessage.value = err?.statusMessage || '送信に失敗しました。';
    statusTone.value = 'error';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.delete-action {
  position: fixed;
  top: 32px;
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

.feedback-panel {
  position: fixed;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  width: min(520px, 90vw);
  display: grid;
  gap: 10px;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(82, 67, 56, 0.15);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 30px rgba(82, 67, 56, 0.16);
}

.feedback-panel__label {
  color: #6f5b4f;
  font-size: 15px;
  font-weight: 600;
}

.feedback-panel__input {
  min-height: 66px;
  resize: vertical;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(82, 67, 56, 0.15);
  background: rgba(255, 255, 255, 0.8);
  color: #2b2b2b;
  font-size: 14px;
  font-family: inherit;
}

.feedback-panel__input:focus {
  outline: 2px solid rgba(214, 160, 109, 0.6);
  outline-offset: 1px;
}

.feedback-panel__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status--success {
  border: 1px solid rgba(96, 139, 120, 0.35);
  background: rgba(96, 139, 120, 0.12);
  color: #2c3b34;
}
</style>
