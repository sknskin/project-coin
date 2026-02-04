import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import { chatApi } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import type { ChatUser } from '../../types/chat.types';
import Loading from '../common/Loading';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewConversationModal({
  isOpen,
  onClose,
}: NewConversationModalProps) {
  const { t } = useTranslation();
  const { addConversation, setActiveConversation } = useChatStore();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSelectedUsers([]);
      setGroupName('');
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await chatApi.getAvailableUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUser = (user: ChatUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;
    setIsCreating(true);
    try {
      const participantIds = selectedUsers.map((u) => u.id);
      const name = selectedUsers.length > 1 ? groupName || undefined : undefined;
      const response = await chatApi.createConversation(participantIds, name);
      addConversation(response.data);
      setActiveConversation(response.data.id);
      onClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.nickname?.toLowerCase().includes(query) ?? false)
    );
  });

  const isGroup = selectedUsers.length > 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('chat.newConversation')}>
      <div className="space-y-4">
        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
              >
                {user.nickname || user.email}
                <button
                  onClick={() => handleToggleUser(user)}
                  className="hover:text-primary-900 dark:hover:text-primary-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Group name input (shown when 2+ users selected) */}
        {isGroup && (
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t('chat.groupNamePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        )}

        {/* Search Input */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat.searchUsers')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* User List */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="md" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? t('chat.noUsersFound') : t('chat.noUsers')}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => {
                const isAdminRole = user.role === 'ADMIN' || user.role === 'SYSTEM';
                const roleLabel = user.role === 'SYSTEM' ? 'System' : user.role === 'ADMIN' ? 'Admin' : null;
                const isSelected = selectedUsers.some((u) => u.id === user.id);

                return (
                  <button
                    key={user.id}
                    onClick={() => handleToggleUser(user)}
                    disabled={isCreating}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors disabled:opacity-50 text-left ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500'
                        : isAdminRole
                        ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isAdminRole
                        ? 'bg-amber-100 dark:bg-amber-900'
                        : 'bg-primary-100 dark:bg-primary-900'
                    }`}>
                      <span className={`font-semibold ${
                        isAdminRole
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-primary-600 dark:text-primary-400'
                      }`}>
                        {(user.nickname || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {user.nickname || user.email}
                        </p>
                        {roleLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {roleLabel}
                          </span>
                        )}
                      </div>
                      {user.nickname && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Create button */}
        {selectedUsers.length > 0 && (
          <button
            onClick={handleCreateConversation}
            disabled={isCreating}
            className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            {isCreating
              ? t('auth.processing')
              : isGroup
              ? t('chat.createGroupChat', { count: selectedUsers.length })
              : t('chat.startChat')}
          </button>
        )}
      </div>
    </Modal>
  );
}
