/**
 * Test manuel du flux d'upload avec musique personnalisée
 * Execute avec: node test-music-manual.js
 */

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3004'
const VIDEO_PATH = path.join(__dirname, 'tmp', 'test-video.mp4')
const AUDIO_PATH = path.join(__dirname, 'tmp', 'test-audio.mp3')

// Couleurs pour les logs
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

function createTestAudioFile() {
  const tmpDir = path.join(__dirname, 'tmp')

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  // Créer un fichier MP3 minimal
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x6E, 0x66, 0x6F, // "Info" tag
  ])

  const frames = Buffer.concat(Array(200).fill(mp3Header))
  fs.writeFileSync(AUDIO_PATH, frames)

  log(colors.green, '✅ Fichier audio de test créé:', AUDIO_PATH)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const results = {
    startTime: Date.now(),
    steps: [],
    logs: [],
    success: false
  }

  try {
    log(colors.bright, '\n' + '='.repeat(70))
    log(colors.bright, '🎵 TEST FLUX UPLOAD MUSIQUE PERSONNALISÉE')
    log(colors.bright, '='.repeat(70))

    // Vérifications préliminaires
    log(colors.cyan, '\n📋 VÉRIFICATIONS PRÉLIMINAIRES')

    if (!fs.existsSync(VIDEO_PATH)) {
      log(colors.red, '❌ Fichier vidéo non trouvé:', VIDEO_PATH)
      log(colors.yellow, '💡 Créez une vidéo de test avec:')
      log(colors.yellow, '   ffmpeg -f lavfi -i color=c=black:s=1920x1080:d=3 -c:v libx264 -t 3 -pix_fmt yuv420p tmp/test-video.mp4 -y')
      process.exit(1)
    }
    log(colors.green, '✅ Vidéo trouvée:', VIDEO_PATH, `(${(fs.statSync(VIDEO_PATH).size / 1024).toFixed(2)} KB)`)

    if (!fs.existsSync(AUDIO_PATH)) {
      log(colors.yellow, '⚠️  Fichier audio non trouvé, création en cours...')
      createTestAudioFile()
    } else {
      log(colors.green, '✅ Audio trouvé:', AUDIO_PATH, `(${(fs.statSync(AUDIO_PATH).size / 1024).toFixed(2)} KB)`)
    }

    // ÉTAPE 1: Upload des fichiers
    log(colors.cyan, '\n📤 ÉTAPE 1: Upload vidéo + musique')

    const formData = new FormData()
    formData.append('media', fs.createReadStream(VIDEO_PATH), {
      filename: 'test-video.mp4',
      contentType: 'video/mp4'
    })
    formData.append('music', fs.createReadStream(AUDIO_PATH), {
      filename: 'test-audio.mp3',
      contentType: 'audio/mpeg'
    })

    log(colors.blue, '⏳ Upload en cours...')
    const uploadResponse = await fetch(`${BASE_URL}/api/montage/upload-multiple`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      log(colors.red, '❌ Erreur upload:', uploadResponse.status, error)
      throw new Error(`Upload failed: ${uploadResponse.status}`)
    }

    const uploadData = await uploadResponse.json()
    log(colors.green, '✅ Upload réussi!')
    log(colors.blue, '   Médias uploadés:', uploadData.media.length)
    log(colors.magenta, '   🎵 Musique uploadée:', uploadData.musicPath || 'Non fournie')

    results.steps.push({
      step: 1,
      status: 'ok',
      message: 'Upload réussi',
      data: uploadData
    })

    // Vérifier que la musique a bien été uploadée
    if (!uploadData.musicPath) {
      log(colors.red, '❌ ERREUR: Aucun chemin de musique retourné!')
      throw new Error('Music path missing in upload response')
    }

    // ÉTAPE 2: Créer le montage
    log(colors.cyan, '\n🎬 ÉTAPE 2: Création du montage avec musique personnalisée')

    const createPayload = {
      mediaPaths: uploadData.media.map(m => ({
        path: m.path,
        type: m.type,
        duration: m.type === 'image' ? 2 : undefined
      })),
      musicTrackId: null, // Pas de musique prédéfinie
      musicPath: uploadData.musicPath, // Musique personnalisée
      format: 'landscape'
    }

    log(colors.blue, '⏳ Création du montage...')
    log(colors.blue, '   Format:', createPayload.format)
    log(colors.blue, '   Médias:', createPayload.mediaPaths.length)
    log(colors.magenta, '   🎵 Musique:', createPayload.musicPath)

    const createResponse = await fetch(`${BASE_URL}/api/montage/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload)
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      log(colors.red, '❌ Erreur création:', createResponse.status, error)
      throw new Error(`Create failed: ${createResponse.status}`)
    }

    const createData = await createResponse.json()
    log(colors.green, '✅ Montage créé!')
    log(colors.blue, '   Job ID:', createData.jobId)
    log(colors.blue, '   Progress URL:', createData.progressUrl)

    results.steps.push({
      step: 2,
      status: 'ok',
      message: 'Montage créé',
      data: createData
    })

    const jobId = createData.jobId

    // ÉTAPE 3: Surveiller le processus
    log(colors.cyan, '\n⏱️  ÉTAPE 3: Surveillance du processus')

    let musicProcessingFound = false
    let completed = false
    let failed = false
    const maxAttempts = 120 // 4 minutes max
    let attempt = 0

    while (attempt < maxAttempts && !completed && !failed) {
      await sleep(2000)
      attempt++

      const statusResponse = await fetch(`${BASE_URL}/api/montage/status/${jobId}`)

      if (!statusResponse.ok) {
        log(colors.yellow, `⚠️  [${attempt}/${maxAttempts}] Impossible de récupérer le statut`)
        continue
      }

      const status = await statusResponse.json()

      // Logger le statut
      const progressBar = '█'.repeat(Math.floor(status.progress / 5)) + '░'.repeat(20 - Math.floor(status.progress / 5))
      log(
        colors.blue,
        `   [${attempt}/${maxAttempts}] [${progressBar}] ${status.progress}% - ${status.message || status.status}`
      )

      results.logs.push({
        time: Date.now(),
        text: `[${status.status}] ${status.message} (${status.progress}%)`
      })

      // Détecter le traitement de la musique
      if (status.message && (
        status.message.toLowerCase().includes('music') ||
        status.message.includes('🎵') ||
        status.message.toLowerCase().includes('audio')
      )) {
        if (!musicProcessingFound) {
          log(colors.magenta, '   🎵 DÉTECTION: Traitement de la musique!')
          musicProcessingFound = true
        }
      }

      if (status.status === 'completed') {
        completed = true
        log(colors.green, '\n✅ MONTAGE TERMINÉ!')
        log(colors.blue, '   📹 URL:', status.videoUrl)
      }

      if (status.status === 'failed') {
        failed = true
        log(colors.red, '\n❌ ÉCHEC DU MONTAGE')
        log(colors.red, '   Erreur:', status.error || status.message)
      }
    }

    if (!completed && !failed) {
      log(colors.red, '\n⏱️  TIMEOUT: Le montage n\'a pas terminé dans les délais')
    }

    results.steps.push({
      step: 3,
      status: completed ? 'ok' : failed ? 'failed' : 'timeout',
      message: completed ? 'Terminé' : failed ? 'Échec' : 'Timeout',
      musicProcessingFound,
      attempts: attempt
    })

    // RÉSULTATS FINAUX
    results.endTime = Date.now()
    results.totalTime = results.endTime - results.startTime
    results.success = completed && !failed

    log(colors.bright, '\n' + '='.repeat(70))
    log(colors.bright, '📊 RÉSULTATS DU TEST')
    log(colors.bright, '='.repeat(70))

    const statusIcon = results.success ? '✅' : '❌'
    const statusText = results.success ? 'SUCCÈS' : 'ÉCHEC'
    log(results.success ? colors.green : colors.red, `${statusIcon} Statut: ${statusText}`)
    log(colors.blue, `⏱️  Temps total: ${(results.totalTime / 1000).toFixed(2)}s`)
    log(musicProcessingFound ? colors.green : colors.red, `🎵 Musique traitée: ${musicProcessingFound ? 'OUI' : 'NON'}`)
    log(completed ? colors.green : colors.red, `🎬 Montage terminé: ${completed ? 'OUI' : 'NON'}`)

    log(colors.cyan, '\n📝 LOGS CONCERNANT LA MUSIQUE:')
    const musicLogs = results.logs.filter(log =>
      log.text.toLowerCase().includes('music') ||
      log.text.includes('🎵') ||
      log.text.toLowerCase().includes('audio')
    )

    if (musicLogs.length > 0) {
      musicLogs.forEach(log => {
        const time = new Date(log.time).toLocaleTimeString()
        console.log(colors.magenta + `   ${time} - ${log.text}` + colors.reset)
      })
    } else {
      log(colors.yellow, '   Aucun log spécifique à la musique trouvé')
    }

    log(colors.bright, '='.repeat(70))

    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, 'test-music-manual-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
    log(colors.blue, `\n💾 Rapport sauvegardé: ${reportPath}`)

    process.exit(results.success ? 0 : 1)

  } catch (error) {
    log(colors.red, '\n❌ ERREUR FATALE:', error.message)
    console.error(error)
    results.success = false
    process.exit(1)
  }
}

// Lancer le test
main().catch(console.error)
