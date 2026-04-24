const TOXIC_GENERA = [
  'toxicodendron', 'rhus',
  'lilium', 'hemerocallis',
  'convallaria',
  'taxus',
  'rhododendron', 'azalea',
  'cycas',
  'nerium',
  'aconitum',
  'digitalis',
  'euphorbia',
  'dieffenbachia',
  'philodendron',
  'epipremnum',
  'zantedeschia',
  'spathiphyllum',
  'hyacinthus',
  'narcissus',
  'tulipa',
  'iris',
  'cyclamen',
  'kalanchoe',
  'colchicum',
  'allium',
  'solanum',
  'brunfelsia',
  'ricinus',
  'lantana',
  'pieris',
  'ipomoea',
  'caladium',
  'dracaena',
  'aloe',
  'syngonium',
  'anthurium',
  'aglaonema',
  'arum',
  'veratrum',
  'delphinium',
  'laburnum',
  'wisteria',
  'sambucus',
  'prunus',
  'vinca',
  'lobelia',
  'nicotiana',
  'datura',
  'brugmansia',
  'conium',
  'atropa',
  'hyoscyamus',
  'colchicum',
  'gloriosa',
  'ornithogalum',
  'leucothoe',
  'kalmia',
  'lycoris',
  'amaryllis',
  'hippeastrum',
  'oxalis',
  'podocarpus',
];

const TOXIC_COMMON_KEYWORDS = [
  'poison ivy', 'poison oak', 'poison sumac',
  'sago palm',
  'death camas', 'death cap',
  'oleander',
  'yew',
  'foxglove',
  'monkshood', 'wolfsbane',
  'lily of the valley',
  'autumn crocus',
  'nightshade',
  'castor bean',
  'morning glory',
  'water hemlock', 'poison hemlock',
  'jimsonweed',
];

/**
 * Determines pet toxicity from scientific and common name without any API call.
 * @param {string} scientificName
 * @param {string} commonName
 * @returns {boolean}
 */
export function isPetToxic(scientificName, commonName) {
  const sci = (scientificName || '').toLowerCase();
  const common = (commonName || '').toLowerCase();

  for (const genus of TOXIC_GENERA) {
    if (sci.startsWith(genus)) return true;
  }

  for (const keyword of TOXIC_COMMON_KEYWORDS) {
    if (common.includes(keyword)) return true;
  }

  return false;
}
