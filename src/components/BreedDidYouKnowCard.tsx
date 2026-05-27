import { useEffect, useState } from 'react';
import { getDogInsight, getLocalDogInsight } from '../lib/dogInsights';
import type { DogInsight } from '../lib/dogInsights';

type BreedDidYouKnowCardProps = {
  breed: string | null | undefined;
  dogName: string;
};

export function BreedDidYouKnowCard({ breed, dogName }: BreedDidYouKnowCardProps) {
  const [insight, setInsight] = useState<DogInsight>(() => getLocalDogInsight(breed));
  const [factIndex, setFactIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFactVisible, setIsFactVisible] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const nextLocalInsight = getLocalDogInsight(breed);
    setInsight(nextLocalInsight);
    setFactIndex(Math.max(0, nextLocalInsight.factCandidates.indexOf(nextLocalInsight.body)));
    setIsLoading(true);

    getDogInsight(breed)
      .then((nextInsight) => {
        if (isCurrent) {
          setInsight(nextInsight);
          setFactIndex(Math.max(0, nextInsight.factCandidates.indexOf(nextInsight.body)));
        }
      })
      .catch(() => {
        if (isCurrent) {
          const fallbackInsight = getLocalDogInsight(breed);
          setInsight(fallbackInsight);
          setFactIndex(Math.max(0, fallbackInsight.factCandidates.indexOf(fallbackInsight.body)));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [breed]);

  useEffect(() => {
    setIsFactVisible(false);
    const timeoutId = window.setTimeout(() => setIsFactVisible(true), 120);

    return () => window.clearTimeout(timeoutId);
  }, [factIndex, insight.body]);

  const visibleFact = insight.factCandidates[factIndex] ?? insight.body;
  const hasMultipleFacts = insight.factCandidates.length > 1;
  const rotateFact = () => {
    if (!hasMultipleFacts) {
      return;
    }

    setFactIndex((current) => (current + 1) % insight.factCandidates.length);
  };

  useEffect(() => {
    if (!hasMultipleFacts) {
      return undefined;
    }

    const intervalId = window.setInterval(rotateFact, 8000);

    return () => window.clearInterval(intervalId);
  }, [hasMultipleFacts, insight.factCandidates.length]);

  return (
    <section
      aria-label={`Did You Know insight for ${dogName}`}
      className="mx-auto max-w-3xl px-2 py-1"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="shrink-0 text-xs font-extrabold uppercase tracking-wide text-amber-900 sm:text-sm">
          Did You Know
        </span>
        {hasMultipleFacts ? (
          <button
            type="button"
            onClick={rotateFact}
            className="group inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amber-700 transition hover:bg-amber-100 hover:text-amber-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            aria-label="Show another dog fact"
            title="Show another dog fact"
          >
            <LightbulbIcon />
          </button>
        ) : null}
        <div className="min-w-0">
          <p
            className={[
              'text-sm leading-6 text-slate-700 transition duration-300',
              isFactVisible ? 'opacity-100 translate-y-0' : 'translate-y-1 opacity-0',
            ].join(' ')}
          >
            {isLoading ? 'Checking a safe dog insight...' : visibleFact}
          </p>
        </div>
      </div>
    </section>
  );
}

function LightbulbIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 transition group-hover:scale-110" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 18h6M10 22h4M8.5 14.5c-1.7-1.2-2.8-3.1-2.8-5.3C5.7 5.7 8.5 3 12 3s6.3 2.7 6.3 6.2c0 2.2-1.1 4.1-2.8 5.3-.8.6-1.1 1.2-1.1 2.1v.4H9.6v-.4c0-.9-.3-1.5-1.1-2.1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
