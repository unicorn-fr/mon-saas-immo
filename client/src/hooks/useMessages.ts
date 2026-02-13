import { useMessageStore } from '../store/messageStore'

export const useMessages = () => {
  const {
    conversations,
    currentConversation,
    messages,
    messagesTotal,
    unreadCount,
    isLoading,
    isLoadingMessages,
    isSending,
    error,
    fetchConversations,
    pollConversations,
    fetchConversationById,
    createConversation,
    fetchMessages,
    pollMessages,
    sendMessage,
    markAsRead,
    fetchUnreadCount,
    deleteMessage,
    searchMessages,
    setCurrentConversation,
    addMessageOptimistic,
    setError,
    clearMessages,
  } = useMessageStore()

  return {
    // State
    conversations,
    currentConversation,
    messages,
    messagesTotal,
    unreadCount,
    isLoading,
    isLoadingMessages,
    isSending,
    error,

    // Actions
    fetchConversations,
    pollConversations,
    fetchConversationById,
    createConversation,
    fetchMessages,
    pollMessages,
    sendMessage,
    markAsRead,
    fetchUnreadCount,
    deleteMessage,
    searchMessages,
    setCurrentConversation,
    addMessageOptimistic,
    setError,
    clearMessages,
  }
}
