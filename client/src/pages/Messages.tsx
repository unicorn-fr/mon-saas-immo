import { useState } from 'react'
import { ConversationList } from '../components/message/ConversationList'
import { ChatWindow } from '../components/message/ChatWindow'
import { Conversation } from '../types/message.types'
import { MessageSquare } from 'lucide-react'
import { Layout } from '../components/layout/Layout'

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setIsMobileView(true)
  }

  const handleBack = () => {
    setIsMobileView(false)
  }

  return (
    <Layout>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
        {/* Conversation List - Desktop: always visible, Mobile: hide when chat is open */}
        <div
          className={`
            w-full lg:w-96 flex-shrink-0 border-r
            ${isMobileView ? 'hidden lg:block' : 'block'}
          `}
        >
          <ConversationList
            selectedConversationId={selectedConversation?.id || null}
            onConversationSelect={handleConversationSelect}
          />
        </div>

        {/* Chat Window - Desktop: always visible, Mobile: show when conversation selected */}
        <div
          className={`
            flex-1
            ${!selectedConversation ? 'hidden lg:flex' : 'flex'}
          `}
        >
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} onBack={handleBack} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white">
              <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sélectionnez une conversation</h2>
              <p className="text-gray-600 max-w-md">
                Choisissez une conversation dans la liste pour commencer à échanger avec un propriétaire ou un locataire.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  )
}
