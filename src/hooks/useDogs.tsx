import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabaseClient';
import type { Dog } from '../types/dog';

type DogContextValue = {
  dogs: Dog[];
  activeDog: Dog | null;
  activeDogId: string | null;
  setActiveDogId: (dogId: string | null) => void;
  refreshDogs: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const DogContext = createContext<DogContextValue | undefined>(undefined);

type DogProviderProps = {
  children: ReactNode;
};

function getStorageKey(userId: string) {
  return `dogcareai.activeDogId.${userId}`;
}

export function DogProvider({ children }: DogProviderProps) {
  const { hasSupabaseConfig, isAuthenticated, user } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [activeDogId, setActiveDogIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedDogs, setHasLoadedDogs] = useState(false);
  const [storedDogIdUserId, setStoredDogIdUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshDogs = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !isAuthenticated) {
      setDogs([]);
      setError(null);
      setIsLoading(false);
      setHasLoadedDogs(true);
      return;
    }

    setIsLoading(true);
    setHasLoadedDogs(false);
    setError(null);

    const { data, error: loadError } = await supabase
      .from('dogs')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setDogs([]);
    } else {
      setDogs((data ?? []) as Dog[]);
    }

    setIsLoading(false);
    setHasLoadedDogs(true);
  }, [hasSupabaseConfig, isAuthenticated]);

  useEffect(() => {
    if (!user) {
      setActiveDogIdState(null);
      setDogs([]);
      setError(null);
      setHasLoadedDogs(false);
      setStoredDogIdUserId(null);
      return;
    }

    setActiveDogIdState(window.localStorage.getItem(getStorageKey(user.id)));
    setStoredDogIdUserId(user.id);
  }, [user]);

  useEffect(() => {
    void refreshDogs();
  }, [refreshDogs]);

  useEffect(() => {
    if (!user || isLoading || !hasLoadedDogs || storedDogIdUserId !== user.id) {
      return;
    }

    const storedDogIsAvailable = dogs.some((dog) => dog.id === activeDogId);
    const nextActiveDogId = storedDogIsAvailable ? activeDogId : dogs[0]?.id ?? null;

    if (nextActiveDogId !== activeDogId) {
      setActiveDogIdState(nextActiveDogId);
    }

    if (nextActiveDogId) {
      window.localStorage.setItem(getStorageKey(user.id), nextActiveDogId);
    } else {
      window.localStorage.removeItem(getStorageKey(user.id));
    }
  }, [activeDogId, dogs, hasLoadedDogs, isLoading, storedDogIdUserId, user]);

  const setActiveDogId = useCallback(
    (dogId: string | null) => {
      setActiveDogIdState(dogId);

      if (!user) {
        return;
      }

      if (dogId) {
        window.localStorage.setItem(getStorageKey(user.id), dogId);
      } else {
        window.localStorage.removeItem(getStorageKey(user.id));
      }
    },
    [user],
  );

  const activeDog = useMemo(
    () => dogs.find((dog) => dog.id === activeDogId) ?? null,
    [activeDogId, dogs],
  );

  const value = useMemo<DogContextValue>(
    () => ({
      dogs,
      activeDog,
      activeDogId,
      setActiveDogId,
      refreshDogs,
      isLoading,
      error,
    }),
    [activeDog, activeDogId, dogs, error, isLoading, refreshDogs, setActiveDogId],
  );

  return <DogContext.Provider value={value}>{children}</DogContext.Provider>;
}

export function useDogs() {
  const context = useContext(DogContext);

  if (!context) {
    throw new Error('useDogs must be used within DogProvider');
  }

  return context;
}
