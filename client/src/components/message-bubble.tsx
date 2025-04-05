import { Message } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const isSentByMe = user?.id === message.senderId;

  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  return (
    <div className={`mb-4 flex ${isSentByMe ? "justify-end" : ""}`}>
      <div
        className={`px-4 py-3 max-w-md ${
          isSentByMe
            ? "message-bubble-sent bg-primary text-white"
            : "message-bubble-received bg-neutral-100 text-neutral-800"
        }`}
        style={{
          borderRadius: isSentByMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        }}
      >
        <p>{message.content}</p>
        
        {isSentByMe && message.vibe ? (
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-white text-opacity-80">
              {message.timestamp ? formatTime(message.timestamp) : "Just now"}
            </span>
            <span className="text-xs px-2 py-0.5 bg-white bg-opacity-20 rounded-full">
              {message.vibe}
            </span>
          </div>
        ) : (
          <p className="text-xs text-neutral-500 mt-1">
            {message.timestamp ? formatTime(message.timestamp) : "Just now"}
          </p>
        )}
      </div>
    </div>
  );
}
