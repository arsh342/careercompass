'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link2 } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LoaderConfig {
  enabled: boolean;
  delay?: number;
  duration?: number;
}

interface Link {
  text: string;
}

interface Message {
  id: number;
  sender: 'left' | 'right';
  type: 'text' | 'image' | 'text-with-links';
  content: string;
  maxWidth?: string;
  loader?: LoaderConfig;
  links?: Link[];
}

interface Person {
  name: string;
  avatar: string;
}

interface ChatStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  showBorder: boolean;
  nameColor?: string;
}

interface LinkBubbleStyle {
  backgroundColor: string;
  textColor: string;
  iconColor: string;
  borderColor: string;
}

interface UiConfig {
  containerWidth?: number;
  containerHeight?: number;
  backgroundColor?: string;
  autoRestart?: boolean;
  restartDelay?: number;
  loader?: {
    dotColor?: string;
  };
  linkBubbles?: LinkBubbleStyle;
  leftChat?: ChatStyle;
  rightChat?: ChatStyle;
}

interface ChatConfig {
  leftPerson: Person;
  rightPerson: Person;
  messages: Message[];
}

interface ChatComponentProps {
  config: ChatConfig;
  uiConfig?: UiConfig;
}

interface MessageLoaderProps {
  dotColor?: string;
}

interface LinkBadgeProps {
  link: Link;
  linkStyle: LinkBubbleStyle;
}

interface MessageBubbleProps {
  message: Message;
  isLeft: boolean;
  uiConfig: Required<UiConfig>;
  onContentReady?: () => void;
  isLoading: boolean;
  isVisible: boolean;
}

interface MessageWrapperProps {
  message: Message;
  config: ChatConfig;
  uiConfig: Required<UiConfig>;
  previousMessageComplete: boolean;
  onMessageComplete?: (messageId: number) => void;
  previousMessage: Message | null;
  nextMessage: Message | null;
  onVisibilityChange?: (messageId: number) => void;
  isNextVisible: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert hex color to rgba with specified alpha
 */
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Animated loading indicator with bouncing dots
 */
const MessageLoader = React.memo<MessageLoaderProps>(({ dotColor = '#9ca3af' }) => {
  const dotAnimation = {
    y: [0, -6, 0]
  };

  const dotTransition = (delay = 0) => ({
    duration: 0.6,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay
  });

  return (
    <motion.div
      className="flex items-center gap-1 px-3 py-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: dotColor }}
          animate={dotAnimation}
          transition={dotTransition(delay)}
        />
      ))}
    </motion.div>
  );
});

MessageLoader.displayName = 'MessageLoader';

/**
 * Link badge component for displaying clickable links (non-functional, just visual)
 */
const LinkBadge = React.memo<LinkBadgeProps>(({ link, linkStyle }) => (
  <div
    className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs border tracking-wider"
    style={{
      backgroundColor: linkStyle.backgroundColor,
      color: linkStyle.textColor,
      borderColor: linkStyle.borderColor
    }}
  >
    <Link2 size={12} color={linkStyle.iconColor} />
    <span>{link.text}</span>
  </div>
));

LinkBadge.displayName = 'LinkBadge';

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

/**
 * Message bubble that displays different content types (text, image, text-with-links)
 */
