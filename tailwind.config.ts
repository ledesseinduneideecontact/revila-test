import { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette REVIVE officielle
        background: '#EDE8D0',        // Crème élégante, fond général
        'page-background': '#d0d0d0', // Gris foncé pour fond de la page commander
        'text-primary': '#222222',    // Anthracite, texte principal avec forte lisibilité
        'text-secondary': '#555555',  // Gris moyen pour informations annexes
        'accent-primary': '#005B96',  // Bleu foncé pour boutons principaux et cohérence
        'accent-secondary': '#0DA4A4', // Bleu plus vif, call-to-action et éléments interactifs
        'border-light': '#DDDDDD',    // Gris clair, bordures et séparateurs
        'text-white': '#FFFFFF',      // Blanc pur pour texte sur boutons colorés
        'error': '#D32F2F',          // Rouge subtil pour messages d'erreur
        'success': '#388E3C',        // Vert discret pour confirmations

        // Palette sections spécifiques REVIVE
        'section-photos': '#F9963B',  // Orange doux pour section "Ajouter photos"
        'section-infos': '#2C6ECB',   // Bleu éclatant pour section "Infos client"  
        'section-recap': '#36B37E',   // Vert frais pour section "Récapitulatif"
        
        // Anciennes couleurs (compatibilité)
        cream: '#EDE8D0',
        orange: {
          DEFAULT: '#f97316',
          dark: '#ea580c',  
          light: '#fb923c',
        },
      },
      boxShadow: {
        'light': '0 2px 8px rgba(0,0,0,0.05)', // Ombre légère
      },
      borderRadius: {
        'soft': '4px',
        'medium': '8px',
      },
    },
  },
} satisfies Config