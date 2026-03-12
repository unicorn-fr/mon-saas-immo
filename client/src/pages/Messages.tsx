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
      <div className="h-full overflow-hidden flex" style={{ backgroundColor: '#f5f5f7' }}>

        {/* Conversation list */}
        <div
          className={`w-full lg:w-[300px] flex-shrink-0 border-r border-[#d2d2d7] flex flex-col bg-white ${isMobileView ? 'hidden lg:flex' : 'flex'}`}
        >
          <ConversationList
            selectedConversationId={selectedConversation?.id || null}
            onConversationSelect={handleConversationSelect}
          />
        </div>

        {/* Chat window */}
        <div
          className={`flex-1 overflow-hidden bg-[#f5f5f7] ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}
        >
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} onBack={handleBack} />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full gap-4">
              {/* Central icon */}
              <div className="w-16 h-16 bg-[#e8f0fe] rounded-2xl flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)]">
                <MessageSquare className="w-8 h-8 text-[#007AFF]" strokeWidth={1.5} />
              </div>

              <div className="text-center">
                <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                  Vos messages
                </p>
                <p className="text-[13px] text-[#86868b] max-w-[210px] leading-relaxed">
                  Sélectionnez une conversation pour commencer à échanger.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
