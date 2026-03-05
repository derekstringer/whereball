import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { usePetDetail } from '../hooks/usePets';
import { useAppStore } from '../store/appStore';
import { spacing, typography, radii, shadows } from '../styles/tokens';

const SCREEN_W = Dimensions.get('window').width;

export const PetDetailScreen = ({ route, navigation }: any) => {
  const { petId } = route.params;
  const { colors, isDark } = useTheme();
  const { data, isLoading, isError } = usePetDetail(petId);
  const isFav = useAppStore((s) => s.isFavorite(petId));
  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);

  if (isLoading) {
    return (
      <View style={[s.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[s.loading, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.danger }}>Failed to load pet details</Text>
      </View>
    );
  }

  const pet = data.animal;
  const breed = [pet.breeds.primary, pet.breeds.secondary].filter(Boolean).join(' / ') || 'Unknown';
  const address = pet.contact.address;
  const locationStr = [address.city, address.state].filter(Boolean).join(', ');

  const toggleFav = () => {
    if (isFav) {
      removeFavorite(pet.id);
    } else {
      addFavorite({
        id: `${pet.id}-${Date.now()}`,
        user_id: '',
        pet_id: pet.id,
        pet_name: pet.name,
        pet_photo_url: pet.photos[0]?.large ?? null,
        pet_species: pet.type,
        pet_breed: breed,
        organization_name: null,
        saved_at: new Date().toISOString(),
        notes: null,
      });
    }
  };

  const InfoPill = ({ label, value }: { label: string; value: string }) => (
    <View style={[s.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.pillLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[s.pillValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  const AttrBadge = ({ label, active }: { label: string; active: boolean }) => (
    <View
      style={[
        s.attrBadge,
        {
          backgroundColor: active ? colors.primaryDim : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      {active && <Check size={12} color={colors.primary} strokeWidth={3} />}
      <Text style={[s.attrText, { color: active ? colors.primary : colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        {pet.photos.length > 0 ? (
          <FlatList
            data={pet.photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Image source={{ uri: item.large }} style={s.photo} />
            )}
          />
        ) : (
          <View style={[s.photo, s.noPhoto, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 72 }}>🐾</Text>
          </View>
        )}

        {/* Back + heart overlays */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.backBtn, { backgroundColor: colors.overlay }]}
        >
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleFav} style={[s.heartBtn, { backgroundColor: colors.overlay }]}>
          <Heart
            size={22}
            color={isFav ? colors.accent : '#FFF'}
            fill={isFav ? colors.accent : 'transparent'}
          />
        </TouchableOpacity>

        {/* Photo dots */}
        {pet.photos.length > 1 && (
          <View style={s.dots}>
            {pet.photos.map((_, i) => (
              <View
                key={i}
                style={[s.dot, { backgroundColor: i === 0 ? '#FFF' : 'rgba(255,255,255,0.4)' }]}
              />
            ))}
          </View>
        )}

        {/* Content */}
        <View style={s.content}>
          {/* Name + breed */}
          <Text style={[s.name, { color: colors.text }]}>{pet.name}</Text>
          <Text style={[s.breed, { color: colors.textSecondary }]}>{breed}</Text>

          {/* Location */}
          {locationStr && (
            <View style={s.locRow}>
              <MapPin size={14} color={colors.primary} />
              <Text style={[s.locText, { color: colors.textSecondary }]}>
                {locationStr}
                {pet.distance != null ? ` · ${Math.round(pet.distance)} mi away` : ''}
              </Text>
            </View>
          )}

          {/* Quick info pills */}
          <View style={s.pillRow}>
            <InfoPill label="Age" value={pet.age} />
            <InfoPill label="Gender" value={pet.gender} />
            <InfoPill label="Size" value={pet.size} />
            {pet.coat && <InfoPill label="Coat" value={pet.coat} />}
          </View>

          {/* Attributes */}
          <Text style={[s.sectionTitle, { color: colors.text }]}>About</Text>
          <View style={s.attrRow}>
            <AttrBadge label="Spayed/Neutered" active={pet.attributes.spayed_neutered} />
            <AttrBadge label="House Trained" active={pet.attributes.house_trained} />
            <AttrBadge label="Shots Current" active={pet.attributes.shots_current} />
            <AttrBadge label="Special Needs" active={pet.attributes.special_needs} />
          </View>

          {/* Environment */}
          <Text style={[s.sectionTitle, { color: colors.text }]}>Good With</Text>
          <View style={s.attrRow}>
            <AttrBadge label="Children" active={pet.environment.children === true} />
            <AttrBadge label="Dogs" active={pet.environment.dogs === true} />
            <AttrBadge label="Cats" active={pet.environment.cats === true} />
          </View>

          {/* Description */}
          {pet.description && (
            <>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[s.description, { color: colors.textSecondary }]}>
                {pet.description.replace(/<[^>]*>/g, '')}
              </Text>
            </>
          )}

          {/* Contact */}
          <Text style={[s.sectionTitle, { color: colors.text }]}>Contact</Text>
          <View style={s.contactCol}>
            {pet.contact.phone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${pet.contact.phone}`)}
                style={[s.contactRow, { borderColor: colors.border }]}
              >
                <Phone size={18} color={colors.primary} />
                <Text style={[s.contactText, { color: colors.text }]}>
                  {pet.contact.phone}
                </Text>
              </TouchableOpacity>
            )}
            {pet.contact.email && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${pet.contact.email}`)}
                style={[s.contactRow, { borderColor: colors.border }]}
              >
                <Mail size={18} color={colors.primary} />
                <Text style={[s.contactText, { color: colors.text }]}>
                  {pet.contact.email}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          s.cta,
          {
            backgroundColor: colors.bg,
            borderTopColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => Linking.openURL(pet.url)}
          style={[s.ctaBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={s.ctaBtnText}>View Adoption Info</Text>
          <ExternalLink size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photo: { width: SCREEN_W, height: SCREEN_W * 0.85 },
  noPhoto: { justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    position: 'absolute',
    top: SCREEN_W * 0.85 - 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  content: { padding: spacing.xl },
  name: { ...typography.h1, marginBottom: 2 },
  breed: { ...typography.body, marginBottom: spacing.sm },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.lg },
  locText: { ...typography.caption },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillLabel: { ...typography.small, marginBottom: 2 },
  pillValue: { ...typography.bodyBold },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md, marginTop: spacing.lg },
  attrRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  attrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  attrText: { ...typography.caption },
  description: { ...typography.body, lineHeight: 24 },
  contactCol: { gap: spacing.sm },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  contactText: { ...typography.body },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
    borderTopWidth: 1,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radii.md,
  },
  ctaBtnText: { color: '#FFF', ...typography.button },
});
