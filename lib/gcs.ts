import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import path from 'path'

// Configuration flexible : fichier local ou variable d'environnement
let storageConfig: any = {
  projectId: process.env.GCS_PROJECT_ID || 'revila-467910',
}

// Priorité 1 : Fichier local key-revila.json (dev)
const keyFilePath = path.join(process.cwd(), 'key-revila.json')
if (fs.existsSync(keyFilePath)) {
  console.log('🔑 Using local GCS key file: key-revila.json')
  storageConfig.keyFilename = keyFilePath
} 
// Priorité 2 : Variable d'environnement (production Railway)
else if (process.env.GCS_CREDENTIALS) {
  console.log('🔑 Using GCS credentials from environment')
  storageConfig.credentials = JSON.parse(process.env.GCS_CREDENTIALS)
} 
// Priorité 3 : Default credentials (si configuré avec gcloud)
else {
  console.log('⚠️ No GCS credentials found, trying default credentials')
}

const storage = new Storage(storageConfig)

const bucketName = process.env.GCS_BUCKET_NAME || 'revila'
const bucket = storage.bucket(bucketName)

/**
 * Upload un fichier vers Google Cloud Storage
 */
export async function uploadToGCS(
  file: Buffer | Uint8Array,
  path: string,
  contentType: string
): Promise<string> {
  const blob = bucket.file(path)
  
  try {
    await blob.save(file, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // Cache 1 an
      },
      // public: true, // DÉSACTIVÉ - Le bucket a Uniform Access
    })
    
    // Retourner l'URL publique
    return `https://storage.googleapis.com/${bucketName}/${path}`
  } catch (error) {
    console.error('Erreur upload GCS:', error)
    throw new Error(`Erreur upload vers GCS: ${error}`)
  }
}

/**
 * Supprimer un fichier de GCS
 */
export async function deleteFromGCS(path: string): Promise<void> {
  try {
    await bucket.file(path).delete()
  } catch (error) {
    console.error('Erreur suppression GCS:', error)
    // Ne pas throw si le fichier n'existe pas
  }
}

/**
 * Vérifier si le bucket est accessible
 */
export async function testGCSConnection(): Promise<boolean> {
  try {
    const [exists] = await bucket.exists()
    console.log(`✅ Bucket GCS '${bucketName}' accessible:`, exists)
    return exists
  } catch (error) {
    console.error('❌ Erreur connexion GCS:', error)
    return false
  }
}