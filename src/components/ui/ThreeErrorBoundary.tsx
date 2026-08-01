import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ThreeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('3D Environment caught runtime error (recovering gracefully):', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-white/10">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
            <span className="text-amber-400 text-xl font-bold">3D</span>
          </div>
          <h3 className="text-base font-semibold text-white">3D View Safeguard Active</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Memory items are loaded safely. Use the 2D viewer or change theme if WebGL performance is constrained.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Reload 3D Space
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80';

export function getValidTextureUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return FALLBACK_IMAGE_URL;
  }
  return url.trim();
}
