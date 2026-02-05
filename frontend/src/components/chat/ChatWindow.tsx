import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { chatApi } from '../../api/chat.api';
import MessageInput from './MessageInput';
import Loading from '../common/Loading';
import AddParticipantsModal from './AddParticipantsModal';
import ConfirmModal from '../common/ConfirmModal';

interface ChatWindowProps {
  conversationId: string;
  onSendMessage: (conversationId: string, content: string) => void;
  onMarkAsRead: (conversationId: string) => void;
  onStartTyping: (conversationId: string) => void;
  onStopTyping: (conversationId: string) => void;
}

export default function ChatWindow({
  conversationId,
  onSendMessage,
  onMarkAsRead,
  onStartTyping,
  onStopTyping,
}: ChatWindowProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    typingUsers,
    setMessages,
    addMessage,
    setActiveConversation,
    isLoadingMessages,
    setLoadingMessages,
    onlineUsers,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAddParticipantsOpen, setIsAddParticipantsOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const conversationMessages = messages.get(conversationId) || [];
  const conversation = conversations.find((c) => c.id === conversationId);

  const isGroup = conversation?.isGroup || (conversation?.participants.length ?? 0) > 2;
  const otherParticipants = conversation?.participants.filter(
    (p) => p.userId !== user?.id
  ) || [];

  const displayName = isGroup
    ? conversation?.name ||
      otherParticipants
        .map((p) => p.user.nickname || p.user.email)
        .join(', ')
    : otherParticipants[0]?.user.nickname ||
      otherParticipants[0]?.user.email ||
      t('chat.unknown');

  const isOnline = isGroup
    ? otherParticipants.some((p) => onlineUsers.has(p.userId))
    : otherParticipants[0]
    ? onlineUsers.has(otherParticipants[0].userId)
    : false;

  const onlineCount = isGroup
    ? otherParticipants.filter((p) => onlineUsers.has(p.userId)).length
    : 0;

  const typingUserIds = typingUsers.get(conversationId) || [];
  const isOtherTyping = typingUserIds.length > 0;

  const typingDisplay = isGroup
    ? typingUserIds
        .map((uid) => {
          const p = otherParticipants.find((op) => op.userId === uid);
          return p?.user.nickname || p?.user.email || '';
        })
        .filter(Boolean)
        .join(', ') + ' ' + t('chat.typing')
    : t('chat.typing');

  useEffect(() => {
    loadMessages();
    onMarkAsRead(conversationId);
  }, [conversationId]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMenuOpen) setIsMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await chatApi.getMessages(conversationId);
      setMessages(conversationId, response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (content: string) => {
    if (user) {
      const optimisticMessage: import('../../types/chat.types').Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: user.id,
        sender: { id: user.id, email: user.email || '', nickname: user.nickname || '' },
        content,
        createdAt: new Date().toISOString(),
        isDeleted: false,
        unreadCount: otherParticipants.length,
      };
      addMessage(conversationId, optimisticMessage);
    }
    onSendMessage(conversationId, content);
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('chat.today');
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return t('chat.yesterday');
    }
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const shouldShowDateSeparator = (
    currentDate: string,
    prevDate: string | null
  ) => {
    if (!prevDate) return true;
    return (
      new Date(currentDate).toDateString() !== new Date(prevDate).toDateString()
    );
  };

  // 그룹 채팅에서 발신자 표시 여부 (이전 메시지와 다른 발신자일 때)
  const shouldShowSender = (index: number) => {
    if (!isGroup) return false;
    const msg = conversationMessages[index];
    if (msg.senderId === user?.id) return false;
    if (index === 0) return true;
    return conversationMessages[index - 1].senderId !== msg.senderId;
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await chatApi.deleteMessage(messageToDelete);
      useChatStore.getState().deleteMessage(conversationId, messageToDelete);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setMessageToDelete(null);
    }
  };

  const handleLeaveConversation = async () => {
    try {
      await chatApi.leaveConversation(conversationId);
      useChatStore.getState().removeConversation(conversationId);
    } catch (error) {
      console.error('Failed to leave conversation:', error);
    } finally {
      setIsLeaveModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveConversation(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="relative flex-shrink-0">
          {isGroup ? (
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {isOnline && !isGroup && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            {isGroup && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {conversation?.participants.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isOtherTyping
              ? typingDisplay
              : isGroup
              ? onlineCount > 0
                ? `${onlineCount} ${t('chat.online').toLowerCase()}`
                : t('chat.offline')
              : isOnline
              ? t('chat.online')
              : t('chat.offline')}
          </p>
        </div>
        {/* Header actions */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setIsAddParticipantsOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('chat.addParticipants')}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLeaveModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  {t('chat.leaveConversation')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loading size="md" />
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            {t('chat.startConversation')}
          </div>
        ) : (
          <>
            {conversationMessages.map((message, index) => {
              const prevMessage = index > 0 ? conversationMessages[index - 1] : null;
              const showDateSeparator = shouldShowDateSeparator(
                message.createdAt,
                prevMessage?.createdAt || null
              );
              const isOwn = message.senderId === user?.id;
              const showSender = shouldShowSender(index);

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {formatDateSeparator(message.createdAt)}
                      </span>
                    </div>
                  )}
                  {showSender && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-1 mt-2 mb-0.5">
                      {message.sender?.nickname || message.sender?.email}
                    </p>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`flex items-end gap-1 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                      {/* 읽음 카운트 (카카오톡 스타일) */}
                      {message.unreadCount !== undefined && message.unreadCount > 0 && (
                        <span className="text-xs text-primary-500 dark:text-primary-400 font-medium flex-shrink-0 mb-1">
                          {message.unreadCount}
                        </span>
                      )}
                      {/* 삭제 버튼 (본인 메시지만) */}
                      {isOwn && !message.id.startsWith('temp-') && (
                        <button
                          onClick={() => setMessageToDelete(message.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all flex-shrink-0 mb-1"
                          title={t('chat.deleteMessage')}
                        >
                          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTypingStart={() => onStartTyping(conversationId)}
        onTypingStop={() => onStopTyping(conversationId)}
      />

      {/* Add Participants Modal */}
      {conversation && (
        <AddParticipantsModal
          isOpen={isAddParticipantsOpen}
          onClose={() => setIsAddParticipantsOpen(false)}
          conversation={conversation}
        />
      )}

      {/* Delete Message Confirmation */}
      <ConfirmModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={handleDeleteMessage}
        title={t('chat.deleteMessage')}
        message={t('chat.deleteMessageConfirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
      />

      {/* Leave Conversation Confirmation */}
      <ConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveConversation}
        title={t('chat.leaveConversation')}
        message={t('chat.leaveConversationConfirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
