import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { MapPin, Phone, Globe, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useShelterSearch } from '../hooks/usePets';
import type { Organization } from '../types';
import { spacing, typography, radii, shadows } from '../styles/tokens';

export const SheltersScreen = () => {
  const { colors } = useTheme();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useShelterSearch();

  const shelters = data?.pages.flatMap((p) => p.organizations) ?? [];

  const renderShelter = useCallback(
    ({ item }: { item: Organization }) => {
      const addr = [item.address.city, item.address.state].filter(Boolean).join(', ');
      return (
        <View
          style={[
            s.card,
            shadows.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[s.name, { color: colors.text }]}>{item.name}</Text>

          {addr && (
            <View style={s.row}>
              <MapPin size={14} color={colors.primary} />
              <Text style={[s.meta, { color: colors.textSecondary }]}>
                {addr}
                {item.distance != null ? ` · ${Math.round(item.distance)} mi` : ''}
              </Text>
            </View>
          )}

          {item.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
              style={s.row}
            >
              <Phone size={14} color={colors.primary} />
              <Text style={[s.meta, { color: colors.textSecondary }]}>{item.phone}</Text>
            </TouchableOpacity>
          )}

          {item.website && (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.website!)}
              style={s.row}
            >
              <Globe size={14} color={colors.primary} />
              <Text
                style={[s.meta, { color: colors.primary }]}
                numberOfLines={1}
              >
                Visit Website
              </Text>
            </TouchableOpacity>
          )}

          {item.mission_statement && (
            <Text
              style={[s.mission, { color: colors.textMuted }]}
              numberOfLines={3}
            >
              {item.mission_statement}
            </Text>
          )}
        </View>
      );
    },
    [colors],
  );

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Shelters Nearby</Text>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={shelters}
          keyExtractor={(item) => item.id}
          renderItem={renderShelter}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
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
              <ActivityIndicator style={{ padding: 20 }} color={colors.primary} />
            ) : null
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={[s.emptyText, { color: colors.textMuted }]}>
                No shelters found in this area
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2 },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  name: { ...typography.h3, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { ...typography.caption, flex: 1 },
  mission: { ...typography.caption, marginTop: spacing.sm, fontStyle: 'italic' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { ...typography.body },
});
