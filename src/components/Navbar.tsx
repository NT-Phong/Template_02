import type { FC } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from './Reveal';

const NAV_ITEMS = [
  { label: 'main', href: '#main' },
  { label: 'tiers', href: '#tiers' },
  { label: 'features', href: '#features' },
  { label: 'talk to us', href: '#talk-to-us' },
];

export const Navbar: FC = () => {
  return (
    <header>
      {/* Top Left Wordmark & Version */}
      <div className="fixed left-5 top-5 z-50 sm:left-8 sm:top-7 md:left-12">
        <Reveal>
          <a
            href="#"
            className="font-mono text-lg font-medium tracking-tight text-white drop-shadow-md sm:text-xl md:text-2xl transition-opacity hover:opacity-90"
          >
            (NOVA_AI)
          </a>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-6 font-mono text-[10px] text-white/60 sm:mt-8 sm:text-xs">
            [ v.01b ]
          </div>
        </Reveal>
      </div>

      {/* Top Right Navigation */}
      <nav className="fixed right-5 top-5 z-50 sm:right-8 sm:top-7 md:right-12">
        <ul className="flex flex-col items-end gap-1.5 sm:gap-2">
          {NAV_ITEMS.map((item, i) => (
            <li key={item.label}>
              <Reveal delay={100 + i * 120}>
                <a
                  href={item.href}
                  className="group flex items-center gap-1 font-mono text-xs text-white/80 drop-shadow-md transition-colors duration-300 hover:text-white sm:text-sm"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};
