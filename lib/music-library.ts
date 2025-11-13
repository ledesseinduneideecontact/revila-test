/**
 * Bibliothèque de musiques prédéfinies pour les montages vidéo
 */

export interface MusicTrack {
  id: string
  name: string
  category: string
  filename: string
  description?: string
}

export const MUSIC_CATEGORIES = {
  ROMANTIQUE: 'Romantique',
  JOYEUSE: 'Joyeuse',
  ENERGIQUE: 'Énergique',
  ELECTRO: 'Électro',
  CLASSIQUE: 'Classique',
  CINEMATIQUE: 'Cinématique',
  LOUNGE: 'Lounge',
  GOSPEL: 'Gospel',
} as const

export const MUSIC_LIBRARY: MusicTrack[] = [
  // Romantique
  {
    id: 'romantique-doux-mariage',
    name: 'Doux Mariage',
    category: MUSIC_CATEGORIES.ROMANTIQUE,
    filename: 'romantique-doux-mariage.mp3',
    description: 'Mélodie douce pour cérémonies de mariage',
  },
  {
    id: 'romantique-ceremonial-mariage',
    name: 'Cérémonial Mariage',
    category: MUSIC_CATEGORIES.ROMANTIQUE,
    filename: 'romantique-ceremonial-mariage.mp3',
    description: 'Musique cérémonielle pour mariages',
  },
  {
    id: 'romantique-sentimental-souvenirs',
    name: 'Souvenirs Sentimentaux',
    category: MUSIC_CATEGORIES.ROMANTIQUE,
    filename: 'romantique-sentimental-souvenirs.mp3',
    description: 'Pour vos moments précieux',
  },
  {
    id: 'romantique-reveur-souvenirs',
    name: 'Souvenirs Rêveurs',
    category: MUSIC_CATEGORIES.ROMANTIQUE,
    filename: 'romantique-reveur-souvenirs.mp3',
    description: 'Ambiance rêveuse pour souvenirs',
  },
  {
    id: 'romantique-melancolique-reflexion',
    name: 'Réflexion Mélancolique',
    category: MUSIC_CATEGORIES.ROMANTIQUE,
    filename: 'romantique-melancolique-reflexion.mp3',
    description: 'Ton mélancolique et réfléchi',
  },
  {
    id: 'romantique-cinematique-souvenirs',
    name: 'Souvenirs Cinématiques',
    category: MUSIC_CATEGORIES.ROMANTIQUE,
    filename: 'romantique-cinematique-souvenirspersonnels.mp3',
    description: 'Style cinématique pour moments personnels',
  },

  // Joyeuse
  {
    id: 'joyeuse-pop-anniversaire',
    name: 'Pop Anniversaire',
    category: MUSIC_CATEGORIES.JOYEUSE,
    filename: 'joyeuse-pop-anniversaire.mp3',
    description: 'Ambiance festive pour anniversaires',
  },
  {
    id: 'joyeuse-roadtrip-voyage',
    name: 'Road Trip Voyage',
    category: MUSIC_CATEGORIES.JOYEUSE,
    filename: 'joyeuse-roadtrip-voyage.mp3',
    description: 'Parfaite pour vidéos de voyage',
  },
  {
    id: 'joyeuse-enfantin-cadeaux',
    name: 'Enfantin Festif',
    category: MUSIC_CATEGORIES.JOYEUSE,
    filename: 'joyeuse-enfantin-cadeauentreamis.mp3',
    description: 'Joie et cadeaux entre amis',
  },

  // Énergique
  {
    id: 'energique-sportif-highlights',
    name: 'Sportif Highlights',
    category: MUSIC_CATEGORIES.ENERGIQUE,
    filename: 'energique-sportif-highlights.mp3',
    description: 'Pour vos moments sportifs',
  },
  {
    id: 'energique-corporate-presentation',
    name: 'Corporate Présentation',
    category: MUSIC_CATEGORIES.ENERGIQUE,
    filename: 'energique-corporate-presentation.mp3',
    description: 'Professionnelle et dynamique',
  },

  // Électro
  {
    id: 'electro-house-soiree',
    name: 'House Soirée',
    category: MUSIC_CATEGORIES.ELECTRO,
    filename: 'electro-house-soiree.mp3',
    description: 'Ambiance électro pour soirées',
  },
  {
    id: 'electro-disco-festif',
    name: 'Disco Festif',
    category: MUSIC_CATEGORIES.ELECTRO,
    filename: 'electro-disco-festif.mp3',
    description: 'Rythme disco entraînant',
  },
  {
    id: 'electro-chill-digital',
    name: 'Chill Digital',
    category: MUSIC_CATEGORIES.ELECTRO,
    filename: 'electro-chill-digital.mp3',
    description: 'Électro chill et moderne',
  },

  // Classique
  {
    id: 'classique-doux-inspiration',
    name: 'Doux Inspiration',
    category: MUSIC_CATEGORIES.CLASSIQUE,
    filename: 'classique-doux-inspiration.mp3',
    description: 'Classique doux et inspirant',
  },
  {
    id: 'classique-solennel-ceremonie',
    name: 'Solennel Cérémonie',
    category: MUSIC_CATEGORIES.CLASSIQUE,
    filename: 'classique-solennel-ceremonie.mp3',
    description: 'Pour cérémonies officielles',
  },

  // Cinématique
  {
    id: 'cinematique-inspirant-documentaire',
    name: 'Inspirant Documentaire',
    category: MUSIC_CATEGORIES.CINEMATIQUE,
    filename: 'cinematique-inspirant-documentaire.mp3',
    description: 'Style documentaire inspirant',
  },

  // Lounge
  {
    id: 'lounge-chic-luxe',
    name: 'Chic Luxe',
    category: MUSIC_CATEGORIES.LOUNGE,
    filename: 'lounge-chic-contenuluxe.mp3',
    description: 'Ambiance lounge élégante',
  },

  // Gospel
  {
    id: 'gospel-enjoue-celebration',
    name: 'Enjoué Célébration',
    category: MUSIC_CATEGORIES.GOSPEL,
    filename: 'gospel-enjoue-celebration.mp3',
    description: 'Gospel joyeux pour célébrations',
  },
]

/**
 * Récupère les musiques par catégorie
 */
export function getMusicsByCategory(): Record<string, MusicTrack[]> {
  const grouped: Record<string, MusicTrack[]> = {}

  MUSIC_LIBRARY.forEach(track => {
    if (!grouped[track.category]) {
      grouped[track.category] = []
    }
    grouped[track.category].push(track)
  })

  return grouped
}

/**
 * Récupère une musique par son ID
 */
export function getMusicById(id: string): MusicTrack | undefined {
  return MUSIC_LIBRARY.find(track => track.id === id)
}

/**
 * Récupère le chemin public d'une musique
 */
export function getMusicPath(filename: string): string {
  return `/music/${filename}`
}
