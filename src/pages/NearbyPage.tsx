import { NearbyDogPlacesCard } from '../components/NearbyDogPlacesCard';
import { NearbyIcon } from '../components/icons/NearbyIcon';

export function NearbyPage() {
  return (
    <div className="space-y-5">
      <header className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center justify-center gap-3 text-teal-800">
          <NearbyIcon className="h-8 w-8" />
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Nearby Places</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Find nearby vets, pet shops, dog parks, and groomers for the active dog-care moment.
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Results may be incomplete or imperfect, so call ahead before relying on opening hours or availability.
        </p>
      </header>

      <NearbyDogPlacesCard />
    </div>
  );
}
