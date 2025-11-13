'use client'

import { useRef, useState } from 'react'
import { Play } from 'lucide-react'

interface MockupPreviewProps {
  photoPreview: string
  videoPreview?: string
  videoOrientation?: 'portrait' | 'landscape'
  photoOrientation?: 'portrait' | 'landscape'
  className?: string
  showPlayButton?: boolean
  autoPlay?: boolean
}

export default function MockupPreview({
  photoPreview,
  videoPreview,
  videoOrientation,
  photoOrientation,
  className = '',
  showPlayButton = true,
  autoPlay = false
}: MockupPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(autoPlay)

  // Déterminer le mockup à utiliser selon les orientations
  const getMockupImage = () => {
    if (!videoOrientation || !photoOrientation) {
      return '/frontend-pictures/commander/phone-portrait-card-portrait.png'
    }

    if (videoOrientation === 'portrait' && photoOrientation === 'portrait') {
      return '/frontend-pictures/commander/phone-portrait-card-portrait.png'
    } else if (videoOrientation === 'portrait' && photoOrientation === 'landscape') {
      return '/frontend-pictures/commander/phone-portrait-card-landscape.png'
    } else if (videoOrientation === 'landscape' && photoOrientation === 'portrait') {
      return '/frontend-pictures/commander/phone-landscape-card-portrait.png'
    } else {
      return '/frontend-pictures/commander/phone-landscape-card-landscape.png'
    }
  }

  // Calculer les positions de la zone carte photo en pourcentages
  const getCardZoneStyle = () => {
    let CARD_ZONE_PX = { x: 677, y: 188, width: 750, height: 1124 } // Default: portrait + portrait

    if (videoOrientation && photoOrientation) {
      if (videoOrientation === 'portrait' && photoOrientation === 'portrait') {
        CARD_ZONE_PX = { x: 677, y: 188, width: 750, height: 1124 }
      } else if (videoOrientation === 'portrait' && photoOrientation === 'landscape') {
        CARD_ZONE_PX = { x: 533, y: 441, width: 928, height: 618 }
      } else if (videoOrientation === 'landscape' && photoOrientation === 'portrait') {
        CARD_ZONE_PX = { x: 451, y: 544, width: 598, height: 897 }
      } else {
        CARD_ZONE_PX = { x: 188, y: 677, width: 1124, height: 750 }
      }
    }

    const left = (CARD_ZONE_PX.x / 1500) * 100
    const top = (CARD_ZONE_PX.y / 1500) * 100
    const width = (CARD_ZONE_PX.width / 1500) * 100
    const height = (CARD_ZONE_PX.height / 1500) * 100

    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`
    }
  }

  // Calculer le style pour la zone téléphone
  const getPhoneZoneStyle = () => {
    let PHONE_ZONE_PX = { x: 113, y: 232, width: 477, height: 1037 } // Default: portrait + portrait

    if (videoOrientation && photoOrientation) {
      if (videoOrientation === 'portrait' && photoOrientation === 'portrait') {
        PHONE_ZONE_PX = { x: 113, y: 232, width: 477, height: 1037 }
      } else if (videoOrientation === 'portrait' && photoOrientation === 'landscape') {
        PHONE_ZONE_PX = { x: 72, y: 323, width: 394, height: 855 }
      } else if (videoOrientation === 'landscape' && photoOrientation === 'portrait') {
        PHONE_ZONE_PX = { x: 336, y: 90, width: 827, height: 381 }
      } else {
        PHONE_ZONE_PX = { x: 231, y: 113, width: 1037, height: 477 }
      }
    }

    const left = (PHONE_ZONE_PX.x / 1500) * 100
    const top = (PHONE_ZONE_PX.y / 1500) * 100
    const width = (PHONE_ZONE_PX.width / 1500) * 100
    const height = (PHONE_ZONE_PX.height / 1500) * 100

    // Border radius adapté selon orientation (10% pour portrait, 4% pour landscape)
    const isPhonePortrait = PHONE_ZONE_PX.width < PHONE_ZONE_PX.height
    const borderRadius = isPhonePortrait
      ? 'clamp(15px, 1.9vw, 19px)' // Portrait: plus arrondi
      : 'clamp(12px, 1.5vw, 16px)' // Landscape: moins arrondi

    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
      borderRadius
    }
  }

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('Erreur lors de la lecture de la vidéo:', error)
      })
      setIsVideoPlaying(true)
    }
  }

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      {/* Mockup image de fond */}
      <img
        src={getMockupImage()}
        alt="Mockup téléphone et carte photo"
        className="w-full h-auto"
      />

      {/* Photo dans la zone carte avec bords arrondis */}
      <div
        className="absolute overflow-hidden pointer-events-none"
        style={{
          ...getCardZoneStyle(),
          borderRadius: 'clamp(12px, 1.5vw, 16px)' // 4% de la largeur comme le canvas
        }}
      >
        <img
          src={photoPreview}
          alt="Votre photo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Vidéo dans la zone téléphone (si présente) */}
      {videoPreview && (
        <>
          <div
            className="absolute overflow-hidden"
            style={getPhoneZoneStyle()}
          >
            <video
              ref={videoRef}
              src={videoPreview}
              className="w-full h-full object-cover"
              loop
              playsInline
              controls={isVideoPlaying}
              onEnded={() => setIsVideoPlaying(false)}
              onPause={() => setIsVideoPlaying(false)}
              onPlay={() => setIsVideoPlaying(true)}
            />
          </div>

          {/* Bouton play centré sur la zone téléphone */}
          {showPlayButton && !isVideoPlaying && (
            <button
              onClick={handlePlayVideo}
              className="absolute flex items-center justify-center"
              style={getPhoneZoneStyle()}
            >
              <div className="bg-white/90 rounded-full p-4 hover:scale-110 transition-transform shadow-xl">
                <Play className="w-8 h-8 text-purple-600" fill="currentColor" />
              </div>
            </button>
          )}
        </>
      )}
    </div>
  )
}
