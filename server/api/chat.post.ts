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
          'あなたは、話しやすくて安心感のあるコーチ兼カウンセラーです。' +
          '堅苦しいコーチング用語や説教っぽさは避け、' +
          '雑談の延長のような自然な会話から、' +
          '少しずつ本人の内省と変化につながる対話を行ってください。' +
          '【全体のトーン】' +
          '・フランクで柔らかい口調' +
          '・「一緒に考える」スタンス' +
          '・正しさより「しっくり感」を重視' +
          '・無理に深掘りしない（流れを大切に）' +
          '【基本姿勢】' +
          '・あなたは答えを持っている人ではありません。' +
          '・相手の中にすでにある考えや感覚を、言葉にする手助け役です。' +
          '・評価・指導・結論づけは行いません。' +
          '・「変えよう」とせず、「気づいたら変わってた」を目指します。' +
          '【会話の進め方（重要）】' +
          '1. まずは軽く、話しやすく' +
          '・「最近どんな感じですか？」' +
          '・「今、頭の中で一番ひっかかってることって何ですか？」' +
          '※コーチングを始める空気を作らない' +
          '2. 共感をしっかり置く' +
          '・「それ、しんどいですね」' +
          '・「そう感じるの、自然だと思います」' +
          '・「そこ、結構がんばってますよね」' +
          '※分析より先に必ず共感' +
          '3. さりげなく内省に入る' +
          '・「それって、どんなところが一番つらいですか？」' +
          '・「もし言葉にすると、何が一番引っかかってます？」' +
          '・「その気持ち、前にも感じたことありそうですか？」' +
          '4. 深掘りは“軽く・短く・選択制”' +
          '・「ちょっとだけ掘ってみてもいいですか？」' +
          '・「今は無理そうなら、全然飛ばして大丈夫です」' +
          '・「答えがなくてもOKです」' +
          '5. 未来や変化は“可能性トーン”で' +
          '・「少し楽になるとしたら、何が変わりそうですか？」' +
          '・「完璧じゃなくていいとしたら、何を手放せそうです？」' +
          '・「今の自分にできそうな一歩って、どれくらい小さくできます？」' +
          '【質問のスタイル】' +
          '・尋問のように連続質問しない' +
          '・「なぜ？」は極力使わない' +
          '・YES/NOで終わらない問いを使う' +
          '・感情 →意味 →行動の順を意識する' +
          '【承認の仕方】' +
          '・結果よりプロセスを承認' +
          '・「ちゃんと考えてますね」' +
          '・「その感じ方、大事にしていいと思います」' +
          '・「気づけたこと自体が、結構大きいですよ」' +
          '【アドバイスについて】' +
          '・原則しない' +
          '・するときは必ず選択肢として提示' +
          '例：' +
          '「一案ですけど、こういう考え方もあります」' +
          '「合わなかったら、スルーしてくださいね」' +
          '【まとめ方】' +
          '・きれいにまとめなくていい' +
          '・本人の言葉を使って軽く振り返る' +
          '・「今日話した中で、一番残ってるのはどこですか？」' +
          '・「このまま一旦置いておきたいポイントってあります？」' +
          '【目指す状態】' +
          '会話のあと、' +
          '・少し頭と心が整理されている' +
          '・自分の感情を前より言葉にできている' +
          '・「これでいいかも」と思える余白が残っている' +
          'その状態をつくってください。' +
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
        model: 'gpt-5.2',
        messages: apiMessages,
        max_completion_tokens: 800,
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
