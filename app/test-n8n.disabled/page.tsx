'use client'

import { useState } from 'react'

interface TestResult {
  success: boolean
  status: number
  response: string
  duration: number
  timestamp: string
}

export default function TestN8NPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [orderNumber, setOrderNumber] = useState('REV-TEST-' + Date.now())
  const [webhookUrl, setWebhookUrl] = useState('https://primary-production-be41.up.railway.app/webhook/4b18ffa4-6a37-4694-b45f-7fec78b22092')

  const testWebhook = async (url: string, payload: any) => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/test-n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl: url,
          payload: payload
        })
      })

      const responseText = await response.text()
      const duration = Date.now() - startTime

      const result: TestResult = {
        success: response.ok,
        status: response.status,
        response: responseText,
        duration,
        timestamp: new Date().toISOString()
      }

      setResults(prev => [result, ...prev])
    } catch (error) {
      const duration = Date.now() - startTime
      const result: TestResult = {
        success: false,
        status: 0,
        response: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString()
      }
      setResults(prev => [result, ...prev])
    } finally {
      setIsLoading(false)
    }
  }

  const testProductionWebhook = () => {
    const payload = {
      order_number: orderNumber,
      timestamp: new Date().toISOString(),
      source: 'revive-app-test',
      environment: 'development'
    }
    testWebhook(webhookUrl, payload)
  }

  const testCustomWebhook = () => {
    const payload = {
      order_number: orderNumber,
      timestamp: new Date().toISOString(),
      source: 'revive-app-test',
      environment: 'development',
      test: true
    }
    testWebhook(webhookUrl, payload)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Test N8N Webhook</h1>
        <p className="text-gray-600">
          Page de diagnostic pour tester les webhooks N8N et identifier les problèmes de communication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Configuration */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">⚙️ Configuration</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium mb-2">
                Numéro de commande
              </label>
              <input
                id="orderNumber"
                type="text"
                value={orderNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrderNumber(e.target.value)}
                placeholder="REV-TEST-123456"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium mb-2">
                URL Webhook N8N
              </label>
              <input
                id="webhookUrl"
                type="text"
                value={webhookUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Actions</h2>
          <div className="space-y-4">
            <button 
              onClick={testProductionWebhook} 
              disabled={isLoading}
              className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? '⏳ Test en cours...' : '🧪 Test Webhook Production'}
            </button>
            
            <button 
              onClick={testCustomWebhook} 
              disabled={isLoading}
              className="w-full bg-gray-500 text-white p-3 rounded-md hover:bg-gray-600 disabled:opacity-50"
            >
              {isLoading ? '⏳ Test en cours...' : '🔧 Test Webhook Custom'}
            </button>

            <button 
              onClick={clearResults} 
              className="w-full bg-red-500 text-white p-3 rounded-md hover:bg-red-600"
            >
              🗑️ Effacer les résultats
            </button>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Résultats des tests</h2>
        <p className="text-gray-600 mb-4">Historique des tests effectués ({results.length} tests)</p>
        
        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun test effectué. Cliquez sur un bouton de test pour commencer.
          </p>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {result.success ? "✅ Succès" : "❌ Échec"}
                    </span>
                    <span className="text-sm text-gray-500">
                      Status: {result.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Durée: {result.duration}ms
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded p-3">
                  <h4 className="font-semibold mb-2">Réponse du serveur:</h4>
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                    {result.response}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="border rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">ℹ️ Informations</h2>
        <div className="space-y-2 text-sm">
          <p><strong>URL de test:</strong> {webhookUrl}</p>
          <p><strong>Payload envoyé:</strong></p>
          <pre className="bg-gray-50 p-2 rounded text-xs">
{JSON.stringify({
  order_number: orderNumber,
  timestamp: new Date().toISOString(),
  source: 'revive-app-test',
  environment: 'development'
}, null, 2)}
          </pre>
          <p className="text-gray-600 mt-4">
            <strong>Note:</strong> Cette page utilise l'API de test N8N pour éviter les timeouts 
            et fournir des diagnostics détaillés.
          </p>
        </div>
      </div>
    </div>
  )
} 