const MessageBubble = React.memo<MessageBubbleProps>(({ message, isLeft, uiConfig, onContentReady, isLoading, isVisible }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const chatStyle = isLeft ? uiConfig.leftChat! : uiConfig.rightChat!;

  useEffect(() => {
    if (isVisible && (message.type === 'text' || message.type === 'text-with-links')) {
      onContentReady?.();
    }
  }, [isVisible, message.type, onContentReady]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    onContentReady?.();
  }, [onContentReady]);

  const bubbleStyle = useMemo(() => ({
    backgroundColor: chatStyle.backgroundColor,
    color: chatStyle.textColor,
    borderColor: chatStyle.borderColor,
    borderWidth: chatStyle.showBorder ? '0.5px' : '0'
  }), [chatStyle.backgroundColor, chatStyle.textColor, chatStyle.borderColor, chatStyle.showBorder]);

  const roundedClass = isLeft
    ? "rounded-br-lg rounded-tl-lg rounded-tr-lg"
    : "rounded-bl-lg rounded-tl-lg rounded-tr-lg";

  const paddingClass = message.type === 'image' ? 'p-1' : 'p-4';
  const maxWidthClass = message.maxWidth || 'max-w-sm';

  return (
    <div
      className={`${roundedClass} ${paddingClass} ${maxWidthClass} border-solid relative`}
      style={bubbleStyle}
    >
      <AnimatePresence mode="wait">
        {isLoading && !isVisible ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={message.type === 'image' ? 'flex items-center justify-center p-3' : 'flex items-center justify-center'}
          >
            <MessageLoader dotColor={uiConfig.loader?.dotColor} />
          </motion.div>
        ) : isVisible ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {message.type === 'text' && (
              <p className="text-sm leading-relaxed" style={{ color: chatStyle.textColor }}>
                {message.content}
              </p>
            )}

            {message.type === 'image' && (
              <div className="relative min-h-32">
                {!imageLoaded && (
                  <div className="w-full h-32 flex items-center justify-center">
                    <MessageLoader dotColor={uiConfig.loader?.dotColor} />
                  </div>
                )}
                <img
                  src={message.content}
                  alt="Chat image"
                  className={`rounded max-h-full max-w-48 h-auto object-cover ${!imageLoaded ? 'hidden' : ''}`}
                  onLoad={handleImageLoad}
                />
              </div>
            )}

            {message.type === 'text-with-links' && (
              <div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: chatStyle.textColor }}>
                  {message.content}
                </p>
                <div className="flex flex-wrap gap-1">
                  {message.links?.map((link, index) => (
                    <LinkBadge key={index} link={link} linkStyle={uiConfig.linkBubbles!} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// ============================================================================
// MESSAGE WRAPPER COMPONENT
// ============================================================================

const MessageWrapper = React.memo<MessageWrapperProps>(({
  message,
  config,
  uiConfig,
  previousMessageComplete,
  onMessageComplete,
  previousMessage,
  nextMessage,
  onVisibilityChange,
  isNextVisible
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [messageCompleted, setMessageCompleted] = useState(false);

  const isLeft = message.sender === 'left';
  const person = isLeft ? config.leftPerson : config.rightPerson;
  const chatStyle = isLeft ? uiConfig.leftChat! : uiConfig.rightChat!;

  const isContinuation = previousMessage?.sender === message.sender;
  const nextMessageSameSender = nextMessage?.sender === message.sender;
  const shouldShowAvatar = !nextMessageSameSender || !isNextVisible;

  useEffect(() => {
    if (!previousMessageComplete) return;

    const { loader } = message;
    const loaderDelay = 500;
    const totalDelay = loaderDelay + (loader?.duration || 1000);

    if (loader?.enabled) {
      const loaderTimeout = setTimeout(() => setIsLoading(true), loaderDelay);
      const messageTimeout = setTimeout(() => {
        setIsLoading(false);
        setIsVisible(true);
        onVisibilityChange?.(message.id);
      }, totalDelay);

      return () => {
        clearTimeout(loaderTimeout);
        clearTimeout(messageTimeout);
      };
    } else {
      const messageTimeout = setTimeout(() => {
        setIsVisible(true);
        onVisibilityChange?.(message.id);
      }, 0);

      return () => clearTimeout(messageTimeout);
    }
  }, [message, previousMessageComplete, onVisibilityChange]);

  const handleContentReady = useCallback(() => {
    if (!messageCompleted) {
      setMessageCompleted(true);
      setTimeout(() => onMessageComplete?.(message.id), 350);
    }
  }, [messageCompleted, onMessageComplete, message.id]);

  const messageClass = useMemo(() =>
    isLeft ? "flex items-end gap-3" : "flex items-end gap-3 flex-row-reverse",
    [isLeft]
  );

  if (!isLoading && !isVisible) return null;

  return (
    <div className={messageClass}>
      <AnimatePresence mode="wait">
        {shouldShowAvatar ? (
          <motion.img
            key="avatar"
            src={person.avatar}
            alt={person.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-[1.5px] border-white"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          />
        ) : (
          <div className="w-8 h-8 flex-shrink-0" key="spacer" />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col"
        style={{ alignItems: isLeft ? 'flex-start' : 'flex-end' }}
      >
        {!isContinuation && (
          <motion.div
            className="text-xs mb-1 leading-relaxed"
            style={{ color: chatStyle.nameColor || '#582F0E' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.25 }}
          >
            {person.name}
          </motion.div>
        )}

        <MessageBubble
          message={message}
          isLeft={isLeft}
          uiConfig={uiConfig}
          onContentReady={handleContentReady}
          isLoading={isLoading}
          isVisible={isVisible}
        />
      </motion.div>
    </div>
  );
});

MessageWrapper.displayName = 'MessageWrapper';

// ============================================================================
// MAIN CHAT COMPONENT
// ============================================================================

const ChatInterface: React.FC<ChatComponentProps> = ({ config, uiConfig = {} }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [completedMessages, setCompletedMessages] = useState<number[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [key, setKey] = useState(0);

  const defaultUiConfig: Required<UiConfig> = {
    containerWidth: 400,
    containerHeight: 500,
    backgroundColor: '#ffffff',
    autoRestart: false,
    restartDelay: 3000,
    loader: { dotColor: '#9ca3af' },
    linkBubbles: {
      backgroundColor: '#f3f4f6',
      textColor: '#374151',
      iconColor: '#374151',
      borderColor: '#e5e7eb'
    },
    leftChat: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#d1d1d1',
      showBorder: true,
      nameColor: '#000000'
    },
    rightChat: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#d1d1d1',
      showBorder: true,
      nameColor: '#000000'
    }
  };

  const ui: Required<UiConfig> = { ...defaultUiConfig, ...uiConfig } as Required<UiConfig>;

  const handleMessageComplete = useCallback((messageId: number) => {
    setCompletedMessages(prev => {
      const newCompleted = [...prev, messageId];

      if (newCompleted.length === config.messages.length && ui.autoRestart) {
        setTimeout(() => {
          setCompletedMessages([]);
          setVisibleMessages([]);
          setKey(prevKey => prevKey + 1);
        }, ui.restartDelay);
      }

      return newCompleted;
    });
  }, [config.messages.length, ui.autoRestart, ui.restartDelay]);

  const handleVisibilityChange = useCallback((messageId: number) => {
    setVisibleMessages(prev =>
      prev.includes(messageId) ? prev : [...prev, messageId]
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest'
    });
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(scrollToBottom);

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }

    return () => observer.disconnect();
  }, [key, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [config.messages, completedMessages, scrollToBottom]);

  const gradientBackground = useMemo(() => {
    return `linear-gradient(to bottom, ${hexToRgba(ui.backgroundColor, 1)} 0%, ${hexToRgba(ui.backgroundColor, 0.95)} 20%, ${hexToRgba(ui.backgroundColor, 0.8)} 40%, ${hexToRgba(ui.backgroundColor, 0.4)} 70%, ${hexToRgba(ui.backgroundColor, 0)} 100%)`;
  }, [ui.backgroundColor]);

  return (
    <div
      key={key}
      className="mx-auto rounded-lg relative"
      style={{
        width: `${ui.containerWidth}px`,
        height: `${ui.containerHeight}px`,
        backgroundColor: ui.backgroundColor
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10 rounded-t-lg"
        style={{ background: gradientBackground }}
      />

      <div
        ref={containerRef}
        className="p-8 overflow-y-scroll h-full"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="min-h-full flex flex-col justify-end">
          {config.messages.map((message, index) => {
            const previousMessageComplete = index === 0 || completedMessages.includes(config.messages[index - 1].id);
            const previousMessage = index > 0 ? config.messages[index - 1] : null;
            const nextMessage = index < config.messages.length - 1 ? config.messages[index + 1] : null;
            const isNextVisible = nextMessage ? visibleMessages.includes(nextMessage.id) : false;
            const isContinuation = previousMessage?.sender === message.sender;

            const spacingClass = index === 0 ? "" : (isContinuation ? "mt-1.5" : "mt-8");

            return (
              <div key={message.id} className={spacingClass}>
                <MessageWrapper
                  message={message}
                  config={config}
                  uiConfig={ui}
                  previousMessageComplete={previousMessageComplete}
                  onMessageComplete={handleMessageComplete}
                  onVisibilityChange={handleVisibilityChange}
                  previousMessage={previousMessage}
                  nextMessage={nextMessage}
                  isNextVisible={isNextVisible}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
export { ChatInterface };
export type { ChatComponentProps, ChatConfig, UiConfig, Message, Person, ChatStyle, LinkBubbleStyle };
