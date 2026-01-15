<template>
  <div class="page">
    <main class="card">
      <header class="card__header">
        <p class="eyebrow">CalmCounsel</p>
        <h1>話しかけるだけのカウンセリングチャット</h1>
        <p class="hint">気持ちをそのまま書いてください。短くても大丈夫です。</p>
      </header>

      <section class="chat">
        <div ref="chatLog" class="chat__log">
          <template v-if="messages.length">
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="log__item"
              :class="message.role === 'user' ? 'log__item--user' : 'log__item--assistant'"
            >
              <p class="log__meta">{{ formatTime(message.createdAt) }}</p>
              <div
                class="chat__bubble"
                :class="message.role === 'user' ? 'chat__bubble--user' : 'chat__bubble--assistant'"
              >
                <p>{{ message.content }}</p>
              </div>
            </div>
          </template>
          <p v-else class="chat__empty">最初の一言を送ると、カウンセラーが返答します。</p>
        </div>

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

      <TabBar />
    </main>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useChatLog, type ChatMessage } from '~/composables/useChatLog';

const { addLogMessage, ensureLoaded, formatTime } = useChatLog();

const messages = useState<ChatMessage[]>('chat-messages', () => [
  {
    role: 'assistant',
    content: 'こんにちは。話したいことがあれば、ゆっくり聞かせてください。',
    createdAt: new Date().toISOString(),
  },
]);
const chatInput = ref('');
const loading = ref(false);
const error = ref('');
const chatLog = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  if (!chatLog.value) return;
  chatLog.value.scrollTop = chatLog.value.scrollHeight;
};

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
  return withoutMarkdown
    .replace(/。/g, '。\n')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
};

const sendChat = async () => {
  const question = chatInput.value.trim();
  if (!question || loading.value) return;

  loading.value = true;
  error.value = '';

  const userMessage: ChatMessage = {
    role: 'user',
    content: question,
    createdAt: new Date().toISOString(),
  };
  addLogMessage(userMessage);

  const nextMessages: ChatMessage[] = [...messages.value, userMessage];
  const trimmedMessages = nextMessages.slice(-12);
  const apiMessages = trimmedMessages.map(({ role, content }) => ({ role, content }));

  messages.value = [
    ...trimmedMessages,
    { role: 'assistant', content: '...', createdAt: new Date().toISOString() },
  ];
  const assistantIndex = messages.value.length - 1;

  try {
    const response = await $fetch<{ reply: string }>('/api/chat', {
      method: 'POST',
      body: { messages: apiMessages },
    });

    const reply = formatText(response.reply || '');
    messages.value[assistantIndex].content = reply || 'すみません、うまく返答できませんでした。';
    addLogMessage(messages.value[assistantIndex]);
  } catch (err: any) {
    const message =
      err?.data?.message || err?.statusMessage || err?.message || '返信の取得に失敗しました。';
    messages.value.splice(assistantIndex, 1);
    error.value = message;
  } finally {
    chatInput.value = '';
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
};

const onChatKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter') return;
  if (event.isComposing) return;
  if (event.shiftKey) return;

  event.preventDefault();
  sendChat();
};

onMounted(() => {
  ensureLoaded();
  messages.value = messages.value.map((message) => ({
    ...message,
    createdAt: message.createdAt || new Date().toISOString(),
  }));
});

watch(
  messages,
  async () => {
    await nextTick();
    scrollToBottom();
  },
  { deep: true }
);
</script>
