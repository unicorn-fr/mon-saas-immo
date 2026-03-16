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
      <div
        className="h-full overflow-hidden flex"
        style={{ backgroundColor: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >

        {/* Conversation list — left panel */}
        <div
          className={`w-full lg:w-[300px] flex-shrink-0 flex flex-col ${isMobileView ? 'hidden lg:flex' : 'flex'}`}
          style={{
            background: '#ffffff',
            borderRight: '1px solid #e4e1db',
          }}
        >
          <ConversationList
            selectedConversationId={selectedConversation?.id || null}
            onConversationSelect={handleConversationSelect}
          />
        </div>

        {/* Chat window — right panel */}
        <div
          className={`flex-1 overflow-hidden ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}
          style={{ background: '#fafaf8' }}
        >
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} onBack={handleBack} />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full gap-5">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: '#f4f2ee',
                  border: '1px solid #e4e1db',
                  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                }}
              >
                <MessageSquare className="w-7 h-7" strokeWidth={1.5} style={{ color: '#9e9b96' }} />
              </div>

              <div className="text-center">
                <p
                  className="mb-1.5"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: '22px',
                    color: '#0d0c0a',
                  }}
                >
                  Vos messages
                </p>
                <p
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '13px',
                    color: '#9e9b96',
                    maxWidth: '210px',
                    lineHeight: '1.6',
                  }}
                >
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
