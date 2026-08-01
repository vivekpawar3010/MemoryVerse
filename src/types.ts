export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface ThemeSettings {
  textColor?: string;
  backgroundColor?: string;
  enabledAnimations?: string[];
  [key: string]: any;
}

export interface Group {
  id: string;
  memoryId?: string;
  groupName: string;
  password?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  theme?: string;
  coverImage?: string;
  audioUrl?: string; // Legacy
  ambientAudio?: string;
  endingAudio?: string;
  introQuote?: string;
  themeSettings?: ThemeSettings;
  allowDownload?: boolean;
  allowShare?: boolean;
  showWatermark?: boolean;
  allowAudioChange?: boolean;
  createdBy?: string;
  members?: string[];
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
  photoCount: number;
  videoCount: number;
  quoteCount: number;
  hasFinalMessage: boolean;
  finalMessageTitle?: string;
  finalMessageText?: string;
}

export interface BaseMemoryItem {
  id: string;
  groupId: string;
  displayOrder: number;
  coverPhotoUrl?: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scale?: number;
  frameStyle?: string;
  glowStrength?: number;
  animationType?: string;
  layerIndex?: number;
  isVisible?: boolean;
  animationSettings?: Record<string, any>;
  audioSettings?: Record<string, any>;
  themeSettings?: Record<string, any>;
  createdAt?: string;
}

export interface PhotoItem extends BaseMemoryItem {
  imageUrl: string;
  caption: string;
  animationStyle?: string;
  date?: string;
  location?: string;
}

export interface VideoItem extends BaseMemoryItem {
  videoUrl: string;
  title?: string;
}

export interface QuoteItem extends BaseMemoryItem {
  quote: string;
  author: string;
  themeColor?: string;
}

export interface FinalMessageItem {
  id: string;
  groupId: string;
  title: string;
  message: string;
}

export interface DashboardSummary {
  totalGroups: number;
  totalPhotos: number;
  totalVideos: number;
  totalQuotes: number;
  activeSessions: number;
}

export interface VisitorGroupAccess {
  groupId: string;
  groupName: string;
  memoryId?: string;
  accessGranted: boolean;
  theme?: string;
  audioUrl?: string; // Legacy
  ambientAudio?: string;
  endingAudio?: string;
  introQuote?: string;
  themeSettings?: ThemeSettings;
  allowDownload?: boolean;
  allowShare?: boolean;
  showWatermark?: boolean;
  allowAudioChange?: boolean;
  unlockedAt: string;
  photos?: PhotoItem[];
  videos?: VideoItem[];
  quotes?: QuoteItem[];
  finalMessage?: FinalMessageItem;
}

