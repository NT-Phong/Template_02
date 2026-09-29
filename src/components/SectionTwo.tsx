import type { FC } from 'react';
import { Share2 } from 'lucide-react';
import { Reveal } from './Reveal';

export const SectionTwo: FC = () => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NOVA_AI — Learn to see Brilliantly',
          url: window.location.href,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <section id="features" className="relative flex min-h-screen flex-col supports-[height:100svh]:min-h-[100svh]">
      {/* Middle row */}
      <div className="relative flex flex-1 flex-col justify-center gap-10 px-5 pt-24 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:pt-0 md:px-12">
        {/* Left Headline: Learn to see Brilliantly */}
        <h2 className="max-w-sm text-4xl font-medium uppercase leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
          <Reveal as="span" delay={100} className="block">
            Learn <span className="normal-case italic font-light">to see</span>
          </Reveal>
          <Reveal as="span" delay={220} className="block">
            Brilliantly
          </Reveal>
        </h2>

        {/* Right Label ( B ) [ 002 /004 ] */}
        <Reveal delay={340}>
          <div className="flex items-center justify-between font-mono text-white sm:justify-start sm:gap-16 md:gap-24">
            <span className="text-lg font-medium">( B )</span>
            <span className="text-xs text-white/70">[ 002 /004 ]</span>
          </div>
        </Reveal>
      </div>

      {/* Bottom block */}
      <div className="relative flex flex-col gap-10 px-5 pb-16 sm:px-8 md:px-12 md:pb-20">
        {/* Paragraph */}
        <Reveal delay={460}>
          <p className="max-w-xs text-sm leading-relaxed text-white/85 drop-shadow-md">
            Our AI doesn't just respond — it interprets, sharpens, and delivers. From outline to final render, it supplies the insight you want.
          </p>
        </Reveal>

        {/* CTA: In-flow on mobile, bottom-centered on sm+ */}
        <div className="w-full max-w-xs sm:absolute sm:bottom-16 sm:left-1/2 sm:w-auto sm:max-w-none sm:-translate-x-1/2 md:bottom-20">
          <Reveal delay={580}>
            <a
              href="#demo"
              className="block rounded-full border border-white/60 px-10 py-3 text-center font-mono text-xs uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-white hover:text-black"
            >
              Run The Demo
            </a>
          </Reveal>
        </div>
      </div>

      {/* Absolute bottom-left Share2 icon button */}
      <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-8 md:left-12">
        <Reveal delay={700}>
          <button
            type="button"
            aria-label="Share"
            onClick={handleShare}
            className="flex items-center justify-center text-white/80 transition-colors duration-300 hover:text-white"
          >
            <Share2 size={18} />
          </button>
        </Reveal>
      </div>
    </section>
  );
};
