import apiClient from './client';
import type { Conversation, Message, ChatUser } from '../types/chat.types';

export const chatApi = {
  getConversations: () =>
    apiClient.get<Conversation[]>('/chat/conversations'),

  createConversation: (participantIds: string[], name?: string) =>
    apiClient.post<Conversation>('/chat/conversations', { participantIds, name }),

  getMessages: (conversationId: string, cursor?: string, limit = 50) =>
    apiClient.get<Message[]>(`/chat/conversations/${conversationId}/messages`, {
      params: { cursor, limit },
    }),

  sendMessage: (conversationId: string, content: string) =>
    apiClient.post<Message>(`/chat/conversations/${conversationId}/messages`, {
      content,
    }),

  getUnreadCounts: () =>
    apiClient.get<Record<string, number>>('/chat/unread-counts'),

  getAvailableUsers: () =>
    apiClient.get<ChatUser[]>('/chat/users'),

  addParticipants: (conversationId: string, participantIds: string[]) =>
    apiClient.post<Conversation>(`/chat/conversations/${conversationId}/participants`, {
      participantIds,
    }),

  deleteMessage: (messageId: string) =>
    apiClient.delete<{ messageId: string; conversationId: string }>(`/chat/messages/${messageId}`),

  leaveConversation: (conversationId: string) =>
    apiClient.delete<{ conversationId: string; userId: string }>(`/chat/conversations/${conversationId}/leave`),
};
