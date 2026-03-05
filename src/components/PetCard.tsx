import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/appStore';
import type { Pet } from '../types';
import { radii, shadows, spacing, typography } from '../styles/tokens';

const CARD_GAP = spacing.md;
const SCREEN_PAD = spacing.lg;
const CARD_WIDTH =
  (Dimensions.get('window').width - SCREEN_PAD * 2 - CARD_GAP) / 2;

interface Props {
  pet: Pet;
  onPress: () => void;
}

export const PetCard: React.FC<Props> = ({ pet, onPress }) => {
  const { colors, isDark } = useTheme();
  const isFav = useAppStore((s) => s.isFavorite(pet.id));
  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);

  const photo = pet.photos[0]?.medium;
  const breed = pet.breeds.primary ?? 'Unknown breed';
  const distance =
    pet.distance != null ? `${Math.round(pet.distance)} mi` : null;

  const toggleFav = () => {
    if (isFav) {
      removeFavorite(pet.id);
    } else {
      addFavorite({
        id: `${pet.id}-${Date.now()}`,
        user_id: '',
        pet_id: pet.id,
        pet_name: pet.name,
        pet_photo_url: photo ?? null,
        pet_species: pet.type,
        pet_breed: breed,
        organization_name: null,
        saved_at: new Date().toISOString(),
        notes: null,
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        s.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          width: CARD_WIDTH,
        },
      ]}
    >
      {/* Image */}
      <View style={s.imageWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={s.image} />
        ) : (
          <View style={[s.image, s.placeholder, { backgroundColor: colors.surface }]}>
            <Text style={s.placeholderText}>🐾</Text>
          </View>
        )}

        {/* Heart */}
        <TouchableOpacity
          onPress={toggleFav}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={s.heartBtn}
        >
          <Heart
            size={22}
            color={isFav ? colors.accent : '#FFF'}
            fill={isFav ? colors.accent : 'transparent'}
            strokeWidth={2}
          />
        </TouchableOpacity>

        {/* Distance badge */}
        {distance && (
          <View style={s.distBadge}>
            <Text style={s.distText}>{distance}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>
          {pet.name}
        </Text>
        <Text style={[s.breed, { color: colors.textSecondary }]} numberOfLines={1}>
          {breed}
        </Text>
        <View style={s.meta}>
          <Text style={[s.metaText, { color: colors.textMuted }]}>
            {pet.age}
          </Text>
          <View style={[s.dot, { backgroundColor: colors.textMuted }]} />
          <Text style={[s.metaText, { color: colors.textMuted }]}>
            {pet.gender}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: CARD_GAP,
  },
  imageWrap: { position: 'relative' },
  image: {
    width: '100%',
    height: CARD_WIDTH * 1.1,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 40 },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  distText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  info: { padding: spacing.md },
  name: { ...typography.bodyBold, marginBottom: 2 },
  breed: { ...typography.caption, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { ...typography.small },
  dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 5 },
});
