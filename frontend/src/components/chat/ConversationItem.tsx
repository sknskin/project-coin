import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type { Conversation } from '../../types/chat.types';

interface ConversationItemProps {
  conversation: Conversation;
}

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { setActiveConversation, unreadCounts, onlineUsers } = useChatStore();

  const isGroup = conversation.isGroup || conversation.participants.length > 2;
  const otherParticipants = conversation.participants.filter(
    (p) => p.userId !== user?.id
  );

  const displayName = isGroup
    ? conversation.name ||
      otherParticipants
        .map((p) => p.user.nickname || p.user.email)
        .join(', ')
    : otherParticipants[0]?.user.nickname ||
      otherParticipants[0]?.user.email ||
      t('chat.unknown');

  const lastMessage = conversation.messages[0];
  const unreadCount = unreadCounts[conversation.id] || 0;
  const isOnline = isGroup
    ? otherParticipants.some((p) => onlineUsers.has(p.userId))
    : otherParticipants[0]
    ? onlineUsers.has(otherParticipants[0].userId)
    : false;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const avatarText = isGroup
    ? (conversation.name || displayName).charAt(0).toUpperCase()
    : displayName.charAt(0).toUpperCase();

  return (
    <button
      onClick={() => setActiveConversation(conversation.id)}
      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
    >
      {/* Avatar */}
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
              {avatarText}
            </span>
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {displayName}
            </span>
            {isGroup && (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                {conversation.participants.length}
              </span>
            )}
          </div>
          {lastMessage && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
              {formatTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {lastMessage
              ? lastMessage.senderId === user?.id
                ? `${t('chat.you')}: ${lastMessage.content}`
                : isGroup
                ? `${lastMessage.sender?.nickname || lastMessage.sender?.email || ''}: ${lastMessage.content}`
                : lastMessage.content
              : t('chat.noMessages')}
          </p>
          {unreadCount > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 flex-shrink-0 ml-2">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
