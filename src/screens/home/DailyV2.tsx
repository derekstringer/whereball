/**
 * DailyV2 Screen - Vertical Infinite Scroll (Apple Calendar style)
 * Stable SectionList with debounced header rendering to prevent flicker
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  SafeAreaView,
  SectionList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  InteractionManager,
  Modal,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { getGamesForDate, NHLGame } from "../../lib/nhl-api";
import { DateHeader } from "../../components/daily-v2/DateHeader";
import { VerticalGameCard } from "../../components/daily-v2/VerticalGameCard";
import { VerticalGameCardExpanded } from "../../components/daily-v2/VerticalGameCardExpanded";
import { useAppStore } from "../../store/appStore";
import { FilterBottomSheet } from "../../components/ui/FilterBottomSheet";
import { SettingsScreen } from "../settings/SettingsScreen";

const ITEM_HEIGHT = 95;
const HEADER_HEIGHT = 36;
const CACHE_WINDOW_DAYS = 30;

interface GameSection {
  title: string;
  date: Date;
  isToday: boolean;
  data: NHLGame[];
}

export const DailyV2: React.FC = () => {
  const { colors } = useTheme();
  const { subscriptions, expandedGameIdBySport, setExpandedGameId } = useAppStore();

  const sectionListRef = useRef<SectionList<NHLGame, GameSection>>(null);
  const hasScrolledToToday = useRef(false);
  const [gamesCache, setGamesCache] = useState<Record<string, NHLGame[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeHeader, setActiveHeader] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const userServiceCodes = subscriptions.map(s => s.service_code);

  // Dates setup
  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    (async () => {
      const start = new Date();
      start.setDate(start.getDate() - CACHE_WINDOW_DAYS);
      const end = new Date();
      end.setDate(end.getDate() + CACHE_WINDOW_DAYS);

      const cache: Record<string, NHLGame[]> = {};
      const cur = new Date(start);
      while (cur <= end) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
          cur.getDate()
        ).padStart(2, "0")}`;
        try {
          cache[key] = await getGamesForDate(new Date(cur));
        } catch {
          cache[key] = [];
        }
        cur.setDate(cur.getDate() + 1);
      }
      setGamesCache(cache);
      setLoading(false);
    })();
  }, []);

  const sections = useMemo((): GameSection[] => {
    const keys = Object.keys(gamesCache).sort();
    return keys.map((key) => ({
      title: key,
      date: new Date(key + "T12:00:00"),
      isToday: key === todayKey,
      data: gamesCache[key] ?? [],
    }));
  }, [gamesCache, todayKey]);

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const scrollToToday = useCallback(() => {
    const todayIndex = sections.findIndex((s) => s.title === todayKey);
    if (todayIndex < 0) return;
    InteractionManager.runAfterInteractions(() => {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: todayIndex,
        itemIndex: 0,
        animated: true,
      });
    });
  }, [sections, todayKey]);

  useEffect(() => {
    if (!loading && !hasScrolledToToday.current) {
      hasScrolledToToday.current = true;
      scrollToToday();
    }
  }, [loading, scrollToToday]);

  const renderSectionHeader = ({ section }: { section: GameSection }) => {
    // Show one sticky header at a time, debounce updates to prevent flicker
    if (activeHeader === section.title) {
      return <DateHeader date={section.date} isToday={section.isToday} />;
    }
    return null;
  };

  // Debounce visible section change (prevents flicker)
  const handleViewableItemsChanged = useRef(
    (() => {
      let timeout: NodeJS.Timeout | null = null;
      return ({ viewableItems }: any) => {
        if (!viewableItems?.length) return;
        const first = viewableItems.find((v: any) => v.section);
        if (!first) return;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          setActiveHeader(first.section.title);
        }, 80);
      };
    })()
  ).current;

  const renderItem = ({ item }: { item: NHLGame }) => {
    const expandedGameId = expandedGameIdBySport?.['NHL'] || null;
    const isExpanded = expandedGameId === item.id;
    
    const handleGamePress = (gameId: string) => {
      if (expandedGameId === gameId) {
        setExpandedGameId?.('NHL', null);
      } else {
        setExpandedGameId?.('NHL', gameId);
      }
    };

    return isExpanded ? (
      <VerticalGameCardExpanded
        game={item}
        onCollapse={() => setExpandedGameId?.('NHL', null)}
        userServiceCodes={userServiceCodes}
      />
    ) : (
      <VerticalGameCard
        game={item}
        userServiceCodes={userServiceCodes}
        onPress={() => handleGamePress(item.id)}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading games…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: colors.text }]}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>WhereBall</Text>
          <TouchableOpacity onPress={scrollToToday} activeOpacity={0.7}>
            <Text style={styles.goToToday}>Go To Today</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterIcon, { color: colors.text }]}>🎚️</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        ref={sectionListRef}
        sections={sections}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        getItemLayout={getItemLayout}
        initialNumToRender={15}
        windowSize={10}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
          minimumViewTime: 50,
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            sectionListRef.current?.scrollToLocation({
              sectionIndex: info.highestMeasuredFrameIndex,
              itemIndex: 0,
              animated: false,
            });
          }, 250);
        }}
      />

      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />

      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  goToToday: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D9FF',
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
