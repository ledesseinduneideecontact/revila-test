/**
 * Test final simplifié - Affiche les logs serveur
 */

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')
const { spawn } = require('child_process')

const BASE_URL = 'http://localhost:3004'
const VIDEO_PATH = path.join(__dirname, 'tmp', 'test-video.mp4')
const AUDIO_PATH = path.join(__dirname, 'tmp', 'test-audio.mp3')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  try {
    log(colors.bright, '\n' + '='.repeat(70))
    log(colors.bright, '🎵 TEST FINAL - MUSIQUE PERSONNALISÉE')
    log(colors.bright, '='.repeat(70))

    // Upload
    log(colors.cyan, '\n📤 Upload vidéo + musique personnalisée')

    const formData = new FormData()
    formData.append('media', fs.createReadStream(VIDEO_PATH), {
      filename: 'test-video.mp4',
      contentType: 'video/mp4'
    })
    formData.append('music', fs.createReadStream(AUDIO_PATH), {
      filename: 'test-audio.mp3',
      contentType: 'audio/mpeg'
    })

    const uploadResponse = await fetch(`${BASE_URL}/api/montage/upload-multiple`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      log(colors.red, '❌ Erreur upload:', error)
      process.exit(1)
    }

    const uploadData = await uploadResponse.json()
    log(colors.green, '✅ Upload réussi!')
    log(colors.magenta, '   🎵 Musique:', uploadData.musicPath ? 'UPLOADÉE' : 'MANQUANTE')

    if (!uploadData.musicPath) {
      log(colors.red, '❌ ÉCHEC: Pas de musique uploadée')
      process.exit(1)
    }

    // Créer montage
    log(colors.cyan, '\n🎬 Création du montage avec musique personnalisée')

    const createResponse = await fetch(`${BASE_URL}/api/montage/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaPaths: uploadData.media.map(m => ({
          path: m.path,
          type: m.type
        })),
        musicTrackId: null,
        musicPath: uploadData.musicPath,
        format: 'landscape'
      })
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      log(colors.red, '❌ Erreur création:', error)
      process.exit(1)
    }

    const createData = await createResponse.json()
    log(colors.green, '✅ Montage créé!')
    log(colors.blue, '   Job ID:', createData.jobId)

    // Attendre un peu et vérifier le dossier outputs
    log(colors.cyan, '\n⏱️  Attente de la création du montage (30 secondes)...')

    for (let i = 1; i <= 30; i++) {
      await sleep(1000)
      process.stdout.write(colors.blue + `\r   ${i}/30s...` + colors.reset)
    }
    console.log()

    // Vérifier si le fichier a été créé
    const outputFile = path.join(__dirname, 'outputs', `montage_${createData.jobId}.mp4`)
    const exists = fs.existsSync(outputFile)

    log(colors.bright, '\n' + '='.repeat(70))
    log(colors.bright, '📊 RÉSULTAT FINAL')
    log(colors.bright, '='.repeat(70))

    if (exists) {
      const stats = fs.statSync(outputFile)
      log(colors.green, '✅ SUCCÈS: Montage créé avec musique personnalisée!')
      log(colors.blue, '📹 Fichier:', outputFile)
      log(colors.blue, '📦 Taille:', (stats.size / 1024 / 1024).toFixed(2), 'MB')
      log(colors.blue, '📅 Date:', stats.mtime.toLocaleString())
    } else {
      log(colors.red, '❌ ÉCHEC: Fichier de sortie non trouvé')
      log(colors.yellow, '   Cherché:', outputFile)

      // Lister les fichiers récents
      log(colors.yellow, '\n📂 Fichiers récents dans outputs:')
      const outputsDir = path.join(__dirname, 'outputs')
      if (fs.existsSync(outputsDir)) {
        const files = fs.readdirSync(outputsDir)
          .map(f => ({
            name: f,
            time: fs.statSync(path.join(outputsDir, f)).mtime
          }))
          .sort((a, b) => b.time - a.time)
          .slice(0, 5)

        files.forEach(f => {
          log(colors.yellow, `   - ${f.name} (${f.time.toLocaleString()})`)
        })
      }
    }

    log(colors.bright, '='.repeat(70))

    // INSTRUCTIONS POUR VÉRIFIER LES LOGS SERVEUR
    log(colors.cyan, '\n📋 VÉRIFICATIONS À FAIRE:')
    log(colors.yellow, '1. Vérifiez les logs du serveur Next.js')
    log(colors.yellow, '2. Cherchez le message "🎵 Processing custom music file"')
    log(colors.yellow, '3. Vérifiez qu\'il n\'y a pas d\'erreur "pb connexion au serveur"')
    log(colors.yellow, '4. Le message devrait aussi indiquer que la musique est ajustée à la durée de la vidéo')

    process.exit(exists ? 0 : 1)

  } catch (error) {
    log(colors.red, '\n❌ ERREUR:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
