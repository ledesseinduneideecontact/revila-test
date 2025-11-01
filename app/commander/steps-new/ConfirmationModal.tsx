'use client'

import { Button } from '@/components/ui/button'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'default' | 'destructive'
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmVariant = 'default'
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              <span className="truncate">{cancelText}</span>
            </Button>
            <Button 
              variant={confirmVariant}
              onClick={onConfirm}
              className={`w-full sm:w-auto ${confirmVariant === 'destructive' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              <span className="truncate">{confirmText}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}