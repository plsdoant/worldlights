import type { MapOptions } from 'maplibre-gl'

// MapLibre doesn't re-export the style-spec types, so derive them from the map options.
type StyleSpecification = Exclude<MapOptions['style'], string | undefined>
type LayerSpecification = StyleSpecification['layers'][number]
type SymbolLayout = NonNullable<Extract<LayerSpecification, { type: 'symbol' }>['layout']>

/**
 * A cool, dark "night side" palette. The light-pollution data will be drawn in warm
 * colours on top, so the basemap stays low-contrast and blue-grey on purpose.
 */
export const palette = {
  space: '#02040a',
  ocean: '#050a15',
  land: '#0f1725',
  coastline: '#1d2b44',
  river: '#08101e',
  building: '#141e2f',
  roadMinor: '#152032',
  roadMajor: '#182439',
  roadHighway: '#1d2b47',
  stateBorder: '#1f2b40',
  countryBorder: '#34445f',
  labelHalo: 'rgba(4, 8, 16, 0.85)',
  labelWater: '#2f4468',
  labelCountry: '#7a8aa6',
  labelCity: '#a9b6ca',
  labelTown: '#7f8ba0',
  labelMinor: '#5f6b80',
  horizon: '#16233d',
} as const

const SOURCE = 'openmaptiles'
const FONT_REGULAR = ['Noto Sans Regular']
const FONT_ITALIC = ['Noto Sans Italic']

// Prefer English names, then any Latin-script name, then the local name.
const NAME: SymbolLayout['text-field'] = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]

/**
 * Id of the lowest label layer. Data layers (e.g. light pollution) should be inserted
 * before it, so they sit above land, water and borders but below all text.
 */
export const firstLabelLayerId = 'label-water'

