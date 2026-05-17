export type ContactMessage = {
  id: string;
  senderRole: 'client' | 'admin';
  senderId?: string;
  senderName: string;
  body: string;
  createdAt: string;
};

export type ContactThread = {
  subject: string;
  messages: ContactMessage[];
};

type LegacyContactPayload = {
  subject?: string;
  message?: string;
  reply?: string;
};

const cleanText = (value: unknown) => String(value || '').trim();

const buildMessage = (
  senderRole: 'client' | 'admin',
  senderName: string,
  body: string,
  senderId?: string,
  createdAt?: string
): ContactMessage => ({
  id: `${senderRole}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  senderRole,
  senderId,
  senderName: cleanText(senderName) || (senderRole === 'admin' ? 'Admin' : 'Khach hang'),
  body: cleanText(body),
  createdAt: createdAt || new Date().toISOString()
});

export const parseContactThread = (content: string | null, fallbackSubject = ''): ContactThread => {
  if (!content) {
    return { subject: fallbackSubject, messages: [] };
  }

  try {
    const parsed = JSON.parse(content);

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.messages)) {
      const messages = parsed.messages
        .map((message: any) => ({
          id: cleanText(message?.id) || `msg-${Date.now()}`,
          senderRole: message?.senderRole === 'admin' ? 'admin' : 'client',
          senderId: cleanText(message?.senderId) || undefined,
          senderName: cleanText(message?.senderName) || (message?.senderRole === 'admin' ? 'Admin' : 'Khach hang'),
          body: cleanText(message?.body),
          createdAt: cleanText(message?.createdAt) || new Date().toISOString()
        }))
        .filter((message: ContactMessage) => message.body);

      return {
        subject: cleanText(parsed.subject) || fallbackSubject,
        messages
      };
    }

    const legacy = parsed as LegacyContactPayload;
    const subject = cleanText(legacy.subject) || fallbackSubject;
    const messages: ContactMessage[] = [];

    if (cleanText(legacy.message)) {
      messages.push(buildMessage('client', 'Khach hang', cleanText(legacy.message), undefined, new Date().toISOString()));
    }

    if (cleanText(legacy.reply)) {
      messages.push(buildMessage('admin', 'Admin', cleanText(legacy.reply), undefined, new Date().toISOString()));
    }

    return { subject, messages };
  } catch {
    return {
      subject: fallbackSubject,
      messages: [buildMessage('client', 'Khach hang', content)]
    };
  }
};

export const appendContactMessage = (
  content: string | null,
  message: ContactMessage,
  fallbackSubject = ''
): ContactThread => {
  const thread = parseContactThread(content, fallbackSubject);
  return {
    subject: thread.subject || fallbackSubject,
    messages: [...thread.messages, message]
  };
};

export const createContactMessage = (
  senderRole: 'client' | 'admin',
  senderName: string,
  body: string,
  senderId?: string
) => buildMessage(senderRole, senderName, body, senderId);

export const getContactStatusFromThread = (thread: ContactThread): string => {
  const lastMessage = thread.messages[thread.messages.length - 1];
  return lastMessage?.senderRole === 'admin' ? '2' : '1';
};

export const formatContactThread = (contact: any) => {
  const thread = parseContactThread(contact.content);
  const firstClientMessage = thread.messages.find((message) => message.senderRole === 'client');
  const latestAdminReply = [...thread.messages].reverse().find((message) => message.senderRole === 'admin');
  const latestMessage = thread.messages[thread.messages.length - 1];

  return {
    contact_id: contact.contact_id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    subject: thread.subject || '',
    message: firstClientMessage?.body || '',
    reply: latestAdminReply?.body || '',
    preview: latestMessage?.body || firstClientMessage?.body || '',
    messages: thread.messages,
    status: contact.status,
    create_at: contact.create_at,
    update_at: contact.update_at
  };
};
