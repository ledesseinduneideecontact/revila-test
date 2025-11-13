// Script pour créer des fichiers vidéo et image de test
const fs = require('fs');
const path = require('path');

// Créer une vidéo de test (landscape) - 1920x1080
function createLandscapeVideo() {
  // Créer un canvas HTML5 simple pour générer une vidéo
  const Canvas = require('canvas');
  const { createCanvas } = Canvas;
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  // Dessiner un rectangle rouge avec du texte
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('VIDÉO PAYSAGE', 960, 540);

  // Sauvegarder comme image (pour simulation)
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'video-landscape-frame.png'), buffer);
}

// Créer une vidéo de test (portrait) - 1080x1920
function createPortraitVideo() {
  const Canvas = require('canvas');
  const { createCanvas } = Canvas;
  const canvas = createCanvas(1080, 1920);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#00FF00';
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(540, 960);
  ctx.fillText('VIDÉO PORTRAIT', 0, 0);
  ctx.restore();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'video-portrait-frame.png'), buffer);
}

// Créer une image de test (landscape) - 1920x1080
function createLandscapeImage() {
  const Canvas = require('canvas');
  const { createCanvas } = Canvas;
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0000FF';
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PHOTO PAYSAGE', 960, 540);

  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  fs.writeFileSync(path.join(__dirname, 'photo-landscape.jpg'), buffer);
}

// Créer une image de test (portrait) - 1080x1920
function createPortraitImage() {
  const Canvas = require('canvas');
  const { createCanvas } = Canvas;
  const canvas = createCanvas(1080, 1920);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FF00FF';
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(540, 960);
  ctx.fillText('PHOTO PORTRAIT', 0, 0);
  ctx.restore();

  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  fs.writeFileSync(path.join(__dirname, 'photo-portrait.jpg'), buffer);
}

try {
  console.log('Création des fichiers de test...');
  createLandscapeVideo();
  createPortraitVideo();
  createLandscapeImage();
  createPortraitImage();
  console.log('Fichiers de test créés avec succès!');
} catch (error) {
  console.error('Erreur:', error.message);
  console.log('Installation de canvas requise: npm install canvas');
}
