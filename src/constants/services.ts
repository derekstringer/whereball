/**
 * Streaming Services Data
 * Seed data for MVP - includes deep-link schemes
 */

import { Service } from '../types';

export const STREAMING_SERVICES: Service[] = [
  {
    code: 'espn_plus',
    name: 'ESPN+',
    type: 'streaming',
    deep_link_scheme: 'espn://',
    channel_matrix: {
      channels: ['ESPN+'],
      notes: 'NHL games subject to blackout restrictions',
    },
    provider_lookup_url: 'https://www.espn.com/espnplus/',
  },
  {
    code: 'youtube_tv',
    name: 'YouTube TV',
    type: 'streaming',
    deep_link_scheme: 'https://tv.youtube.com',
    channel_matrix: {
      channels: ['ESPN', 'ESPN2', 'ESPNU', 'ABC', 'TNT', 'TBS', 'NHL Network'],
      notes: 'RSN availability varies by market',
    },
    provider_lookup_url: 'https://tv.youtube.com/welcome/',
  },
  {
    code: 'hulu_live',
    name: 'Hulu + Live TV',
    type: 'streaming',
    deep_link_scheme: 'hulu://',
    channel_matrix: {
      channels: ['ESPN', 'ESPN2', 'ABC', 'TNT', 'TBS'],
      notes: 'RSN availability varies by market',
    },
    provider_lookup_url: 'https://www.hulu.com/live-tv',
  },
  {
    code: 'fubo',
    name: 'Fubo',
    type: 'streaming',
    deep_link_scheme: 'fubo://',
    channel_matrix: {
      channels: ['ESPN', 'ESPN2', 'ABC', 'NHL Network'],
      notes: 'Many RSNs included',
    },
    provider_lookup_url: 'https://www.fubo.tv/',
  },
  {
    code: 'sling',
    name: 'Sling TV',
    type: 'streaming',
    deep_link_scheme: 'sling://',
    channel_matrix: {
      channels: ['ESPN', 'ESPN2', 'TNT', 'TBS'],
      notes: 'Orange + Blue required for all channels',
    },
    provider_lookup_url: 'https://www.sling.com/',
  },
  {
    code: 'directv_stream',
    name: 'DIRECTV STREAM',
    type: 'streaming',
    deep_link_scheme: 'directvstream://',
    channel_matrix: {
      channels: ['ESPN', 'ESPN2', 'ABC', 'TNT', 'TBS', 'NHL Network'],
      notes: 'RSN availability varies by package',
    },
    provider_lookup_url: 'https://www.directv.com/stream/',
  },
  {
    code: 'paramount_plus',
    name: 'Paramount+',
    type: 'streaming',
    deep_link_scheme: 'paramount://',
    channel_matrix: {
      channels: ['CBS'],
      notes: 'Live CBS in select markets',
    },
    provider_lookup_url: 'https://www.paramountplus.com/',
  },
  {
    code: 'max',
    name: 'Max',
    type: 'streaming',
    deep_link_scheme: 'max://',
    channel_matrix: {
      channels: ['TNT', 'TBS'],
      notes: 'Select NHL games',
    },
    provider_lookup_url: 'https://www.max.com/',
  },
  {
    code: 'prime_video',
    name: 'Prime Video',
    type: 'streaming',
    deep_link_scheme: 'primevideo://',
    channel_matrix: {
      channels: ['Prime Video Exclusive Games'],
      notes: 'Select NHL games',
    },
    provider_lookup_url: 'https://www.amazon.com/Prime-Video/',
  },
];

// National broadcasters that typically override RSNs
export const NATIONAL_CHANNELS = [
  'ESPN',
  'ESPN2',
  'ABC',
  'TNT',
  'TBS',
  'NHL Network',
  'NBCSN',
];

// Helper functions
export const getServiceByCode = (code: string): Service | undefined => {
  return STREAMING_SERVICES.find((service) => service.code === code);
};

export const getServicesByChannel = (channel: string): Service[] => {
  return STREAMING_SERVICES.filter((service) =>
    service.channel_matrix.channels.includes(channel)
  );
};

export const isNationalChannel = (channel: string): boolean => {
  return NATIONAL_CHANNELS.some((national) => channel.includes(national));
};
