'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-sans',
          title: 'text-sm font-semibold',
          description: 'text-sm',
          error: 'bg-red-50 border-red-200 text-red-900',
          success: 'bg-green-50 border-green-200 text-green-900',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
          info: 'bg-blue-50 border-blue-200 text-blue-900',
        },
      }}
    />
  )
}