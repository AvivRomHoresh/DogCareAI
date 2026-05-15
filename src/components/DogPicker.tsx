import { useDogs } from '../hooks/useDogs';

export function DogPicker() {
  const { activeDog, activeDogId, dogs, error, isLoading, setActiveDogId } = useDogs();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-600">
        Loading dog context...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Dog context unavailable
      </div>
    );
  }

  if (dogs.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="font-semibold">Active dog:</span> none yet
      </div>
    );
  }

  if (dogs.length === 1) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
        <span className="font-semibold">Active dog:</span> {activeDog?.name ?? dogs[0].name}
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span className="font-semibold">Active dog</span>
      <select
        value={activeDogId ?? ''}
        onChange={(event) => setActiveDogId(event.target.value || null)}
        className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
      >
        {dogs.map((dog) => (
          <option key={dog.id} value={dog.id}>
            {dog.name}
          </option>
        ))}
      </select>
    </label>
  );
}
