import React from 'react';

export const LAZY_THEME_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'CinematicSpace': React.lazy(() => import('./CinematicSpace')),
  'FloatingMuseum': React.lazy(() => import('./FloatingMuseum')),
  'VintageBook': React.lazy(() => import('./VintageBook')),
  'DreamClouds': React.lazy(() => import('./DreamClouds')),
  'OceanMemories': React.lazy(() => import('./OceanMemories')),
  'CampfireNight': React.lazy(() => import('./CampfireNight')),
  'CyberFuture': React.lazy(() => import('./CyberFuture')),
  'GoldenHour': React.lazy(() => import('./GoldenHour')),
};
