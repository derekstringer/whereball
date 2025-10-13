import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  SectionList,
  SectionListData,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAppStore } from "../../store/appStore";
import { getGamesForDate, type NHLGame } from "../../lib/nhl-api";
import { DateHeader } from "../../components/daily-v2/DateHeader";
import { VerticalGameCard } from "../../components/daily-v2/VerticalGameCard";
import { VerticalGameCardExpanded } from "../../components/daily-v2/VerticalGameCardExpanded";
import { FilterBottomSheet } from "../../components/ui/FilterBottomSheet";
import { SettingsScreen } from "../settings/SettingsScreen";

/** ---------- CONSTANT SIZING (ADJUST TO YOUR REALS) ---------- */
const TOP_BAR_HEIGHT = 64;            // your app header (title + Go To Today)
const SECTION_HEADER_HEIGHT = 44;     // height of DateHeader
const ROW_HEIGHT = 96;                // collapsed card height used for measurement
const LIST_HEADER_HEIGHT = 48;        // "Load Earlier" button
const LIST_FOOTER_HEIGHT = 48;        // "Load More" button

/** ---------- TYPES ---------- */
interface CachedDate {
  date: string; // YYYY-MM-DD
  games: NHLGame[];
  loaded: boolean;
}
interface GameSection {
  title: string; // YYYY-MM-DD
  date: Date;
  isToday: boolean;
  data: NHLGame[];
}

/** ---------- UTIL ---------- */
const formatDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const todayKey = () => formatDateKey(new Date());

