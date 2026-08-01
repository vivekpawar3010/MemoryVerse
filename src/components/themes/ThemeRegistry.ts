export interface ThemeMetadata {
  id: string;
  name: string;
  environment: string;
  style: string;
  performance: 'Low' | 'Medium' | 'High';
  description: string;
  primaryColor: string;
  previewBg: string;
}

export const THEME_REGISTRY: ThemeMetadata[] = [
  {
    id: 'CinematicSpace',
    name: 'Cinematic Space',
    environment: 'Deep space, nebula, stars',
    style: 'Twinkling stars, floating particles',
    performance: 'High',
    description: 'A breathtaking journey through deep space with twinkling stars and glowing elements.',
    primaryColor: '#6366f1',
    previewBg: '#050816',
  },
  {
    id: 'CyberFuture',
    name: 'Neon Cyber Future',
    environment: 'Neon city, digital rain',
    style: 'Glitch transitions, neon bloom',
    performance: 'High',
    description: 'High energy futuristic city with neon lights, holograms, and digital matrix aesthetics.',
    primaryColor: '#8b5cf6',
    previewBg: '#0a0015',
  },
  {
    id: 'DreamClouds',
    name: 'Dream Clouds',
    environment: 'Pastel sky, soft clouds',
    style: 'Drifting clouds, soft light rays',
    performance: 'Medium',
    description: 'A dreamy, pastel-toned sky with softly drifting clouds and warm light.',
    primaryColor: '#f9a8d4',
    previewBg: '#e0f2fe',
  },
  {
    id: 'FloatingMuseum',
    name: 'Floating Museum',
    environment: 'Elegant gallery, marble floors',
    style: 'Smooth pans, elegant reveals',
    performance: 'Medium',
    description: 'A timeless gallery experience with elegant frames and smooth cinematic movements.',
    primaryColor: '#d4af37',
    previewBg: '#1a1410',
  },
  {
    id: 'GoldenHour',
    name: 'Golden Hour',
    environment: 'Warm sunset, golden light',
    style: 'Lens flare, warm bokeh',
    performance: 'Medium',
    description: 'Bathed in warm golden light with soft bokeh and cinematic sunset atmosphere.',
    primaryColor: '#f59e0b',
    previewBg: '#1c0a00',
  },
  {
    id: 'OceanMemories',
    name: 'Ocean Memories',
    environment: 'Deep ocean, bioluminescent waves',
    style: 'Gentle waves, shimmer particles',
    performance: 'Medium',
    description: 'Dive into a deep ocean of memories with shimmering bioluminescent waves.',
    primaryColor: '#06b6d4',
    previewBg: '#001e3c',
  },
  {
    id: 'VintageBook',
    name: 'Vintage Book',
    environment: 'Old library, parchment pages',
    style: 'Page turns, sepia tones',
    performance: 'Low',
    description: 'A warm, nostalgic library setting with parchment textures and book-turn transitions.',
    primaryColor: '#92400e',
    previewBg: '#2d1f0e',
  },
  {
    id: 'CampfireNight',
    name: 'Campfire Night',
    environment: 'Night forest, glowing fire',
    style: 'Firefly particles, warm flicker',
    performance: 'Medium',
    description: 'Gather around a glowing campfire at night with fireflies and warm embers.',
    primaryColor: '#ea580c',
    previewBg: '#0c0902',
  },
];
