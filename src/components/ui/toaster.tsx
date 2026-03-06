"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  const destructiveToasts = toasts.filter((toast) => toast.variant === "destructive")
  const defaultToasts = toasts.filter((toast) => toast.variant !== "destructive")

  return (
    <>
      <ToastProvider>
        {destructiveToasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
        <ToastViewport className="top-4 left-1/2 w-auto max-w-none -translate-x-1/2 flex-col items-center p-0 sm:top-4 sm:right-auto sm:bottom-auto sm:left-1/2 sm:flex-col sm:-translate-x-1/2 md:max-w-none" />
      </ToastProvider>
      <ToastProvider>
        {defaultToasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
        <ToastViewport />
      </ToastProvider>
    </>
  )
}
