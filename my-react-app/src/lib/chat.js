export function mergeMessages(currentMessages, incomingMessages) {
  const messages = Array.isArray(incomingMessages) ? incomingMessages : [incomingMessages];
  const byKey = new Map();

  [...currentMessages, ...messages].forEach((message) => {
    if (!message) return;
    const key = message._id?.toString() || [
      message.conversationId,
      message.senderId,
      message.createdAt,
      message.text,
    ].join(":");
    byKey.set(key, { ...byKey.get(key), ...message });
  });

  return [...byKey.values()].sort(
    (first, second) => new Date(first.createdAt || 0) - new Date(second.createdAt || 0)
  );
}
