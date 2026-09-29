import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'span';
}

export const Reveal: FC<RevealProps> = ({
  children,
  delay = 0,
  className = '',
  as = 'div',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const divRef = useRef<HTMLDivElement | null>(null);
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const element = as === 'span' ? spanRef.current : divRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Replays when elements leave and re-enter the viewport
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [as]);

  const stateClasses = isVisible
    ? 'translate-y-0 opacity-100'
    : 'translate-y-8 opacity-0';

  const combinedClassName = `transition-all duration-700 ease-out will-change-transform ${stateClasses} ${className}`.trim();

  if (as === 'span') {
    return (
      <span
        ref={spanRef}
        style={{ transitionDelay: `${delay}ms` }}
        className={combinedClassName}
      >
        {children}
      </span>
    );
  }

  return (
    <div
      ref={divRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={combinedClassName}
    >
      {children}
    </div>
  );
};
