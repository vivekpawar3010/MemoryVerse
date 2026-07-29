export interface ThemeMetadata {
  id: string;
  name: string;
  environment: string;
  style: string;
  performance: 'Low' | 'Medium' | 'High';
  description: string;
}

export const THEME_REGISTRY: ThemeMetadata[] = [
  {
    id: 'CinematicSpace',
    name: 'Cinematic Space Journey',
    environment: 'Deep space, nebula, stars',
    style: 'Slow cinematic fly-through, glowing holograms',
    performance: 'High',
    description: 'A premium, Pixar/Interstellar style journey through deep space where photos float as glowing holograms.',
  },
  {
    id: 'FloatingMuseum',
    name: 'Floating Polaroid Museum',
    environment: 'Modern art museum, soft sunlight',
    style: 'Smooth hovering, swinging polaroids',
    performance: 'Medium',
    description: 'White walls and soft sunlight. Photos hang from invisible strings and gently swing with gravity.',
  },
  {
    id: 'VintageBook',
    name: 'Vintage Memory Book',
    environment: 'Old wooden desk, vintage lighting',
    style: 'Realistic page flipping, ink effects',
    performance: 'Medium',
    description: 'An interactive animated book on a vintage desk. Photos are printed directly onto textured paper pages.',
  },
  {
    id: 'DreamClouds',
    name: 'Dream Clouds',
    environment: 'Golden sunset sky, floating islands',
    style: 'Slow wind, peaceful floating',
    performance: 'Medium',
    description: 'A peaceful sky above the clouds at sunset. Photos are attached to floating islands drifting in the wind.',
  },
  {
    id: 'OceanMemories',
    name: 'Ocean Memories',
    environment: 'Water surface, reflections',
    style: 'Floating bobbing frames, sailing camera',
    performance: 'High',
    description: 'Floating wooden frames on a realistic ocean surface with small waves and light rays.',
  },
  {
    id: 'CampfireNight',
    name: 'Campfire Night',
    environment: 'Dark forest, campfire, fireflies',
    style: 'Warm flickering light, smoke particles',
    performance: 'High',
    description: 'A cozy forest campfire at night. Photos hang on a rope illuminated by flickering firelight and fireflies.',
  },
  {
    id: 'CyberFuture',
    name: 'Cyber Future',
    environment: 'Neon city, digital rain',
    style: 'Glitch transitions, neon bloom',
    performance: 'High',
    description: 'High energy futuristic city with neon lights, holograms, and digital matrix-style rain.',
  },
  {
    id: 'GoldenHour',
    name: 'Golden Hour Memories',
    environment: 'Grass fields, sunset',
    style: 'Lens flare, floating dust',
    performance: 'Medium',
    description: 'Warm, emotional lighting with floating dust particles over a peaceful grassy field.',
  }
];
