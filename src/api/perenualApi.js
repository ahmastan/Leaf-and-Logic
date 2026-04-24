import { env } from '@/lib/env';

const BASE = env.perenual.apiUrl;
const API_KEY = env.perenual.apiKey;

function url(path, params = {}) {
  const u = new URL(`${BASE}${path.startsWith('/') ? path : `/${path}`}`);
  u.searchParams.set('key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') u.searchParams.set(k, String(v));
  });
  return u.toString();
}

/**
 * Search species by name (for care data after PlantNet identification).
 * @param {string} q - Search query (common or scientific name)
 * @returns {Promise<Array<{ id: number, common_name: string, scientific_name: string }>>}
 */
export async function searchSpecies(q) {
  if (!API_KEY) throw new Error('VITE_PERENUAL_API_KEY is not set in .env.local');
  const res = await fetch(url('/api/v2/species-list', { q, per_page: 5 }));
  if (!res.ok) throw new Error(`Perenual API error: ${res.status}`);
  const data = await res.json();
  const list = data.data || [];
  return list.map((s) => ({
    id: s.id,
    common_name: s.common_name || '',
    scientific_name: Array.isArray(s.scientific_name) ? s.scientific_name[0] : s.scientific_name || '',
  }));
}

/**
 * Get species details (care, description, watering, sunlight, etc.).
 * @param {number} speciesId - Perenual species ID
 * @returns {Promise<object>} Care and description fields for our app
 */
export async function getSpeciesDetails(speciesId) {
  if (!API_KEY) throw new Error('VITE_PERENUAL_API_KEY is not set in .env.local');
  const res = await fetch(url(`/api/v2/species/details/${speciesId}`));
  if (!res.ok) throw new Error(`Perenual API error: ${res.status}`);
  const s = await res.json();
  const sun = s.sunlight;
  const sunStr = Array.isArray(sun) ? sun.join(', ') : (sun || '');
  const watering = (s.watering || s.watering_general_benchmark?.value) ?? '';
  const descParts = [];
  if (watering) descParts.push(`Watering: ${watering}`);
  if (sunStr) descParts.push(`Sunlight: ${sunStr}`);
  if (s.care_level) descParts.push(`Care level: ${s.care_level}`);
  if (s.soil && (Array.isArray(s.soil) ? s.soil.length : s.soil)) {
    descParts.push(`Soil: ${Array.isArray(s.soil) ? s.soil.join(', ') : s.soil}`);
  }
  const description = descParts.length ? descParts.join('. ') : (s.description || 'No care details available.');
  return {
    common_name: s.common_name || '',
    scientific_name: Array.isArray(s.scientific_name) ? s.scientific_name[0] : s.scientific_name || '',
    plant_type: (s.type || 'houseplant').toLowerCase(),
    difficulty: mapCareLevel(s.care_level),
    sunlight: mapSunlight(sunStr),
    watering_interval_days: parseWateringDays(watering),
    humidity: 'medium',
    temperature_min: null,
    temperature_max: null,
    soil_type: Array.isArray(s.soil) ? s.soil[0] : s.soil || null,
    fertilize_interval_days: 30,
    toxicity_pets: !!s.poisonous_to_pets,
    toxicity_humans: !!s.poisonous_to_humans,
    pruning_notes: s.pruning_count ? `Pruning: ${s.pruning_count.amount} ${s.pruning_count.interval}` : null,
    description,
    image_url: s.default_image?.regular_url || s.default_image?.medium_url || null,
  };
}

function mapCareLevel(level) {
  if (!level) return 'easy';
  const l = String(level).toLowerCase();
  if (l.includes('low') || l.includes('easy')) return 'easy';
  if (l.includes('high') || l.includes('advanced')) return 'advanced';
  return 'moderate';
}

function mapSunlight(sun) {
  if (!sun) return 'medium';
  const s = String(sun).toLowerCase();
  if (s.includes('full sun') || s.includes('direct')) return 'direct';
  if (s.includes('shade') || s.includes('low')) return 'low';
  if (s.includes('part') || s.includes('indirect')) return 'bright_indirect';
  return 'medium';
}

function parseWateringDays(watering) {
  if (!watering) return 7;
  const str = String(watering);
  const match = str.match(/(\d+)\s*-\s*(\d+)/) || str.match(/(\d+)/);
  if (match) {
    const a = parseInt(match[1], 10);
    const b = match[2] ? parseInt(match[2], 10) : a;
    return Math.round((a + b) / 2) || 7;
  }
  if (str.toLowerCase().includes('frequent')) return 3;
  if (str.toLowerCase().includes('average')) return 7;
  if (str.toLowerCase().includes('minimum')) return 14;
  return 7;
}
