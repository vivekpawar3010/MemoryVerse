export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  category: 'ambient' | 'effect' | 'ending';
  description: string;
}

export const BACKGROUND_AUDIO: AudioTrack[] = [
  { 
    id: 'friendship_1', 
    name: 'Acoustic Memories', 
    url: 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58bb.mp3', 
    category: 'ambient',
    description: 'Warm acoustic guitar with a nostalgic, emotional feel.' 
  },
  { 
    id: 'friendship_2', 
    name: 'Endless Horizons', 
    url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_2441951560.mp3', 
    category: 'ambient',
    description: 'Ambient cinematic piano and strings for deep friendship memories.' 
  },
  {
    id: 'celestial_dreams',
    name: 'Celestial Dreams',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    category: 'ambient',
    description: 'Atmospheric synth pad for futuristic & space 3D themes.'
  },
  {
    id: 'golden_sunset',
    name: 'Golden Sunset',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73213.mp3',
    category: 'ambient',
    description: 'Gentle acoustic lo-fi vibes for sunset memories.'
  },
  { 
    id: 'custom_upload', 
    name: 'Custom Upload', 
    url: 'custom', 
    category: 'ambient',
    description: 'Provide your own custom audio link.' 
  },
];

export const SOUND_EFFECTS: AudioTrack[] = [
  {
    id: 'chime',
    name: 'Gentle Chime',
    url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',
    category: 'effect',
    description: 'Soft glass chime for card hovers and reveals.'
  },
  {
    id: 'click',
    name: 'Camera Shutter Click',
    url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav',
    category: 'effect',
    description: 'Classic shutter click for photo zoom animations.'
  },
  {
    id: 'ping',
    name: 'Soft Acoustic Ping',
    url: 'https://assets.mixkit.co/active_storage/sfx/911/911-84.wav',
    category: 'effect',
    description: 'Subtle woodblock ping reaction.'
  },
  {
    id: 'sparkle',
    name: 'Sparkle Magic',
    url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-84.wav',
    category: 'effect',
    description: 'Magical shimmer sound effect for floating cards.'
  }
];

export const ENDING_AUDIO: AudioTrack[] = [
  {
    id: 'ending_piano',
    name: 'Emotional Piano Farewell',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c3c39df4a8.mp3',
    category: 'ending',
    description: 'Soft piano outro for final messages and goodbyes.'
  }
];

export const getAudioUrl = (id: string | undefined): string | null => {
  if (!id) return null;
  if (id.startsWith('http') || id.startsWith('blob:')) return id;
  const allTracks = [...BACKGROUND_AUDIO, ...SOUND_EFFECTS, ...ENDING_AUDIO];
  const track = allTracks.find(t => t.id === id);
  return track ? track.url : id;
};
