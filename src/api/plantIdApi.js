import { env } from '@/lib/env';

const API_KEY = env.plantId.apiKey;
const BASE_URL = env.plantId.url;

const DETAILS = [
  'common_names',
  'description',
  'watering',
  'best_light_condition',
  'best_soil_type',
  'toxicity',
  'best_watering',
].join(',');

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mapLightCondition(light) {
  if (!light) return 'medium';
  const l = String(light).toLowerCase();
  if (l.includes('full sun') || l.includes('direct')) return 'direct';
  if (l.includes('shade') || l.includes('low')) return 'low';
  if (l.includes('partial') || l.includes('indirect') || l.includes('bright')) return 'bright_indirect';
  return 'medium';
}

function parseWateringDays(watering, bestWatering) {
  const str = String(bestWatering || watering || '').toLowerCase();
  if (str.includes('rare') || str.includes('minimum') || str.includes('drought')) return 21;
  if (str.includes('frequent') || str.includes('high')) return 3;
  const range = str.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return Math.round((parseInt(range[1]) + parseInt(range[2])) / 2);
  const single = str.match(/every\s+(\d+)/);
  if (single) return parseInt(single[1]);
  if (str.includes('average') || str.includes('moderate') || str.includes('medium')) return 7;
  return 7;
}

function parseDifficulty(watering, light) {
  const w = String(watering || '').toLowerCase();
  const l = String(light || '').toLowerCase();
  if (w.includes('frequent') || l.includes('specific')) return 'advanced';
  if (w.includes('rare') || w.includes('minimum')) return 'easy';
  return 'moderate';
}

function parseToxicity(toxicity) {
  if (!toxicity) return { pets: false, humans: false };
  const t = String(typeof toxicity === 'object' ? JSON.stringify(toxicity) : toxicity).toLowerCase();
  const notToxic = t.includes('not toxic') || t.includes('non-toxic') || t.includes('non toxic') || t.includes('safe');
  if (notToxic) return { pets: false, humans: false };
  const isToxic = t.includes('toxic') || t.includes('poison') || t.includes('harmful');
  return {
    pets: isToxic,
    humans: isToxic && (t.includes('human') || !t.includes('pet')),
  };
}

function buildCareProfile(plantName, details) {
  const common = details?.common_names?.[0] || plantName;
  const scientific = details?.scientific_name || '';
  const rawDesc = details?.description?.value ?? details?.description ?? null;
  const description = typeof rawDesc === 'string' && rawDesc.length > 0
    ? rawDesc
    : `${common} is a plant that requires regular care. Water appropriately and provide adequate light for healthy growth.`;
  const watering = details?.watering?.value ?? details?.watering ?? '';
  const bestWatering = details?.best_watering ?? '';
  const light = details?.best_light_condition?.value ?? details?.best_light_condition ?? '';
  const rawSoil = details?.best_soil_type?.value ?? details?.best_soil_type ?? null;
  const soil = typeof rawSoil === 'string' ? rawSoil : null;
  const tox = parseToxicity(details?.toxicity?.value ?? details?.toxicity ?? '');

  return {
    common_name: common,
    scientific_name: scientific,
    plant_type: 'houseplant',
    difficulty: parseDifficulty(watering || bestWatering, light),
    sunlight: mapLightCondition(light),
    watering_interval_days: parseWateringDays(watering, bestWatering),
    humidity: 'medium',
    temperature_min: null,
    temperature_max: null,
    soil_type: soil,
    fertilize_interval_days: 30,
    toxicity_pets: tox.pets,
    toxicity_humans: tox.humans,
    pruning_notes: null,
    description,
    image_url: null,
  };
}

/**
 * Identify plant from image using Plant.id v3 API.
 * @param {File} file - Image file
 * @returns {Promise<Array<{ common_name: string, scientific_name: string, score: number }>>}
 */
export async function identifyPlant(file) {
  if (!API_KEY) throw new Error('VITE_PLANT_ID_API_KEY is not set in .env.local');

  const base64 = await fileToBase64(file);
  const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;

  const res = await fetch(`${BASE_URL}/identification`, {
    method: 'POST',
    headers: {
      'Api-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images: [dataUrl] }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Plant.id API error: ${res.status}`);
  }

  const data = await res.json();
  const suggestions = data.result?.classification?.suggestions || [];

  if (suggestions.length === 0) {
    return [{ common_name: 'Unknown Plant', scientific_name: '', score: 0 }];
  }

  return suggestions.slice(0, 3).map((s) => ({
    common_name: s.name || 'Unknown',
    scientific_name: s.name || '',
    score: typeof s.probability === 'number' ? parseFloat(s.probability.toFixed(2)) : 0,
  }));
}

/**
 * Get detailed plant care info using Plant.id Knowledge Base.
 * @param {string} plantName - Common or scientific plant name
 * @returns {Promise<object>} Care and description fields for the app
 */
export async function getPlantCareInfo(plantName) {
  if (!API_KEY) throw new Error('VITE_PLANT_ID_API_KEY is not set in .env.local');

  const searchRes = await fetch(
    `${BASE_URL}/kb/plants/name_search?q=${encodeURIComponent(plantName)}&limit=1`,
    { headers: { 'Api-Key': API_KEY } },
  );

  if (!searchRes.ok) return buildCareProfile(plantName, null);

  const searchData = await searchRes.json();
  const entities = searchData.entities || [];
  if (entities.length === 0) return buildCareProfile(plantName, null);

  const accessToken = entities[0].access_token;

  const detailRes = await fetch(
    `${BASE_URL}/kb/plants/${accessToken}?details=${DETAILS}`,
    { headers: { 'Api-Key': API_KEY } },
  );

  if (!detailRes.ok) return buildCareProfile(plantName, null);

  const detailData = await detailRes.json();
  return buildCareProfile(plantName, detailData);
}
