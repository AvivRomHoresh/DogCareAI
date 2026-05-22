import { NearbyDogPlacesCard } from '../components/NearbyDogPlacesCard';
import { PageCard } from '../components/PageCard';

export function NearbyPage() {
  return (
    <div className="space-y-4">
      <PageCard
        title="Nearby Places"
        description="Find dog-relevant places near you using browser location and free OpenStreetMap data."
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          DogCareAI does not use Google Places or paid map APIs. Google Maps links open a normal map search in a new tab
          using the place coordinates.
        </div>
      </PageCard>

      <NearbyDogPlacesCard />
    </div>
  );
}
