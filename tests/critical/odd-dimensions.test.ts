/**
 * Test spécifique pour le bug des dimensions impaires
 *
 * Bug original:
 * - Vidéo 2106x1780 → après scale → 1920x1623 (impair!)
 * - Erreur FFmpeg: "height not divisible by 2"
 *
 * Fix:
 * - Utilisation de `-2` dans le filtre scale
 * - Force les dimensions à être paires (divisibles par 2)
 */

import { optimizeVideo, getVideoMetadata } from '../lib/ffmpeg-processor'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

describe('FFmpeg Odd Dimensions Bug Fix', () => {
  const testVideoPath = path.join(__dirname, 'fixtures', 'odd-dimensions', 'video-odd-2106x1780.mp4')
  const outputDir = path.join(__dirname, '..', 'tmp', 'odd-dimensions-test')
  const outputPath = path.join(outputDir, 'optimized.mp4')

  beforeAll(async () => {
    // Créer le dossier de sortie
    await fs.mkdir(outputDir, { recursive: true })
  })

  afterAll(async () => {
    // Nettoyer
    if (existsSync(outputPath)) {
      await fs.unlink(outputPath)
    }
  })

  it('should have test video with odd dimensions', async () => {
    expect(existsSync(testVideoPath)).toBe(true)

    const metadata = await getVideoMetadata(testVideoPath)
    expect(metadata.width).toBe(2106)
    expect(metadata.height).toBe(1780)
  })

  it('should optimize video with odd dimensions without errors', async () => {
    // Cette fonction devrait réussir sans erreur FFmpeg
    await optimizeVideo(testVideoPath, outputPath)

    expect(existsSync(outputPath)).toBe(true)
  }, 30000) // Timeout de 30s pour l'optimisation

  it('should produce output with even dimensions', async () => {
    const metadata = await getVideoMetadata(outputPath)

    console.log('📐 Output dimensions:', metadata.width, 'x', metadata.height)

    // Les deux dimensions doivent être paires (divisibles par 2)
    expect(metadata.width % 2).toBe(0)
    expect(metadata.height % 2).toBe(0)
  })

  it('should scale correctly (max 1920px on longest dimension)', async () => {
    const metadata = await getVideoMetadata(outputPath)

    // La dimension la plus longue doit être <= 1920
    const maxDimension = Math.max(metadata.width, metadata.height)
    expect(maxDimension).toBeLessThanOrEqual(1920)

    // Pour 2106x1780 → devrait donner 1920x1622 (et non 1920x1623!)
    // Vérifions que le ratio est préservé approximativement
    const originalRatio = 2106 / 1780
    const outputRatio = metadata.width / metadata.height

    // Le ratio devrait être préservé à 0.5% près
    expect(Math.abs(originalRatio - outputRatio)).toBeLessThan(0.005)
  })

  it('should calculate expected dimensions correctly', () => {
    // Calcul attendu pour 2106x1780 avec max 1920:
    // - Largeur: min(1920, 2106) = 1920
    // - Hauteur: (1780 / 2106) * 1920 = 1622.79...
    // - Avec `-2`: arrondi à 1622 (pair le plus proche)

    const originalWidth = 2106
    const originalHeight = 1780
    const maxDimension = 1920

    const scaledWidth = Math.min(maxDimension, originalWidth)
    const scaledHeight = (originalHeight / originalWidth) * scaledWidth
    const evenHeight = Math.floor(scaledHeight / 2) * 2

    console.log('🧮 Calculated dimensions:', scaledWidth, 'x', evenHeight)

    expect(scaledWidth).toBe(1920)
    expect(evenHeight).toBe(1622)
    expect(evenHeight % 2).toBe(0)
  })
})
