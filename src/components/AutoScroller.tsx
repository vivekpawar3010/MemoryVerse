import React from 'react';
import { useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface Props {
  isPlaying: boolean;
}

export const AutoScroller: React.FC<Props> = ({ isPlaying }) => {
  const scroll = useScroll();

  useFrame((state, delta) => {
    if (isPlaying && scroll.el) {
      const maxScroll = scroll.el.scrollHeight - scroll.el.clientHeight;
      if (maxScroll > 0 && scroll.el.scrollTop < maxScroll) {
        scroll.el.scrollTop += 25 * delta;
      }
    }
  });

  return null;
};
