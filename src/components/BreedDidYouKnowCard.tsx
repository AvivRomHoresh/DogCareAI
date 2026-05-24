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

  const helperText = insight.matchedBreedName
    ? insight.matchType === 'fuzzy'
      ? `Matched ${dogName}'s saved breed as ${insight.matchedBreedName}.`
      : `Based on ${dogName}'s saved breed: ${insight.matchedBreedName}.`
    : breed?.trim()
      ? `Showing a fallback fact because "${breed.trim()}" is not recognized yet.`
      : `Add ${dogName}'s breed in Dog Profile for a breed-specific insight.`;
  const visibleFact = insight.factCandidates[factIndex] ?? insight.body;
  const hasMultipleFacts = insight.factCandidates.length > 1;

  return (
    <section className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Did You Know?</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{insight.title}</h2>
        </div>
        <span className="inline-flex w-fit rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-teal-800">
          {insight.fallback ? 'Fallback fact' : 'Breed insight'}
        </span>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-teal-800">Checking dog insight data...</p>
      ) : null}

      <p className="mt-3 text-sm leading-6 text-slate-700">{visibleFact}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{helperText}</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500">Source: {insight.sourceLabel}</p>
        {hasMultipleFacts ? (
          <button
            type="button"
            onClick={() => setFactIndex((current) => (current + 1) % insight.factCandidates.length)}
            className="w-fit text-xs font-semibold text-teal-800 underline decoration-teal-300 underline-offset-4 transition hover:text-teal-950 hover:decoration-teal-600 focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500"
          >
            Show another fact
          </button>
        ) : null}
      </div>
    </section>
  );
}
