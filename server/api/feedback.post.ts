type FeedbackPayload = {
  logs?: string;
  feedback?: string;
  name?: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<FeedbackPayload>(event);
  const logs = body?.logs?.trim();
  const feedback = body?.feedback?.trim();
  const name = body?.name?.trim();

  if (!logs || !feedback || !name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'logs, feedback, and name are required',
    });
  }

  const { feedbackWebhookUrl } = useRuntimeConfig();

  if (!feedbackWebhookUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Feedback webhook URL is not configured.',
    });
  }

  const now = new Date();
  const createdAt = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const response = await fetch(feedbackWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      createdAt,
      logs,
      feedback,
      name,
    }),
  });

  if (!response.ok) {
    const message = `Feedback webhook failed: ${response.status}`;
    throw createError({
      statusCode: 502,
      statusMessage: message,
    });
  }

  return { ok: true };
});