/** ---------- COMPONENT ---------- */
export const DailyV2: React.FC = () => {
  const { colors } = useTheme();
  const { subscriptions, expandedGameIdBySport, setExpandedGameId } = useAppStore();

  const [gamesCache, setGamesCache] = useState<Map<string, CachedDate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const sectionListRef = useRef<SectionList<NHLGame, GameSection>>(null);

  const userServiceCodes = subscriptions.map((s) => s.service_code);
  const expandedGameId = expandedGameIdBySport?.["NHL"] || null;

  /** ------------ INITIAL LOAD: today ±30 days ------------ */
  React.useEffect(() => {
    const init = async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      const end = new Date(now);
      end.setDate(end.getDate() + 30);

      const current = new Date(start);
      const promises: Promise<void>[] = [];
      while (current <= end) {
        const key = formatDateKey(current);
        promises.push(
          getGamesForDate(new Date(current)).then((games) => {
            setGamesCache((prev) => {
              const next = new Map(prev);
              next.set(key, { date: key, games, loaded: true });
              return next;
            });
          }).catch(() => {
            setGamesCache((prev) => {
              const next = new Map(prev);
              next.set(key, { date: key, games: [], loaded: true });
              return next;
            });
          })
        );
        current.setDate(current.getDate() + 1);
      }
      await Promise.all(promises);
      setLoading(false);
    };
    init();
  }, []);

  /** ------------ BUILD SECTIONS (stable sort) ------------ */
  const sections: GameSection[] = useMemo(() => {
    const keys = Array.from(gamesCache.keys()).sort(); // YYYY-MM-DD sorts lexicographically by date
    const tKey = todayKey();
    return keys.map((k) => {
      const cached = gamesCache.get(k);
      return {
        title: k,
        date: new Date(`${k}T12:00:00`),
        isToday: k === tKey,
        data: cached?.games ?? [],
      };
    });
  }, [gamesCache]);

  /** ------------ PRECOMPUTE COMPOSITE INDICES/OFFSETS ------------ 
   * SectionList's internal "index" flattens headers + items.
   * For each section i:
   *   baseIndex[i] = index of that section's HEADER in the flat list
   *   baseOffset[i] = pixel offset to that HEADER (accounts for list header)
   */
  const flatMeta = useMemo(() => {
    // number of "rows" above the first section = 1 list header
    let runningIndex = 0;
    let runningOffset = 0;

    // account for ListHeaderComponent first
    runningIndex += 1;                 // 1 synthetic row
    runningOffset += LIST_HEADER_HEIGHT;

    const baseIndex: number[] = [];
    const baseOffset: number[] = [];
    const counts: number[] = [];       // items per section

    sections.forEach((section) => {
      baseIndex.push(runningIndex);
      baseOffset.push(runningOffset);

      // header row
      runningIndex += 1;
      runningOffset += SECTION_HEADER_HEIGHT;

      // items
      const n = section.data.length;
      counts.push(n);
      runningIndex += n;
      runningOffset += n * ROW_HEIGHT;
    });

    // Optionally include ListFooter if you want exact total height; not required for getItemLayout.
    return { baseIndex, baseOffset, counts };
  }, [sections]);

  /** ------------ getItemLayout (deterministic measurement) ------------ */
  const getItemLayout = useCallback(
    (_: any, index: number) => {
      // Handle the synthetic ListHeader row at index 0
      if (index === 0) {
        return { length: LIST_HEADER_HEIGHT, offset: 0, index };
      }

      // Find which section this flat index belongs to by scanning baseIndex
      const { baseIndex, baseOffset, counts } = flatMeta;
      // binary search is overkill for 60 days; linear scan is fine
      let sec = 0;
      for (let i = 0; i < baseIndex.length; i++) {
        if (baseIndex[i] <= index) sec = i;
        else break;
      }

      const secBaseIdx = baseIndex[sec];      // header index for this section
      const secBaseOff = baseOffset[sec];     // header offset for this section

      if (index === secBaseIdx) {
        // header row
        return { length: SECTION_HEADER_HEIGHT, offset: secBaseOff, index };
      }

      // item inside the section
      const localItemIdx = index - secBaseIdx - 1; // 0-based inside section
      // guard
      const maxItem = Math.max(0, counts[sec] - 1);
      const clamped = Math.min(Math.max(localItemIdx, 0), maxItem);

      const offset =
        secBaseOff + SECTION_HEADER_HEIGHT + clamped * ROW_HEIGHT;

      return { length: ROW_HEIGHT, offset, index };
    },
    [flatMeta]
  );

  /** ------------ Initial index (first item of today's section) ------------ */
  const initialScrollIndex = useMemo(() => {
    const todaySec = sections.findIndex((s) => s.isToday);
    if (todaySec < 0) return 0; // default to beginning if not found
    // jump to the FIRST ITEM in the section if any; if empty, jump to the header
    const hasItems = (sections[todaySec].data?.length ?? 0) > 0;
    const flatIndex = hasItems
      ? flatMeta.baseIndex[todaySec] + 1
      : flatMeta.baseIndex[todaySec];
    return Math.max(0, flatIndex);
  }, [sections, flatMeta]);

  /** ------------ Renderers ------------ */
  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<NHLGame, GameSection> }) => (
      <View style={{ height: SECTION_HEADER_HEIGHT, justifyContent: "center" }}>
        <DateHeader date={section.date} isToday={section.isToday} />
      </View>
    ),
    []
  );

  const handleGamePress = useCallback(
    (id: string) => setExpandedGameId?.("NHL", id),
    [setExpandedGameId]
  );

  const renderItem = useCallback(
    ({ item }: { item: NHLGame }) => {
      const isExpanded = expandedGameId === item.id;
      if (isExpanded) {
        return (
          <View style={{ height: ROW_HEIGHT }}>
            <VerticalGameCardExpanded
              game={item}
              userServiceCodes={userServiceCodes}
              onCollapse={() => setExpandedGameId?.("NHL", null)}
            />
          </View>
        );
      }
      return (
        <View style={{ height: ROW_HEIGHT }}>
          <VerticalGameCard
            game={item}
            userServiceCodes={userServiceCodes}
            onPress={() => handleGamePress(item.id)}
          />
        </View>
      );
    },
    [expandedGameId, handleGamePress, setExpandedGameId, userServiceCodes]
  );

  /** ------------ Go To Today (reliable jump) ------------ */
  const scrollToToday = useCallback(() => {
    const sec = sections.findIndex((s) => s.isToday);
    if (sec < 0) return;

    // Prefer first item; if none, go to header
    const hasItems = (sections[sec].data?.length ?? 0) > 0;
    const itemIndex = hasItems ? 0 : -1; // -1 means header (we'll request header)

    if (sectionListRef.current) {
      // SectionList knows sections; use scrollToLocation with proper viewOffset
      sectionListRef.current.scrollToLocation({
        sectionIndex: sec,
        itemIndex: Math.max(itemIndex, 0),
        viewPosition: 0, // align to top
        // offset top so the sticky header doesn't cover first row
        viewOffset: TOP_BAR_HEIGHT + (hasItems ? 0 : 0),
        animated: true,
      });
    }
  }, [sections]);

  /** Handle rare failures (mismatch) by retrying after a frame */
  const onScrollToIndexFailed = useCallback((info: any) => {
    requestAnimationFrame(() => {
      try {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: 0,
          itemIndex: 0,
          animated: true,
          viewPosition: 0,
        });
      } catch {}
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 8 }}>Loading games…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top App Bar */}
      <View
        style={[
          styles.topBar,
          { height: TOP_BAR_HEIGHT, backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={[styles.icon, { color: colors.text }]}>☰</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>WhereBall</Text>
          <TouchableOpacity onPress={scrollToToday}>
            <Text style={[styles.link, { color: colors.primary }]}>Go To Today</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Text style={[styles.icon, { color: colors.text }]}>🎚️</Text>
        </TouchableOpacity>
      </View>

      <SectionList<NHLGame, GameSection>
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        // Deterministic layout = no flicker + reliable jumps
        getItemLayout={getItemLayout}
        initialScrollIndex={initialScrollIndex}
        onScrollToIndexFailed={onScrollToIndexFailed}
        // Keep it smooth and full height
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: LIST_FOOTER_HEIGHT,
        }}
        removeClippedSubviews={false}
        windowSize={12}
        ListHeaderComponent={
          <View style={{ height: LIST_HEADER_HEIGHT, alignItems: "center", justifyContent: "center" }}>
            <TouchableOpacity
              onPress={() => {
                // no-op in this sample; wire your "load earlier 14 days" here if needed
              }}
            >
              <Text style={{ color: colors.primary }}>Load Earlier (14 days)</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <View style={{ height: LIST_FOOTER_HEIGHT, alignItems: "center", justifyContent: "center" }}>
            <TouchableOpacity
              onPress={() => {
                // no-op in this sample; wire your "load more 14 days" here if needed
              }}
            >
              <Text style={{ color: colors.primary }}>Load More (14 days)</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <FilterBottomSheet visible={showFilters} onClose={() => setShowFilters(false)} />
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </Modal>
    </SafeAreaView>
  );
};

/** ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 16,
  },
  icon: { fontSize: 20 },
  titleWrap: { flex: 1, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  link: { fontSize: 14, marginTop: 2 },
});
