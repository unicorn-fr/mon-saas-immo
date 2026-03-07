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
      <div className="h-full overflow-hidden flex" style={{ backgroundColor: 'var(--surface-page)' }}>

        {/* ── Liste des conversations ────────────────────────── */}
        <div
          className={`w-full lg:w-[300px] flex-shrink-0 border-r flex flex-col ${isMobileView ? 'hidden lg:flex' : 'flex'}`}
          style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
        >
          <ConversationList
            selectedConversationId={selectedConversation?.id || null}
            onConversationSelect={handleConversationSelect}
          />
        </div>

        {/* ── Fenêtre de chat ───────────────────────────────── */}
        <div className={`flex-1 overflow-hidden ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} onBack={handleBack} />
          ) : (
            <div
              className="flex flex-col items-center justify-center w-full h-full gap-5"
              style={{ backgroundColor: 'var(--surface-page)' }}
            >
              {/* Icône centrale */}
              <div
                className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center shadow-xl"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
              >
                <MessageSquare className="w-9 h-9 text-white" strokeWidth={1.5} />
              </div>

              <div className="text-center">
                <p className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Vos messages
                </p>
                <p className="text-[13px] max-w-[210px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
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
