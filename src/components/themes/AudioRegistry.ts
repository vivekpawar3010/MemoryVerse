export interface AudioMetadata {
  id: string;
  name: string;
  url: string;
  description: string;
}

// Pre-defined list of 10 Ambient Audios and 10 Ending Audios.
// IMPORTANT: These use public demo links. For a production app, the admin should download 
// royalty-free music (e.g. from Pixabay, Epidemic Sound, YouTube Audio Library), 
// upload them to the Supabase "media" bucket, and replace these URLs with the Supabase storage URLs.

export const AUDIO_REGISTRY = {
  ambient: [
    { id: 'amb_space', name: 'Deep Space Drone', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8b8f7df43.mp3', description: 'Dark, vast, and cinematic space drone.' },
    { id: 'amb_ocean', name: 'Ocean Waves', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_82c2b380bf.mp3', description: 'Calming ocean waves hitting the shore.' },
    { id: 'amb_forest', name: 'Night Forest', url: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_55a297eef9.mp3', description: 'Crickets and wind in a dark forest.' },
    { id: 'amb_rain', name: 'Gentle Rain', url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_031eb5a7c9.mp3', description: 'Relaxing rain falling on a window.' },
    { id: 'amb_magic', name: 'Magical Sparkles', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0865aaee2.mp3', description: 'Ethereal and magical twinkling sounds.' },
    { id: 'amb_piano', name: 'Soft Ambient Piano', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_3ba339ed35.mp3', description: 'Very soft, slow background piano.' },
    { id: 'amb_wind', name: 'Mountain Wind', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc8cb54087.mp3', description: 'Cold, rushing wind in the mountains.' },
    { id: 'amb_fire', name: 'Cozy Fireplace', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c36399b1c7.mp3', description: 'Warm crackling fireplace.' },
    { id: 'amb_city', name: 'Cyberpunk City', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_c2b0c39f04.mp3', description: 'Distant sirens, neon buzz, and rain.' },
    { id: 'amb_dream', name: 'Ethereal Dream', url: 'https://cdn.pixabay.com/download/audio/2023/04/28/audio_9242981db8.mp3', description: 'Floating, glowing synth pads.' }
  ],
  ending: [
    { id: 'end_emotional', name: 'Emotional Farewell', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_100346a757.mp3', description: 'A tear-jerking emotional piano piece.' },
    { id: 'end_epic', name: 'Epic Triumph', url: 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_19f39008bc.mp3', description: 'Huge orchestral finish.' },
    { id: 'end_happy', name: 'Happy Memories', url: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_13a37c9f69.mp3', description: 'Upbeat, nostalgic acoustic guitar.' },
    { id: 'end_hope', name: 'Hopeful Future', url: 'https://cdn.pixabay.com/download/audio/2022/12/12/audio_51d200fdf8.mp3', description: 'Inspiring cinematic strings.' },
    { id: 'end_sad', name: 'Melancholy Strings', url: 'https://cdn.pixabay.com/download/audio/2023/02/28/audio_3108c49cc3.mp3', description: 'Slow, sad cello and violin.' },
    { id: 'end_lofi', name: 'Chill Lofi', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_845c431448.mp3', description: 'Relaxed lofi hip hop beat.' },
    { id: 'end_romantic', name: 'Romantic Waltz', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_0ed20b224d.mp3', description: 'Beautiful romantic piano waltz.' },
    { id: 'end_mystery', name: 'Mysterious Fade', url: 'https://cdn.pixabay.com/download/audio/2023/01/01/audio_967e85c9a4.mp3', description: 'Dark, mysterious ambient fade out.' },
    { id: 'end_vlog', name: 'Upbeat Vlog', url: 'https://cdn.pixabay.com/download/audio/2022/10/24/audio_403ffaa46c.mp3', description: 'Fun, energetic pop track.' },
    { id: 'end_gospel', name: 'Soulful Choir', url: 'https://cdn.pixabay.com/download/audio/2023/03/19/audio_89a0718526.mp3', description: 'A beautiful soulful choir singing.' }
  ]
};
