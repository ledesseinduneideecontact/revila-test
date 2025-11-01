'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import CommanderWizardNew from './CommanderWizardNew'

function CommanderContent() {
  const searchParams = useSearchParams()
  const isWeddingPlanSource = searchParams.get('source') === 'weddingplan.fr'
  
  return <CommanderWizardNew isWeddingPlanSource={isWeddingPlanSource} />
}

export default function Commander() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CommanderContent />
    </Suspense>
  )
}