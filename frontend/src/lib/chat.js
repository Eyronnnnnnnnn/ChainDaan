export function idValue(value) {
  return value?._id?.toString() || value?.toString() || "";
}

export function mergeConversations(currentConversations, incomingConversations, currentUserId) {
  const conversations = Array.isArray(incomingConversations)
    ? incomingConversations
    : [incomingConversations];
  const byKey = new Map();

  [...currentConversations, ...conversations].forEach((conversation) => {
    if (!conversation) return;
    const participantKey = conversation.participantIds
      ?.map((participant) => idValue(participant))
      .sort()
      .join(":");
    const key = participantKey || idValue(conversation);
    if (!key || (currentUserId && !participantKey?.includes(idValue(currentUserId)))) return;
    byKey.set(key, { ...byKey.get(key), ...conversation });
  });

  return [...byKey.values()];
}

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
