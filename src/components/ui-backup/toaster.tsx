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
import {
  SuccessIcon,
  AISparkleIcon,
} from "@/components/ui/real-estate-icons"
import { AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Determine icon based on variant
        let icon = null
        if (variant === "success") {
          icon = <SuccessIcon animated={true} className="w-5 h-5 text-success flex-shrink-0" />
        } else if (variant === "ai") {
          icon = <AISparkleIcon className="w-5 h-5 text-primary flex-shrink-0" />
        } else if (variant === "destructive") {
          icon = <AlertCircle className="w-5 h-5 text-destructive-foreground flex-shrink-0" />
        }

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              {icon}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
