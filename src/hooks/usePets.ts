/**
 * React Query hooks for Petfinder data.
 *
 * - refetchInterval keeps data fresh automatically
 * - staleTime prevents unnecessary network hits on tab switches
 * - All hooks support pull-to-refresh via returned refetch()
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { searchAnimals, getAnimal, getBreeds, searchOrganizations } from '../lib/petfinder';
import { useAppStore } from '../store/appStore';
import { REFETCH_INTERVAL, STALE_TIME } from '../config/env';
import type { SearchFilters } from '../types';

export const usePetSearch = () => {
  const filters = useAppStore((s) => s.filters);

  return useInfiniteQuery({
    queryKey: ['pets', filters],
    queryFn: ({ pageParam = 1 }) => searchAnimals(filters, pageParam),
    getNextPageParam: (last) =>
      last.pagination.current_page < last.pagination.total_pages
        ? last.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

export const usePetDetail = (petId: number) =>
  useQuery({
    queryKey: ['pet', petId],
    queryFn: () => getAnimal(petId),
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    enabled: petId > 0,
  });

export const useBreeds = (type: string | null) =>
  useQuery({
    queryKey: ['breeds', type],
    queryFn: () => getBreeds(type!),
    enabled: !!type,
    staleTime: 5 * 60_000, // Breeds change rarely
  });

export const useShelterSearch = () => {
  const { location, distance } = useAppStore((s) => s.filters);

  return useInfiniteQuery({
    queryKey: ['shelters', location, distance],
    queryFn: ({ pageParam = 1 }) =>
      searchOrganizations(location, distance, pageParam),
    getNextPageParam: (last) =>
      last.pagination.current_page < last.pagination.total_pages
        ? last.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};