export const basemapStyle: StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sky: {
    'sky-color': palette.space,
    'horizon-color': palette.horizon,
    'fog-color': palette.space,
    'sky-horizon-blend': 0.5,
    'atmosphere-blend': 0.9,
  },
  // The atmosphere shader treats this as the sun. Anchored to the viewport and placed
  // behind the globe, it leaves the whole visible disc on the night side, with a thin
  // sunrise crescent along the upper-left edge that stays put as the globe turns.
  light: { anchor: 'viewport', position: [1.15, 210, 30] },
  sources: {
    // OpenFreeMap: free OpenMapTiles-schema vector tiles, no API key needed.
    [SOURCE]: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    { id: 'land', type: 'background', paint: { 'background-color': palette.land } },
    {
      id: 'water',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'water',
      filter: ['!=', ['get', 'brunnel'], 'tunnel'],
      paint: { 'fill-color': palette.ocean },
    },
    {
      id: 'coastline',
      type: 'line',
      source: SOURCE,
      'source-layer': 'water',
      filter: ['==', ['get', 'class'], 'ocean'],
      paint: {
        'line-color': palette.coastline,
        'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 6, 0.9, 14, 1.5],
      },
    },
    {
      id: 'rivers',
      type: 'line',
      source: SOURCE,
      'source-layer': 'waterway',
      minzoom: 8,
      filter: ['==', ['get', 'class'], 'river'],
      paint: {
        'line-color': palette.river,
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 8, 0.6, 14, 3, 18, 10],
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-color': palette.building,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 1],
      },
    },
    {
      id: 'roads-minor',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['match', ['get', 'class'], ['minor', 'service'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': palette.roadMinor,
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 0.5, 18, 9],
      },
    },
    {
      id: 'roads-major',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 7,
      filter: ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': palette.roadMajor,
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 7, 0.4, 12, 1.4, 18, 14],
      },
    },
    {
      id: 'roads-highway',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 5,
      filter: ['match', ['get', 'class'], ['motorway', 'trunk'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': palette.roadHighway,
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 0.4, 10, 1.4, 18, 18],
      },
    },
    {
      id: 'boundary-state',
      type: 'line',
      source: SOURCE,
      'source-layer': 'boundary',
      minzoom: 3,
      filter: ['all', ['==', ['get', 'admin_level'], 4], ['==', ['get', 'maritime'], 0]],
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': palette.stateBorder,
        'line-dasharray': [3, 2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 10, 1.2],
      },
    },
    {
      id: 'boundary-country',
      type: 'line',
      source: SOURCE,
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['==', ['get', 'maritime'], 0], ['==', ['get', 'disputed'], 0]],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': palette.countryBorder,
        'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 4, 0.9, 10, 1.6],
      },
    },
    {
      id: 'boundary-disputed',
      type: 'line',
      source: SOURCE,
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['==', ['get', 'maritime'], 0], ['==', ['get', 'disputed'], 1]],
      paint: {
        'line-color': palette.countryBorder,
        'line-dasharray': [2, 2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 4, 0.9, 10, 1.6],
      },
    },

    // Labels. Later layers win label collisions, so the most important ones come last.
    {
      id: 'label-water',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'water_name',
      maxzoom: 8,
      filter: [
        'all',
        ['==', ['geometry-type'], 'Point'],
        ['match', ['get', 'class'], ['ocean', 'sea'], true, false],
        // Just the oceans on the whole-globe view; seas and gulfs once zoomed in a bit.
        ['any', ['>=', ['zoom'], 4], ['in', 'Ocean', ['coalesce', ['get', 'name:en'], ['get', 'name']]]],
      ],
      layout: {
        'text-field': NAME,
        'text-font': FONT_ITALIC,
        'text-size': ['interpolate', ['linear'], ['zoom'], 0, 10, 6, 13],
        'text-letter-spacing': 0.25,
        'text-max-width': 6,
      },
      paint: { 'text-color': palette.labelWater },
    },
    {
      id: 'label-road',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'transportation_name',
      minzoom: 13,
      layout: {
        'symbol-placement': 'line',
        'text-field': NAME,
        'text-font': FONT_REGULAR,
        'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 18, 13],
      },
      paint: { 'text-color': palette.labelMinor, 'text-halo-color': palette.labelHalo, 'text-halo-width': 1.2 },
    },
    {
      id: 'label-neighbourhood',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 12,
      filter: ['match', ['get', 'class'], ['suburb', 'quarter', 'neighbourhood'], true, false],
      layout: {
        'text-field': NAME,
        'text-font': FONT_REGULAR,
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 12],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
        'text-max-width': 8,
      },
      paint: { 'text-color': palette.labelMinor, 'text-halo-color': palette.labelHalo, 'text-halo-width': 1.2 },
    },
    {
      id: 'label-village',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 11,
      filter: ['match', ['get', 'class'], ['village', 'hamlet'], true, false],
      layout: {
        'text-field': NAME,
        'text-font': FONT_REGULAR,
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 16, 13],
        'text-max-width': 8,
      },
      paint: { 'text-color': palette.labelTown, 'text-halo-color': palette.labelHalo, 'text-halo-width': 1.2 },
    },
    {
      id: 'label-town',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 8,
      filter: ['==', ['get', 'class'], 'town'],
      layout: {
        'text-field': NAME,
        'text-font': FONT_REGULAR,
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 15],
        'text-max-width': 8,
      },
      paint: { 'text-color': palette.labelTown, 'text-halo-color': palette.labelHalo, 'text-halo-width': 1.2 },
    },
    {
      id: 'label-city',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 3,
      // Rank 1 is the biggest cities; reveal smaller ones as you zoom in.
      filter: ['all', ['==', ['get', 'class'], 'city'], ['<=', ['get', 'rank'], ['step', ['zoom'], 2, 4, 4, 5, 7, 6, 99]]],
      layout: {
        'symbol-sort-key': ['get', 'rank'],
        'text-field': NAME,
        'text-font': FONT_REGULAR,
        'text-size': [
          'interpolate', ['linear'], ['zoom'],
          3, ['step', ['get', 'rank'], 12, 3, 11],
          10, ['step', ['get', 'rank'], 17, 3, 15, 6, 13],
        ],
        'text-max-width': 8,
      },
      paint: { 'text-color': palette.labelCity, 'text-halo-color': palette.labelHalo, 'text-halo-width': 1.2 },
    },
    {
      id: 'label-country',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      maxzoom: 8,
      // Only the major countries on the whole-globe view, the rest as you zoom in.
      filter: ['all', ['==', ['get', 'class'], 'country'], ['<=', ['get', 'rank'], ['step', ['zoom'], 1, 3, 2, 4, 4, 5, 99]]],
      layout: {
        'symbol-sort-key': ['get', 'rank'],
        'text-field': NAME,
        'text-font': FONT_REGULAR,
        'text-size': [
          'interpolate', ['linear'], ['zoom'],
          1, ['step', ['get', 'rank'], 10, 2, 9],
          6, ['step', ['get', 'rank'], 15, 2, 13, 4, 12],
        ],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.15,
        'text-max-width': 7,
      },
      paint: { 'text-color': palette.labelCountry, 'text-halo-color': palette.labelHalo, 'text-halo-width': 1 },
    },
  ],
}
