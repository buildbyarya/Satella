import ChatMessages from "@/components/chat/ChatMessages"
import ChatJumpButton from "@/components/chat/ChatJumpButton"
import ChatSeenMeta from "@/components/chat/ChatSeenMeta"

export default function ChatMessagesPage(){
  return (
    <>
      <ChatMessages />
      <ChatJumpButton />
      <ChatSeenMeta />
    </>
  )
}
