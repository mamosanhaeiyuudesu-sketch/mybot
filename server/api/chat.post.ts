type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<{ messages?: ChatMessage[] }>(event);
  const rawMessages = body?.messages ?? [];

  const messages = Array.isArray(rawMessages)
    ? rawMessages.filter(
        (message) =>
          message &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string'
      )
    : [];

  if (messages.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'messages is required',
    });
  }

  const { openaiApiKey } = useRuntimeConfig();

  if (!openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key is not configured.',
    });
  }

  try {
    const apiMessages = [
      {
        role: 'system',
        content:
          'あなたは日本語で話すカウンセラーです。' +
          'ユーザーの気持ちを受け止め、共感し、落ち着いたトーンで返答してください。' +
          '必要に応じて短い提案や質問を一つだけ添えてください。' +
          '医療や危機に関わる話題が出たら、専門家への相談も勧めてください。' +
          'マークダウンは使わず、句点「。」ごとに改行してください。',
      },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: apiMessages,
        max_tokens: 500,
      }),
    });

    if (response.status === 429) {
      throw createError({
        statusCode: 429,
        statusMessage: '時間を置いて再試行してください。',
      });
    }

    const data = await response.json().catch(() => null as any);

    if (!response.ok) {
      const openAiMessage = data?.error?.message || '返信の取得に失敗しました。';
      throw createError({
        statusCode: response.status || 500,
        statusMessage: openAiMessage,
      });
    }

    const reply = data?.choices?.[0]?.message?.content || '';

    if (!reply) {
      throw createError({
        statusCode: 502,
        statusMessage: '返信を取得できませんでした。',
      });
    }

    return { reply };
  } catch (err: any) {
    if (err?.statusCode && err?.statusMessage) {
      throw err;
    }

    const message = err?.message || '返信の取得に失敗しました。';
    throw createError({
      statusCode: 500,
      statusMessage: message,
    });
  }
});
