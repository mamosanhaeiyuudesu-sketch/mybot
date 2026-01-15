export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type LogMessage = ChatMessage & {
  id: string;
};

const LOG_STORAGE_KEY = 'calmcounsel-log-messages';

export const useChatLog = () => {
  const logMessages = useState<LogMessage[]>('chat-log-messages', () => []);
  const loaded = useState<boolean>('chat-log-loaded', () => false);

  const saveLogs = (items: LogMessage[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(items));
  };

  const ensureLoaded = () => {
    if (typeof window === 'undefined') return;
    if (loaded.value) return;
    loaded.value = true;
    const raw = window.localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        logMessages.value = parsed
          .filter(
            (item) =>
              item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string' &&
              typeof item.createdAt === 'string'
          )
          .map((item) => ({
            role: item.role,
            content: item.content,
            createdAt: item.createdAt,
            id: typeof item.id === 'string' ? item.id : `${item.createdAt}-${Math.random()}`,
          }));
      }
    } catch {
      // Ignore invalid cache.
    }
  };

  const addLogMessage = (message: ChatMessage) => {
    const entry: LogMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
    logMessages.value = [...logMessages.value, entry];
    saveLogs(logMessages.value);
  };

  const removeLogMessages = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    logMessages.value = logMessages.value.filter((item) => !idSet.has(item.id));
    saveLogs(logMessages.value);
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('ja-JP', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return {
    logMessages,
    addLogMessage,
    removeLogMessages,
    ensureLoaded,
    formatTime,
  };
};
