"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChat, Chat, Attachment } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdvancedChatInput, FileAttachment } from "@/components/ui/advanced-chat-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
  ArrowLeft,
  Download,
  MoreHorizontal,
  MoreVertical,
  Copy,
  Reply,
  Trash2,
  Flag,
  UserMinus2,
  Check,
  CheckCheck,
  Video,
  Lock,
  User,
} from "lucide-react";
import { useEncryption } from "@/context/EncryptionContext";

interface ChatWindowProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

import { useRouter } from "next/navigation";

// Gradient backgrounds for avatars - matching user-nav style
const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500',
  'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500',
  'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400',
  'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500',
  'bg-gradient-to-br from-amber-400 via-orange-400 to-red-400',
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400',
  'bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-400',
  'bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-700',
];

// Get consistent gradient based on user email/id
const getGradient = (identifier: string) => {
  if (!identifier) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

// Status badge component
type StatusType = "online" | "offline";
const STATUS_COLORS: Record<StatusType, string> = {
  online: "bg-green-500",
  offline: "bg-gray-400",
};

function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span
      aria-label={status}
      className={cn(
        "inline-block size-2.5 rounded-full border-2 border-background",
        STATUS_COLORS[status]
      )}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}

// User actions menu (header)
function UserActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="User actions"
          className="rounded-full bg-transparent border-none"
          size="icon"
          type="button"
          variant="outline"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-36 rounded-2xl bg-muted p-1 shadow-xl">
        <div className="flex flex-col gap-1">
          <Button
            className="w-full justify-start gap-2 rounded bg-transparent text-rose-600 hover:bg-accent"
            size="sm"
            type="button"
            variant="ghost"
          >
            <UserMinus2 className="size-4" />
            <span className="font-medium text-xs">Block User</span>
          </Button>
          <Button
            className="w-full justify-start gap-2 rounded bg-transparent text-destructive hover:bg-accent"
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-4" />
            <span className="font-medium text-xs">Delete Conversation</span>
          </Button>
          <Button
            className="w-full justify-start gap-2 rounded bg-transparent text-yellow-600 hover:bg-accent"
            size="sm"
            type="button"
            variant="ghost"
          >
            <Flag className="size-4" />
            <span className="font-medium text-xs">Report User</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Message actions menu (on hover)
