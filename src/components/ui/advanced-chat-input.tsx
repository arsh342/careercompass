// components/ui/advanced-chat-input.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import { Send, X } from "lucide-react";

// Interface for individual file props
interface FileAttachment {
  id: string | number;
  name: string;
  icon: React.ReactNode;
}

// Main component props interface
interface AdvancedChatInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  textareaProps?: TextareaProps;
  sendButtonProps?: ButtonProps;
  files?: FileAttachment[];
  onFileRemove?: (id: string | number) => void;
  onSend?: () => void;
  actionIcons?: React.ReactNode[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  isSending?: boolean;
}

const AdvancedChatInput = React.forwardRef<HTMLDivElement, AdvancedChatInputProps>(
  (
    {
      className,
      textareaProps,
      sendButtonProps,
      files = [],
      onFileRemove,
      onSend,
      actionIcons = [],
      value,
      onChange,
      placeholder,
      disabled,
      isSending,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const hasValue = !!value || !!textareaProps?.value;
    const hasFiles = files.length > 0;

    // Auto-resize textarea height and track if expanded
    React.useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const scrollHeight = textareaRef.current.scrollHeight;
        const newHeight = Math.min(scrollHeight, 120);
        textareaRef.current.style.height = `${newHeight}px`;
        // Consider expanded if height > single line (36px) or has files
        setIsExpanded(newHeight > 40 || hasFiles);
      }
    }, [value, textareaProps?.value, hasFiles]);

    // Determine border radius based on expansion state
    const borderRadius = isExpanded ? "rounded-3xl" : "rounded-3xl";

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col border border-border bg-card p-1 text-card-foreground shadow-sm transition-all duration-200",
          borderRadius,
          "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
          className
        )}
        {...props}
      >
        {/* Attached Files Section */}
        <AnimatePresence>
          {hasFiles && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex flex-wrap gap-2"
            >
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 rounded-full border bg-muted/50 px-2.5 py-1.5 text-sm"
                >
                  {file.icon}
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted transition-colors"
                    onClick={() => onFileRemove?.(file.id)}
                    aria-label={`Remove file ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single Row Input Area */}
        <div className={cn("flex gap-1", isExpanded ? "items-end" : "items-center")}>
          {/* Action Icons on the left */}
          <div className="flex items-center gap-0.5 shrink-0">
            {actionIcons.map((icon, index) => (
              <React.Fragment key={index}>{icon}</React.Fragment>
            ))}
          </div>

          {/* Text Input */}
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              {...textareaProps}
              className={cn(
                "min-h-[36px] max-h-[120px] w-full resize-none border-none bg-transparent px-2 py-1.5 shadow-none",
                "placeholder:text-muted-foreground/60",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-sm leading-relaxed",
                textareaProps?.className
              )}
            />
          </div>

          {/* Send Button */}
          <motion.div
            initial={false}
            animate={{
              scale: hasValue || hasFiles ? 1 : 0.9,
              opacity: hasValue || hasFiles ? 1 : 0.5,
            }}
            transition={{ duration: 0.15 }}
            className="shrink-0"
          >
            <Button
              size="icon"
              disabled={(!hasValue && !hasFiles) || disabled || isSending}
              onClick={onSend}
              {...sendButtonProps}
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                hasValue || hasFiles 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-muted text-muted-foreground",
                sendButtonProps?.className
              )}
            >
              {isSending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }
);

AdvancedChatInput.displayName = "AdvancedChatInput";

export { AdvancedChatInput, type FileAttachment, type AdvancedChatInputProps };
