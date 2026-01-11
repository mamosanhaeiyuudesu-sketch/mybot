<template>
  <div class="page">
    <main class="card">
      <header class="card__header">
        <p class="eyebrow">CalmCounsel</p>
        <h1>話しかけるだけのカウンセリングチャット</h1>
        <p class="hint">気持ちをそのまま書いてください。短くても大丈夫です。</p>
      </header>

      <section class="chat">
        <div v-if="messages.length" class="chat__log">
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="chat__bubble"
            :class="message.role === 'user' ? 'chat__bubble--user' : 'chat__bubble--assistant'"
          >
            <p>{{ message.content }}</p>
          </div>
        </div>
        <p v-else class="chat__empty">最初の一言を送ると、カウンセラーが返答します。</p>

        <form class="chat__form" @submit.prevent="sendChat">
          <textarea
            v-model="chatInput"
            class="chat__input"
            placeholder="いまの気持ちを入力..."
            :disabled="loading"
            @keydown="onChatKeydown"
          ></textarea>
          <button class="primary" type="submit" :disabled="loading || !chatInput.trim()">
            {{ loading ? '送信中...' : '送信' }}
          </button>
        </form>

        <section v-if="error" class="status status--error">
          <p>{{ error }}</p>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: 'こんにちは。話したいことがあれば、ゆっくり聞かせてください。',
  },
]);
const chatInput = ref('');
const loading = ref(false);
const error = ref('');

const formatText = (text: string) => {
  const withoutBlocks = text.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```/g, '')
  );
  const withoutMarkdown = withoutBlocks
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/^\s*#+\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[`*_~]/g, '');
  return withoutMarkdown.replace(/。/g, '。\n').trim();
};

const sendChat = async () => {
  const question = chatInput.value.trim();
  if (!question || loading.value) return;

  loading.value = true;
  error.value = '';

  const nextMessages: ChatMessage[] = [
    ...messages.value,
    { role: 'user', content: question },
  ];
  const trimmedMessages = nextMessages.slice(-12);
  messages.value = [...trimmedMessages, { role: 'assistant', content: '...' }];
  const assistantIndex = messages.value.length - 1;

  try {
    const response = await $fetch<{ reply: string }>('/api/chat', {
      method: 'POST',
      body: { messages: trimmedMessages },
    });

    const reply = formatText(response.reply || '');
    messages.value[assistantIndex].content = reply || 'すみません、うまく返答できませんでした。';
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || '返信の取得に失敗しました。';
    messages.value.splice(assistantIndex, 1);
    error.value = message;
  } finally {
    chatInput.value = '';
    loading.value = false;
  }
};

const onChatKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter') return;
  if (event.isComposing) return;
  if (event.shiftKey) return;

  event.preventDefault();
  sendChat();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700&family=Fraunces:wght@600;700&display=swap');

:global(body) {
  margin: 0;
  font-family: 'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #fef9ef 0, #f5efe6 45%, #e9e1d5 100%);
  color: #2b2b2b;
}

.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
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
  display: grid;
  gap: 12px;
}

.chat__log {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(82, 67, 56, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.6));
  max-height: 360px;
  overflow-y: auto;
}

.chat__bubble {
  max-width: 88%;
  padding: 12px 14px;
  border-radius: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.chat__bubble--user {
  justify-self: end;
  background: rgba(214, 160, 109, 0.18);
  border: 1px solid rgba(214, 160, 109, 0.45);
  color: #4b2f1c;
}

.chat__bubble--assistant {
  justify-self: start;
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

  .chat__form {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>