function MessageActions({ isMe, onCopy, onReply }: { isMe: boolean; onCopy: () => void; onReply: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Message actions"
          className="size-7 rounded-full"
          size="icon"
          type="button"
          variant="ghost"
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-40 rounded-2xl bg-muted p-1 shadow-xl"
      >
        <div className="flex flex-col gap-1">
          <Button
            onClick={onReply}
            className="w-full justify-start gap-2 rounded px-2 py-1 text-xs"
            size="sm"
            type="button"
            variant="ghost"
          >
            <Reply className="size-3" />
            <span>Reply</span>
          </Button>
          <Button
            onClick={onCopy}
            className="w-full justify-start gap-2 rounded px-2 py-1 text-xs"
            size="sm"
            type="button"
            variant="ghost"
          >
            <Copy className="size-3" />
            <span>Copy</span>
          </Button>
          {isMe && (
            <Button
              className="w-full justify-start gap-2 rounded px-2 py-1 text-destructive text-xs"
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-3" />
              <span>Delete</span>
            </Button>
          )}
          {!isMe && (
            <Button
              className="w-full justify-start gap-2 rounded px-2 py-1 text-xs text-yellow-600"
              size="sm"
              type="button"
              variant="ghost"
            >
              <Flag className="size-3" />
              <span>Report</span>
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



export function ChatWindow({ onBack, showBackButton }: ChatWindowProps) {
  const { activeChat, messages, messagesLoading, sendMessage, markAsRead } = useChat();
  const { user, userProfile } = useAuth();
  const { isReady: encryptionReady, isSupported: encryptionSupported, encrypt, decrypt, ensureKeys } = useEncryption();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Video call handler for employers
  const handleVideoCall = () => {
    if (!activeChat || userProfile?.role !== "employer") return;
    const other = getOtherParticipant(activeChat);
    if (!other) return;
    
    const params = new URLSearchParams({
      recipientId: other.id,
      recipientName: other.displayName || "Applicant",
      opportunityId: activeChat.opportunityId || "",
      opportunityTitle: activeChat.opportunityTitle || "",
      applicationId: activeChat.applicationId || "",
    });
    
    router.push(`/video-call?${params.toString()}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      markAsRead(activeChat.id);
    }
  }, [activeChat, markAsRead]);

  // Decrypt encrypted messages
  useEffect(() => {
    const decryptMessages = async () => {
      if (!encryptionReady || !messages.length) return;

      const newDecrypted = new Map(decryptedMessages);
      let hasNew = false;

      for (const message of messages) {
        if (message.encrypted && message.ciphertext && message.iv && !newDecrypted.has(message.id)) {
          try {
            const plaintext = await decrypt(message.ciphertext, message.iv, message.senderId);
            if (plaintext) {
              newDecrypted.set(message.id, plaintext);
              hasNew = true;
            }
          } catch (error) {
            console.error("Failed to decrypt message:", message.id, error);
            newDecrypted.set(message.id, "[Unable to decrypt]");
            hasNew = true;
          }
        }
      }

      if (hasNew) {
        setDecryptedMessages(newDecrypted);
      }
    };

    decryptMessages();
  }, [messages, encryptionReady, decrypt, decryptedMessages]);

  // Helper to get message text (decrypted or plain)
  const getMessageText = useCallback((message: typeof messages[0]) => {
    if (message.encrypted) {
      return decryptedMessages.get(message.id) || "...";
    }
    return message.text;
  }, [decryptedMessages]);


  const getOtherParticipant = (chat: Chat) => {
    if (!user?.uid) return null;
    const otherId = chat.participants.find((p) => p !== user.uid);
    if (!otherId) return null;
    return {
      id: otherId,
      ...chat.participantDetails[otherId],
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }, [toast]);

  const handleReplyMessage = useCallback((messageText: string) => {
    setReplyingTo(messageText);
  }, []);

  const handleSend = async () => {
    if (!activeChat || (!inputValue.trim() && attachments.length === 0)) return;

    setSending(true);
    try {
      const messageToSend = replyingTo 
        ? `> ${replyingTo}\n\n${inputValue}`
        : inputValue;

      // Get the other participant for encryption
      const other = getOtherParticipant(activeChat);
      
      // Try to encrypt if encryption is supported and ready
      let encryption: { ciphertext: string; iv: string } | undefined;
      
      if (encryptionSupported && other && inputValue.trim()) {
        // Ensure keys exist
        await ensureKeys();
        
        // Encrypt the message
        const encrypted = await encrypt(messageToSend, other.id);
        if (encrypted) {
          encryption = encrypted;
        }
      }

      await sendMessage(activeChat.id, messageToSend, attachments.length > 0 ? attachments : undefined, encryption);
      setInputValue("");
      setAttachments([]);
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string | number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== id));
  };

  const renderAttachment = (attachment: Attachment) => {
    if (attachment.type === "image") {
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-xs rounded-lg mt-2 hover:opacity-90 transition-opacity"
          />
        </a>
      );
    }
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
      >
        <FileText className="h-4 w-4" />
        <span className="text-sm truncate">{attachment.name}</span>
        <Download className="h-4 w-4 ml-auto" />
      </a>
    );
  };

  // Convert File[] to FileAttachment[] for the input component
  const fileAttachments: FileAttachment[] = attachments.map((file, index) => ({
    id: index,
    name: file.name,
    icon: file.type.startsWith("image/") 
      ? <ImageIcon className="h-4 w-4 text-muted-foreground" />
      : <FileText className="h-4 w-4 text-muted-foreground" />,
  }));

  // Action icons for the input
  const actionIcons = [
    <Button 
      key="attach" 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 rounded-full"
      onClick={() => fileInputRef.current?.click()}
    >
      <Paperclip className="h-4 w-4 text-muted-foreground" />
    </Button>,
  ];

  if (!activeChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Send className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Select a conversation</p>
        <p className="text-xs mt-1">Choose from your messages on the left</p>
      </div>
    );
  }

  const other = getOtherParticipant(activeChat);

  return (
    <div className="flex flex-col h-full ">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-1 px-3 py-1">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={other?.photoURL} />
              <AvatarFallback className={cn(
                "text-white font-medium",
                getGradient(other?.id || "")
              )} />
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusBadge status="online" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{other?.displayName}</p>
            {userProfile?.role === "employer" && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                {activeChat.opportunityTitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Video call button - only for employers */}
          {userProfile?.role === "employer" && activeChat && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full text-emerald-600 hover:text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={handleVideoCall}
              title="Video call"
            >
              <Video className="h-4 w-4" />
            </Button>
          )}
          <UserActionsMenu />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const isOwn = message.senderId === user?.uid;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const isContinuation = prevMessage?.senderId === message.senderId;
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "group flex gap-2",
                      isOwn ? "justify-end" : "justify-start",
                      isContinuation ? "mt-1" : "mt-4"
                    )}
                  >
                    <div
                      className={cn(
                        "flex max-w-[80%] items-start gap-2",
                        isOwn ? "flex-row-reverse" : undefined
                      )}
                    >
                      {/* Avatar */}
                      {!isContinuation ? (
                        <Avatar className="size-8 mt-1">
                          <AvatarImage src={isOwn ? (user?.photoURL || userProfile?.photoURL || "") : other?.photoURL} />
                          <AvatarFallback className={cn(
                            "text-white text-xs font-medium",
                            isOwn 
                              ? getGradient(user?.uid || user?.email || "") 
                              : getGradient(other?.id || "")
                          )} />
                        </Avatar>
                      ) : (
                        <div className="size-8" />
                      )}
                      
                      <div>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className={cn(
                            "rounded-3xl px-4 py-2.5 text-sm",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent text-foreground"
                          )}
                        >
                          {(message.text || message.encrypted) && (
                            <div className="leading-relaxed whitespace-pre-wrap">
                              {(() => {
                                const displayText = getMessageText(message);
                                if (displayText.startsWith("> ") && displayText.includes("\n\n")) {
                                  return (
                                    <>
                                      <div className={cn(
                                        "mb-2 rounded-xl border-l-4 p-2 text-xs opacity-90",
                                        isOwn 
                                          ? "bg-white/10 border-white/50" 
                                          : "bg-black/5 dark:bg-white/5 border-primary"
                                      )}>
                                        <p className="line-clamp-2 font-medium opacity-80">
                                          {displayText.split("\n\n")[0].substring(2)}
                                        </p>
                                      </div>
                                      <p>{displayText.split("\n\n").slice(1).join("\n\n")}</p>
                                    </>
                                  );
                                }
                                return <p>{displayText}</p>;
                              })()}
                            </div>
                          )}
                          {message.attachments?.map((att, i) => (
                            <div key={i}>{renderAttachment(att)}</div>
                          ))}
                        </motion.div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <time
                            className="text-muted-foreground text-xs"
                            dateTime={message.timestamp?.toDate?.()?.toISOString()}
                          >
                            {message.timestamp?.toDate &&
                              format(message.timestamp.toDate(), "p")}
                          </time>
                          {/* Message status ticks - only for own messages */}
                          {isOwn && (
                            <span className="flex items-center">
                              {message.read ? (
                                <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                              ) : (
                                <Check className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </span>
                          )}
                          <div className="opacity-0 transition-all group-hover:opacity-100">
                            <MessageActions 
                              isMe={isOwn} 
                              onCopy={() => handleCopyMessage(getMessageText(message))}
                              onReply={() => handleReplyMessage(getMessageText(message))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>



      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-2"
          >
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border-l-2 border-primary">
              <Reply className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                {replyingTo}
              </span>
              <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Advanced Chat Input */}
      <div>
        <AdvancedChatInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          files={fileAttachments}
          onFileRemove={removeAttachment}
          onSend={handleSend}
          actionIcons={actionIcons}
          disabled={sending}
          isSending={sending}
          textareaProps={{
            onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            },
          }}
        />
      </div>
    </div>
  );
}
