import { useEffect, useRef, useState, type FC } from 'react';
import { gsap } from 'gsap';

const EXACT_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_104107_121bfb5a-b1df-4e0d-8240-25b81f7cc85d.mp4';
const LOCAL_BACKUP_URL = '/nova-video.mp4';
const PRE_EXTRACTED_COUNT = 121;

export const ScrollVideo: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const framesRef = useRef<ImageBitmap[]>([]);
  const [framesReady, setFramesReady] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(EXACT_VIDEO_URL);

  const smoothedProgress = useRef(0);
  const lastDrawnProgress = useRef<number>(-1);
  const isSeeking = useRef(false);

  // 1. Instant Parallel Frame Loading with Fallback to off-DOM video extraction
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const loadedBitmaps: ImageBitmap[] = [];

    const loadFrames = async () => {
      // Fast path: load pre-extracted high-resolution frames in parallel (< 300ms)
      try {
        const framePromises = Array.from({ length: PRE_EXTRACTED_COUNT }, async (_, i) => {
          const frameNum = String(i + 1).padStart(3, '0');
          const res = await fetch(`/frames/frame_${frameNum}.jpg`);
          if (!res.ok) throw new Error(`Frame ${frameNum} not found`);
          const blob = await res.blob();
          return createImageBitmap(blob);
        });

        const bitmaps = await Promise.all(framePromises);
        if (cancelled) {
          bitmaps.forEach((b) => b.close());
          return;
        }

        framesRef.current = bitmaps;
        setFramesReady(true);
        return;
      } catch {
        // Fallback: runtime off-DOM video extraction as specified in prompt
        console.warn('Fast frame cache missed, extracting via off-DOM video...');
      }

      if (cancelled) return;

      // Extract via off-DOM video
      let sourceUrl = EXACT_VIDEO_URL;
      try {
        const response = await fetch(EXACT_VIDEO_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        sourceUrl = objectUrl;
      } catch {
        try {
          const res = await fetch(LOCAL_BACKUP_URL);
          if (res.ok) {
            const blob = await res.blob();
            if (cancelled) return;
            objectUrl = URL.createObjectURL(blob);
            sourceUrl = objectUrl;
            setActiveVideoUrl(LOCAL_BACKUP_URL);
          }
        } catch {
          // ignore
        }
      }

      if (cancelled) return;

      const offVideo = document.createElement('video');
      offVideo.muted = true;
      offVideo.playsInline = true;
      offVideo.preload = 'auto';
      offVideo.crossOrigin = 'anonymous';
      offVideo.src = sourceUrl;

      try {
        await new Promise<void>((resolve, reject) => {
          offVideo.onloadedmetadata = () => resolve();
          offVideo.onerror = (e) => reject(e);
          if (offVideo.readyState >= 1) resolve();
        });

        if (cancelled) return;

        const duration = offVideo.duration || 8;
        const scale = offVideo.videoWidth > 1280 ? 1280 / offVideo.videoWidth : 1;
        const targetWidth = Math.max(1, Math.round(offVideo.videoWidth * scale));
        const targetHeight = Math.max(1, Math.round(offVideo.videoHeight * scale));
        const frameCount = Math.max(30, Math.min(120, Math.round(duration * 24)));
        const maxSeek = Math.max(0.01, duration - 0.05);

        for (let i = 0; i < frameCount; i++) {
          if (cancelled) break;
          offVideo.currentTime = (i / (frameCount - 1)) * maxSeek;
          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              offVideo.removeEventListener('seeked', onSeeked);
              resolve();
            };
            offVideo.addEventListener('seeked', onSeeked);
          });

          if (cancelled) break;

          const bitmap = await createImageBitmap(offVideo, {
            resizeWidth: targetWidth,
            resizeHeight: targetHeight,
            resizeQuality: 'high',
          });
          loadedBitmaps.push(bitmap);
        }

        if (!cancelled && loadedBitmaps.length > 0) {
          framesRef.current = loadedBitmaps;
          setFramesReady(true);
        }
      } catch (err) {
        console.warn('Video extraction error:', err);
      }
    };

    loadFrames();

    return () => {
      cancelled = true;
      loadedBitmaps.forEach((b) => b.close());
      framesRef.current.forEach((b) => b.close());
      framesRef.current = [];
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  // 2. Animation loop synced with GSAP Ticker & Sub-Frame Alpha Crossfading
  useEffect(() => {
    const handleScroll = () => {
      // passive scroll listener
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      lastDrawnProgress.current = -1; // force redraw
    };
    window.addEventListener('resize', handleResize);

    const tick = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const innerHeight = window.innerHeight;
      const maxScroll = Math.max(1, scrollHeight - innerHeight);
      const targetProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      // Responsive interpolation coupled with Lenis inertia
      smoothedProgress.current += (targetProgress - smoothedProgress.current) * 0.25;
      const smoothed = smoothedProgress.current;

      const canvas = canvasRef.current;
      const frames = framesRef.current;

      if (frames.length > 0 && canvas) {
        // High-DPI canvas resolution
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const displayW = Math.floor(canvas.clientWidth * dpr);
        const displayH = Math.floor(canvas.clientHeight * dpr);

        if (canvas.width !== displayW || canvas.height !== displayH) {
          canvas.width = displayW;
          canvas.height = displayH;
          lastDrawnProgress.current = -1;
        }

        // Only redraw when smoothed progress changes significantly (sub-frame threshold)
        if (Math.abs(smoothed - lastDrawnProgress.current) > 0.0003) {
          lastDrawnProgress.current = smoothed;

          // Continuous sub-frame optical crossfade between adjacent frames
          const totalFrames = frames.length - 1;
          const exactPos = Math.max(0, Math.min(totalFrames, smoothed * totalFrames));
          const indexA = Math.floor(exactPos);
          const indexB = Math.min(totalFrames, indexA + 1);
          const blend = exactPos - indexA; // 0.0 to 1.0 continuous fraction

          const frameA = frames[indexA];
          const frameB = frames[indexB];
          const ctx = canvas.getContext('2d');

          if (ctx && frameA) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Cover math: scale = max of canvas/frame ratios, center overflow
            const hRatio = canvas.width / frameA.width;
            const vRatio = canvas.height / frameA.height;
            const ratio = Math.max(hRatio, vRatio);
            const renderW = frameA.width * ratio;
            const renderH = frameA.height * ratio;
            const shiftX = (canvas.width - renderW) / 2;
            const shiftY = (canvas.height - renderH) / 2;

            // Draw base frame A
            ctx.globalAlpha = 1.0;
            ctx.drawImage(frameA, shiftX, shiftY, renderW, renderH);

            // Draw interpolated frame B on top with blend opacity
            if (blend > 0.005 && frameB && indexB !== indexA) {
              ctx.globalAlpha = blend;
              ctx.drawImage(frameB, shiftX, shiftY, renderW, renderH);
              ctx.globalAlpha = 1.0;
            }
          }
        }
      } else if (fallbackVideoRef.current) {
        // Fallback video scrubbing
        const video = fallbackVideoRef.current;
        if (video.duration && !isSeeking.current) {
          const targetTime = smoothed * video.duration;
          if (Math.abs(video.currentTime - targetTime) > 0.001) {
            isSeeking.current = true;
            video.currentTime = targetTime;
          }
        }
      }
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0a] overflow-hidden">
      {/* Canvas for pre-extracted frames */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />

      {/* Fallback video scrubbed while frames are not ready */}
      {!framesReady && (
        <video
          ref={fallbackVideoRef}
          src={activeVideoUrl}
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          onSeeked={() => {
            isSeeking.current = false;
          }}
          onError={() => {
            if (activeVideoUrl !== LOCAL_BACKUP_URL) {
              setActiveVideoUrl(LOCAL_BACKUP_URL);
            }
          }}
        />
      )}

      {/* 4. Overlay for text contrast */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
};
