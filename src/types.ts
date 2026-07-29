export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface ThemeSettings {
  textColor?: string;
  backgroundColor?: string;
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

export interface PhotoItem {
  id: string;
  groupId: string;
  imageUrl: string;
  caption: string;
  displayOrder: number;
  animationStyle?: string;
  date?: string;
  location?: string;
  createdAt?: string;
}

export interface VideoItem {
  id: string;
  groupId: string;
  videoUrl: string;
  title?: string;
  displayOrder: number;
  createdAt?: string;
}

export interface QuoteItem {
  id: string;
  groupId: string;
  quote: string;
  author: string;
  displayOrder: number;
  themeColor?: string;
  createdAt?: string;
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
  unlockedAt: string;
  photos?: PhotoItem[];
  videos?: VideoItem[];
  quotes?: QuoteItem[];
  finalMessage?: FinalMessageItem;
}

