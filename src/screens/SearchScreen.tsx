import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { SlidersHorizontal, Search, MapPin } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { usePetSearch } from '../hooks/usePets';
import { useAppStore } from '../store/appStore';
import { PetCard } from '../components/PetCard';
import { FilterSheet } from '../components/FilterSheet';
import {
  ALL_SPECIES,
  SPECIES_EMOJI,
  type PetSpecies,
  type Pet,
} from '../types';
import { spacing, typography, radii } from '../styles/tokens';
import { PETFINDER_API_KEY } from '../config/env';

const IS_FALLBACK = !PETFINDER_API_KEY || PETFINDER_API_KEY === 'your-rescuegroups-api-key';

export const SearchScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = usePetSearch();

  const pets = data?.pages.flatMap((p) => p.animals) ?? [];
  const totalCount = data?.pages[0]?.pagination.total_count ?? 0;

  const handlePetPress = useCallback(
    (petId: number) => navigation.navigate('PetDetail', { petId }),
    [navigation],
  );

  const onEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const renderPet = useCallback(
    ({ item, index }: { item: Pet; index: number }) => (
      <PetCard
        pet={item}
        onPress={() => handlePetPress(item.id)}
      />
    ),
    [handlePetPress],
  );

  // Active filter count (not counting defaults)
  const activeCount = [
    filters.type,
    filters.breed,
    filters.size,
    filters.gender,
    filters.age,
    filters.goodWithChildren,
    filters.goodWithDogs,
    filters.goodWithCats,
    filters.houseTrained,
  ].filter((v) => v !== null).length;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.divider }]}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>PawFinder</Text>
          <View style={s.locationRow}>
            <MapPin size={13} color={colors.primary} />
            <Text style={[s.locationText, { color: colors.textSecondary }]}>
              {filters.location} &middot; {filters.distance} mi
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setFiltersOpen(true)}
          style={[s.filterBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}
        >
          <SlidersHorizontal size={18} color={colors.primary} />
          {activeCount > 0 && (
            <View style={[s.badge, { backgroundColor: colors.primary }]}>
              <Text style={s.badgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Species quick-select */}
      <View style={s.speciesBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...ALL_SPECIES] as (PetSpecies | null)[]}
          contentContainerStyle={s.speciesContent}
          keyExtractor={(item) => item ?? 'all'}
          renderItem={({ item }) => {
            const active = filters.type === item;
            return (
              <TouchableOpacity
                onPress={() => setFilters({ type: item })}
                style={[
                  s.speciesChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={s.speciesEmoji}>
                  {item ? SPECIES_EMOJI[item] : '🌟'}
                </Text>
                <Text
                  style={[
                    s.speciesLabel,
                    { color: active ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  {item ?? 'All'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Fallback banner */}
      {IS_FALLBACK && !isLoading && (
        <View style={[s.fallbackBanner, { backgroundColor: colors.primaryDim }]}>
          <Text style={[s.fallbackText, { color: colors.primary }]}>
            Showing live data from Austin Animal Center (open data)
          </Text>
        </View>
      )}

      {/* Results count */}
      {!isLoading && (
        <View style={s.countRow}>
          <Text style={[s.countText, { color: colors.textMuted }]}>
            {totalCount.toLocaleString()} pets available
          </Text>
        </View>
      )}

      {/* Pet grid */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.textMuted }]}>
            Fetching adorable pets...
          </Text>
        </View>
      ) : isError ? (
        <View style={s.center}>
          <Text style={s.errorEmoji}>😿</Text>
          <Text style={[s.errorTitle, { color: colors.text }]}>
            Could not load pets
          </Text>
          <Text style={[s.errorMsg, { color: colors.textSecondary }]}>
            Check your internet connection and try again
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[s.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pets}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPet}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                style={s.footer}
                color={colors.primary}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.errorEmoji}>🔍</Text>
              <Text style={[s.errorTitle, { color: colors.text }]}>
                No pets found
              </Text>
              <Text style={[s.errorMsg, { color: colors.textSecondary }]}>
                Try expanding your search radius or changing filters
              </Text>
            </View>
          }
        />
      )}

      <FilterSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  title: { ...typography.h2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  locationText: { ...typography.small },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  speciesBar: { paddingVertical: spacing.md },
  speciesContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    gap: 4,
  },
  speciesEmoji: { fontSize: 16 },
  speciesLabel: { ...typography.captionBold },
  fallbackBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  fallbackText: { ...typography.small, textAlign: 'center' },
  countRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  countText: { ...typography.caption },
  grid: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { ...typography.body, marginTop: spacing.md },
  errorEmoji: { fontSize: 48, marginBottom: spacing.md },
  errorTitle: { ...typography.h3, marginBottom: spacing.xs },
  errorMsg: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.xxl },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  retryText: { color: '#FFF', ...typography.button },
  footer: { paddingVertical: spacing.xl },
});
