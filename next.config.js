/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Désactiver la génération statique des pages d'erreur
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Configuration pour accepter des fichiers jusqu'à 200MB
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  // Externaliser les binaires FFmpeg pour éviter qu'ils soient bundlés
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'ffmpeg-static': 'commonjs ffmpeg-static',
        'ffprobe-static': 'commonjs ffprobe-static',
      })
    }
    return config
  },
}

module.exports = nextConfig