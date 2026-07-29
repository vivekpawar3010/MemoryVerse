import { VisitorGroupAccess } from '../../types';

export interface ThemeProps {
  data: VisitorGroupAccess;
  isLowEndDevice?: boolean;
  activePhotoId: string | null;
  setActivePhotoId: (id: string | null) => void;
}
