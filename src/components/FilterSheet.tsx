import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  TextInput,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/appStore';
import { useBreeds } from '../hooks/usePets';
import {
  ALL_SPECIES,
  SPECIES_EMOJI,
  DISTANCE_OPTIONS,
  type PetSpecies,
  type PetAge,
  type PetSize,
  type PetGender,
} from '../types';
import { radii, spacing, typography } from '../styles/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const AGES: PetAge[] = ['Baby', 'Young', 'Adult', 'Senior'];
const SIZES: PetSize[] = ['Small', 'Medium', 'Large', 'Extra Large'];
const GENDERS: PetGender[] = ['Male', 'Female'];
const COATS = ['Short', 'Medium', 'Long', 'Wire', 'Hairless', 'Curly'];
const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Distance', value: 'distance' },
  { label: 'Newest first', value: 'recent' },
  { label: 'Farthest first', value: '-distance' },
  { label: 'Random', value: 'random' },
];

export const FilterSheet: React.FC<Props> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const [localLocation, setLocalLocation] = useState(filters.location);
  const [breedSearch, setBreedSearch] = useState('');
  const [showBreeds, setShowBreeds] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Fetch breeds for the selected species
  const { data: breedsData, isLoading: breedsLoading } = useBreeds(filters.type);
  const allBreeds = breedsData?.breeds.map((b) => b.name) ?? [];
  const filteredBreeds = breedSearch
    ? allBreeds.filter((b) => b.toLowerCase().includes(breedSearch.toLowerCase()))
    : allBreeds;

  useEffect(() => {
    setLocalLocation(filters.location);
  }, [filters.location]);

  const applyLocation = () => {
    if (localLocation.trim()) setFilters({ location: localLocation.trim() });
  };

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const chip = (
    label: string,
    active: boolean,
    onPress: () => void,
    emoji?: string,
  ) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      style={[
        s.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      {emoji && <Text style={s.chipEmoji}>{emoji}</Text>}
      <Text
        style={[s.chipLabel, { color: active ? '#FFF' : colors.textSecondary }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const toggle = (label: string, value: boolean | null, key: string) => (
    <TouchableOpacity
      key={key}
      onPress={() => setFilters({ [key]: value === true ? null : true } as any)}
      style={[s.toggleRow, { borderBottomColor: colors.divider }]}
    >
      <Text style={[s.toggleLabel, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          s.toggleIndicator,
          {
            backgroundColor: value === true ? colors.success : 'transparent',
            borderColor: value === true ? colors.success : colors.border,
          },
        ]}
      >
        {value === true && <Text style={s.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, sectionKey }: { title: string; sectionKey: string }) => {
    const expanded = expandedSections[sectionKey] !== false; // default open
    return (
      <TouchableOpacity
        onPress={() => toggleSection(sectionKey)}
        style={s.sectionHeader}
      >
        <Text style={[s.sectionTitle, { color: colors.text }]}>{title}</Text>
        {expanded ? (
          <ChevronUp size={18} color={colors.textMuted} />
        ) : (
          <ChevronDown size={18} color={colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  const isExpanded = (key: string) => expandedSections[key] !== false;

  // Count active filters
  const activeCount = [
    filters.type,
    filters.breed,
    filters.size,
    filters.gender,
    filters.age,
    filters.coat,
    filters.color,
    filters.goodWithChildren,
    filters.goodWithDogs,
    filters.goodWithCats,
    filters.houseTrained,
    filters.specialNeeds,
  ].filter((v) => v !== null).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.sheet, { backgroundColor: colors.filterSheetBg }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={[s.resetBtn, { color: colors.accent }]}>Reset All</Text>
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text }]}>
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Location ─────────────────────────────────────── */}
          <SectionHeader title="LOCATION" sectionKey="location" />
          {isExpanded('location') && (
            <>
              <TextInput
                value={localLocation}
                onChangeText={setLocalLocation}
                onBlur={applyLocation}
                onSubmitEditing={applyLocation}
                placeholder="ZIP code or City, State"
                placeholderTextColor={colors.textMuted}
                style={[
                  s.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                returnKeyType="done"
              />

              <Text style={[s.subLabel, { color: colors.textMuted }]}>
                Search Radius
              </Text>
              <View style={s.chipRow}>
                {DISTANCE_OPTIONS.map((d) =>
                  chip(`${d} mi`, filters.distance === d, () =>
                    setFilters({ distance: d }),
                  ),
                )}
              </View>
            </>
          )}

          {/* ─── Sort ─────────────────────────────────────────── */}
          <SectionHeader title="SORT BY" sectionKey="sort" />
          {isExpanded('sort') && (
            <View style={s.chipRow}>
              {SORT_OPTIONS.map((opt) =>
                chip(opt.label, filters.sort === opt.value, () =>
                  setFilters({ sort: opt.value as any }),
                ),
              )}
            </View>
          )}

          {/* ─── Animal Type ──────────────────────────────────── */}
          <SectionHeader title="ANIMAL TYPE" sectionKey="type" />
          {isExpanded('type') && (
            <View style={s.chipRow}>
              {chip('All Types', filters.type === null, () =>
                setFilters({ type: null, breed: null }),
              )}
              {ALL_SPECIES.map((sp) =>
                chip(sp, filters.type === sp, () =>
                  setFilters({ type: sp, breed: null }),
                  SPECIES_EMOJI[sp],
                ),
              )}
            </View>
          )}

          {/* ─── Breed (only when species selected) ───────────── */}
          {filters.type && (
            <>
              <SectionHeader title="BREED" sectionKey="breed" />
              {isExpanded('breed') && (
                <View>
                  {/* Search breeds */}
                  <View style={[s.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Search size={16} color={colors.textMuted} />
                    <TextInput
                      value={breedSearch}
                      onChangeText={setBreedSearch}
                      placeholder={`Search ${filters.type} breeds...`}
                      placeholderTextColor={colors.textMuted}
                      style={[s.searchInput, { color: colors.text }]}
                    />
                    {breedSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setBreedSearch('')}>
                        <X size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Selected breed */}
                  {filters.breed && (
                    <View style={s.selectedBreedRow}>
                      <Text style={[s.selectedBreed, { color: colors.primary }]}>
                        Selected: {filters.breed}
                      </Text>
                      <TouchableOpacity onPress={() => setFilters({ breed: null })}>
                        <X size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {breedsLoading ? (
                    <ActivityIndicator style={{ padding: 16 }} color={colors.primary} />
                  ) : (
                    <View style={s.breedList}>
                      {filteredBreeds.slice(0, 50).map((breed) => (
                        <TouchableOpacity
                          key={breed}
                          onPress={() => {
                            setFilters({ breed });
                            setBreedSearch('');
                          }}
                          style={[
                            s.breedItem,
                            {
                              backgroundColor:
                                filters.breed === breed
                                  ? colors.primaryDim
                                  : 'transparent',
                              borderColor:
                                filters.breed === breed
                                  ? colors.primary
                                  : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.breedText,
                              {
                                color:
                                  filters.breed === breed
                                    ? colors.primary
                                    : colors.text,
                              },
                            ]}
                          >
                            {breed}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {filteredBreeds.length > 50 && (
                        <Text style={[s.moreText, { color: colors.textMuted }]}>
                          +{filteredBreeds.length - 50} more — type to narrow down
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* ─── Age ──────────────────────────────────────────── */}
          <SectionHeader title="AGE" sectionKey="age" />
          {isExpanded('age') && (
            <View style={s.chipRow}>
              {chip('Any Age', filters.age === null, () =>
                setFilters({ age: null }),
              )}
              {AGES.map((a) =>
                chip(a, filters.age === a, () => setFilters({ age: a })),
              )}
            </View>
          )}

          {/* ─── Size ─────────────────────────────────────────── */}
          <SectionHeader title="SIZE" sectionKey="size" />
          {isExpanded('size') && (
            <View style={s.chipRow}>
              {chip('Any Size', filters.size === null, () =>
                setFilters({ size: null }),
              )}
              {SIZES.map((sz) =>
                chip(sz, filters.size === sz, () => setFilters({ size: sz })),
              )}
            </View>
          )}

          {/* ─── Gender ───────────────────────────────────────── */}
          <SectionHeader title="GENDER" sectionKey="gender" />
          {isExpanded('gender') && (
            <View style={s.chipRow}>
              {chip('Any', filters.gender === null, () =>
                setFilters({ gender: null }),
              )}
              {GENDERS.map((g) =>
                chip(g, filters.gender === g, () => setFilters({ gender: g })),
              )}
            </View>
          )}

          {/* ─── Coat ─────────────────────────────────────────── */}
          <SectionHeader title="COAT LENGTH" sectionKey="coat" />
          {isExpanded('coat') && (
            <View style={s.chipRow}>
              {chip('Any', filters.coat === null, () =>
                setFilters({ coat: null }),
              )}
              {COATS.map((c) =>
                chip(c, filters.coat === c, () => setFilters({ coat: c })),
              )}
            </View>
          )}

          {/* ─── Color ────────────────────────────────────────── */}
          <SectionHeader title="COLOR" sectionKey="color" />
          {isExpanded('color') && (
            <View>
              <TextInput
                value={filters.color ?? ''}
                onChangeText={(v) => setFilters({ color: v || null })}
                placeholder="e.g. White, Black, Brown, Tan..."
                placeholderTextColor={colors.textMuted}
                style={[
                  s.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>
          )}

          {/* ─── Compatibility ────────────────────────────────── */}
          <SectionHeader title="COMPATIBILITY" sectionKey="compat" />
          {isExpanded('compat') && (
            <View>
              {toggle('Good with children', filters.goodWithChildren, 'goodWithChildren')}
              {toggle('Good with dogs', filters.goodWithDogs, 'goodWithDogs')}
              {toggle('Good with cats', filters.goodWithCats, 'goodWithCats')}
              {toggle('House trained', filters.houseTrained, 'houseTrained')}
              {toggle('Special needs', filters.specialNeeds, 'specialNeeds')}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Apply button */}
        <View style={[s.footer, { borderTopColor: colors.divider }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[s.applyBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={s.applyText}>Show Results</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  sheet: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.lg,
  },
  title: { ...typography.h3 },
  resetBtn: { ...typography.captionBold },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.captionBold,
    letterSpacing: 1.2,
  },
  subLabel: {
    ...typography.caption,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 14, marginRight: 4 },
  chipLabel: { ...typography.caption, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...typography.body,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, padding: 0 },
  selectedBreedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: 4,
  },
  selectedBreed: { ...typography.bodyBold },
  breedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    maxHeight: 240,
  },
  breedItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  breedText: { ...typography.caption },
  moreText: { ...typography.small, paddingVertical: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toggleLabel: { ...typography.body },
  toggleIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
  },
  applyBtn: {
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  applyText: { color: '#FFF', ...typography.button },
});
