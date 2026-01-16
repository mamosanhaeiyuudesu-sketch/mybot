<template>
  <NuxtPage />
  <div v-if="loaded && !userName" class="name-modal__backdrop">
    <div class="name-modal" role="dialog" aria-modal="true" aria-labelledby="name-modal-title">
      <h2 id="name-modal-title">お名前を入力してください</h2>
      <p>入力が完了するまで利用を開始できません。</p>
      <input
        v-model="nameInput"
        class="name-modal__input"
        type="text"
        placeholder="例：福田"
        autofocus
      />
      <button class="primary" type="button" :disabled="!nameInput.trim()" @click="handleSave">
        はじめる
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserName } from '~/composables/useUserName';

const { userName, saveUserName, ensureLoaded, loaded } = useUserName();
const nameInput = ref('');

onMounted(() => {
  ensureLoaded();
  nameInput.value = userName.value;
});

const handleSave = () => {
  const trimmed = nameInput.value.trim();
  if (!trimmed) return;
  saveUserName(trimmed);
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700&family=Fraunces:wght@600;700&display=swap');

body {
  margin: 0;
  font-family: 'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #fef9ef 0, #f5efe6 45%, #e9e1d5 100%);
  color: #2b2b2b;
}

.name-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(43, 43, 43, 0.4);
  display: grid;
  place-items: center;
  z-index: 100;
}

.name-modal {
  width: min(420px, 90vw);
  background: rgba(255, 255, 255, 0.98);
  border-radius: 18px;
  border: 1px solid rgba(54, 36, 25, 0.1);
  padding: 24px;
  display: grid;
  gap: 12px;
  box-shadow: 0 22px 50px rgba(82, 67, 56, 0.2);
}

.name-modal h2 {
  margin: 0;
  font-size: 20px;
  font-family: 'Fraunces', 'Work Sans', serif;
  color: #3a2a1f;
}

.name-modal p {
  margin: 0;
  color: #6f5b4f;
  font-size: 14px;
}

.name-modal__input {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(82, 67, 56, 0.15);
  background: rgba(255, 255, 255, 0.9);
  color: #2b2b2b;
  font-size: 15px;
  font-family: inherit;
}

.name-modal__input:focus {
  outline: 2px solid rgba(214, 160, 109, 0.6);
  outline-offset: 1px;
}

.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 92px 16px;
}

.card {
  width: min(880px, 100%);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(54, 36, 25, 0.1);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 18px 50px rgba(82, 67, 56, 0.18);
  backdrop-filter: blur(10px);
  display: grid;
  gap: 16px;
}

.tab-bar {
  position: fixed;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  gap: 10px;
  padding: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(82, 67, 56, 0.12);
  box-shadow: 0 12px 24px rgba(82, 67, 56, 0.12);
  z-index: 20;
}

.tab {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  background: transparent;
  color: #6f5b4f;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.tab--active {
  background: rgba(214, 160, 109, 0.25);
  color: #4b2f1c;
}

.card__header h1 {
  margin: 8px 0 0;
  font-size: clamp(24px, 4vw, 34px);
  font-family: 'Fraunces', 'Work Sans', serif;
  color: #3a2a1f;
}

.card__header .eyebrow {
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 12px;
  color: #a36a4f;
  margin: 0;
  font-weight: 600;
}

.card__header .hint {
  color: #6f5b4f;
  margin-top: 6px;
}

.chat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}

.chat__log {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(82, 67, 56, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.6));
  max-height: none;
  overflow-y: auto;
}

.log__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log__meta {
  margin: 0;
  font-size: 12px;
  color: #7b6a5f;
}

.log__item--user {
  align-items: flex-end;
  text-align: right;
}

.log__item--assistant {
  align-items: flex-start;
  text-align: left;
}

.chat__bubble {
  max-width: 88%;
  padding: 12px 14px;
  border-radius: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.chat__bubble--user {
  align-self: flex-end;
  max-width: 70%;
  background: rgba(214, 160, 109, 0.18);
  border: 1px solid rgba(214, 160, 109, 0.45);
  color: #4b2f1c;
  text-align: left;
}

.chat__bubble--assistant {
  align-self: flex-start;
  background: rgba(96, 139, 120, 0.16);
  border: 1px solid rgba(96, 139, 120, 0.35);
  color: #2c3b34;
}

.chat__empty {
  margin: 0;
  color: #6f5b4f;
  font-size: 14px;
}

.chat__form {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.chat__input {
  flex: 1;
  min-height: 64px;
  resize: vertical;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(82, 67, 56, 0.15);
  background: rgba(255, 255, 255, 0.8);
  color: #2b2b2b;
  font-size: 15px;
  font-family: inherit;
}

.chat__input:focus {
  outline: 2px solid rgba(214, 160, 109, 0.6);
  outline-offset: 1px;
}

button {
  border: none;
  border-radius: 12px;
  padding: 12px 18px;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.primary {
  background: linear-gradient(135deg, #d6a06d, #7aa391);
  color: #2b2b2b;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(122, 163, 145, 0.3);
}

.primary:not(:disabled):hover {
  transform: translateY(-1px);
}

.status {
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(182, 73, 67, 0.3);
  background: rgba(182, 73, 67, 0.12);
  color: #7b1f1a;
}

@media (max-width: 640px) {
  .card {
    padding: 22px;
  }

  .page {
    padding: 32px 16px;
  }

  .tab-bar {
    position: static;
    transform: none;
    width: 100%;
    justify-content: center;
    margin-top: 10px;
    border-radius: 14px;
    padding: 10px 12px;
  }

  .chat__form {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>
