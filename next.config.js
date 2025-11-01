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
}

module.exports = nextConfig