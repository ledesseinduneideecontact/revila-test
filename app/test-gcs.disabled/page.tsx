'use client'

import { useState } from 'react'

export default function TestGCS() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleUpload = async () => {
    if (!file) {
      alert('Sélectionnez un fichier d\'abord')
      return
    }

    setUploading(true)
    setError('')
    setResult('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/test-gcs', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ Succès ! URL: ${data.url}`)
      } else {
        setError(`❌ Erreur: ${data.error}`)
      }
    } catch (err) {
      setError(`❌ Erreur: ${err}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Test Upload GCS</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Fichier à uploader (dans le dossier test/)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                📁 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? '⏳ Upload en cours...' : '🚀 Tester Upload GCS'}
          </button>

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <pre className="text-sm text-green-800 whitespace-pre-wrap break-all">
                {result}
              </pre>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <pre className="text-sm text-red-800 whitespace-pre-wrap break-all">
                {error}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">📝 Info</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Bucket: revila</li>
              <li>• Dossier: test/</li>
              <li>• URL finale: https://storage.googleapis.com/revila/test/[filename]</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}