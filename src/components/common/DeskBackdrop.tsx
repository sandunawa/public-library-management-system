import React, { useEffect, useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface DeskBackdropProps {
  variant?: 'library' | 'plain';
  className?: string;
}

interface ParticleConfig {
  id: number;
  left: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  sway: number;
  spriteIndex: number;
}

export const DeskBackdrop: React.FC<DeskBackdropProps> = ({
  variant = 'library',
  className,
}) => {
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const photoRef = useRef<HTMLDivElement | null>(null);
  const bokehRef = useRef<HTMLDivElement | null>(null);
  const rAFRef = useRef<number | null>(null);

  // Check theme and low power / save data
  useEffect(() => {
    const updateThemeState = () => {
      const root = document.documentElement;
      setIsDark(root.classList.contains('dark'));
      setIsHighContrast(root.classList.contains('theme-high-contrast'));
    };

    updateThemeState();
    const observer = new MutationObserver(updateThemeState);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Check navigator.connection?.saveData
    const nav: any = navigator;
    if (nav.connection?.saveData) {
      setSaveData(true);
    }

    // Screen width check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Parallax on mousemove (desktop only, throttled via rAF, respects reduced-motion)
  useEffect(() => {
    if (isMobile || isHighContrast) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      targetY = (e.clientY / innerHeight - 0.5) * 2;

      if (!rAFRef.current) {
        rAFRef.current = requestAnimationFrame(() => {
          setMouseOffset({
            x: targetX,
            y: targetY,
          });
          rAFRef.current = null;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, [isMobile, isHighContrast]);

  // Generate particles (5 on mobile, 12 on desktop)
  const particles = useMemo<ParticleConfig[]>(() => {
    if (isHighContrast || saveData) return [];
    const count = isMobile ? 5 : 12;
    const list: ParticleConfig[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        left: (i * 100) / count + (Math.random() * 8 - 4),
        size: Math.floor(Math.random() * 12) + 10, // 10-22px
        opacity: Math.random() * 0.25 + 0.25, // 0.25-0.5
        duration: Math.floor(Math.random() * 12) + 18, // 18-30s
        delay: -(Math.random() * 20), // negative delay for pre-population
        sway: Math.random() * 40 - 20, // -20px to +20px
        spriteIndex: (i % 3) + 1,
      });
    }
    return list;
  }, [isMobile, isHighContrast, saveData]);

  if (variant === 'plain' || isHighContrast) {
    return (
      <div
        className={cn('fixed inset-0 z-0 pointer-events-none bg-background', className)}
        aria-hidden="true"
      />
    );
  }

  const heroSrc = isDark
    ? '/images/backgrounds/bg-dark-library.webp'
    : isMobile
    ? '/images/backgrounds/bg-library-hero-mobile.webp'
    : '/images/backgrounds/bg-library-hero.webp';

  return (
    <div
      className={cn('fixed inset-0 z-0 pointer-events-none overflow-hidden select-none', className)}
      aria-hidden="true"
    >
      {/* 1. Base color layer */}
      <div className="absolute inset-0 bg-background transition-colors duration-300" />

      {/* 2. Photo Layer with Ken Burns + Parallax */}
      {!saveData && (
        <div
          ref={photoRef}
          style={{
            transform: `translate3d(${mouseOffset.x * 8}px, ${mouseOffset.y * 8}px, 0)`,
            transition: 'transform 200ms ease-out',
          }}
          className={cn(
            'absolute inset-[-4%] w-[108%] h-[108%] transition-opacity duration-700 ease-in-out',
            photoLoaded ? (isDark ? 'opacity-50' : 'opacity-65') : 'opacity-0'
          )}
        >
          <img
            src={heroSrc}
            alt=""
            width={2400}
            height={1400}
            fetchPriority="low"
            decoding="async"
            onLoad={() => setPhotoLoaded(true)}
            className="w-full h-full object-cover object-center animate-ken-burns"
          />
        </div>
      )}

      {/* 3. Bokeh Layer with Parallax */}
      {!saveData && photoLoaded && (
        <div
          ref={bokehRef}
          style={{
            transform: `translate3d(${-mouseOffset.x * 14}px, ${-mouseOffset.y * 14}px, 0)`,
            transition: 'transform 250ms ease-out',
          }}
          className="absolute inset-[-6%] w-[112%] h-[112%] mix-blend-soft-light opacity-35"
        >
          <img
            src="/images/backgrounds/bg-library-bokeh.webp"
            alt=""
            width={2400}
            height={1400}
            fetchPriority="low"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 4. Sliding Light Rays Overlay */}
      {!saveData && (
        <div className="absolute inset-0 overflow-hidden opacity-25 pointer-events-none">
          <div className="absolute -inset-x-full h-full bg-gradient-to-r from-transparent via-primary-soft/40 to-transparent animate-light-beam blur-2xl" />
        </div>
      )}

      {/* 5. Readability Overlays: linear top-to-middle + radial vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background/95" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.7)_100%)]" />

      {/* 6. Accent Gradient Blobs (subtle) */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-primary-soft/30 rounded-full blur-3xl" />
      <div className="absolute bottom-12 right-1/4 w-96 h-96 bg-secondary-soft/25 rounded-full blur-3xl" />

      {/* 7. Floating Particles */}
      {!saveData &&
        particles.map((p) => (
          <div
            key={p.id}
            style={
              {
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animation: `floatParticle ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
                '--particle-opacity': p.opacity,
                '--particle-sway': `${p.sway}px`,
              } as React.CSSProperties
            }
            className="absolute bottom-0 rounded-full bg-foreground/20 backdrop-blur-sm pointer-events-none"
          />
        ))}
    </div>
  );
};
