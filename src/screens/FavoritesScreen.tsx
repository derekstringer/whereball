import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { Heart, Trash2 } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/appStore';
import type { FavoritePet } from '../types';
import { spacing, typography, radii, shadows } from '../styles/tokens';

export const FavoritesScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const favorites = useAppStore((s) => s.favorites);
  const removeFavorite = useAppStore((s) => s.removeFavorite);

  const renderItem = ({ item }: { item: FavoritePet }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PetDetail', { petId: item.pet_id })}
      activeOpacity={0.85}
      style={[
        s.card,
        shadows.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {item.pet_photo_url ? (
        <Image source={{ uri: item.pet_photo_url }} style={s.photo} />
      ) : (
        <View style={[s.photo, s.noPhoto, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 28 }}>🐾</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>
          {item.pet_name}
        </Text>
        <Text style={[s.breed, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.pet_breed ?? item.pet_species}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => removeFavorite(item.pet_id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={s.removeBtn}
      >
        <Trash2 size={18} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Favorites</Text>
        <Text style={[s.count, { color: colors.textMuted }]}>
          {favorites.length} saved
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={s.empty}>
          <Heart size={48} color={colors.accent} />
          <Text style={[s.emptyTitle, { color: colors.text }]}>No favorites yet</Text>
          <Text style={[s.emptyMsg, { color: colors.textSecondary }]}>
            Tap the heart on any pet to save them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
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
  count: { ...typography.caption, marginTop: 2 },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photo: { width: 80, height: 80 },
  noPhoto: { justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, paddingHorizontal: spacing.md },
  name: { ...typography.bodyBold },
  breed: { ...typography.caption, marginTop: 2 },
  removeBtn: { paddingHorizontal: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  emptyTitle: { ...typography.h3 },
  emptyMsg: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.xxl },
});
