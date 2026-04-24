import { env } from '@/lib/env';

const BASE = env.plantnet.apiUrl;
const API_KEY = env.plantnet.apiKey;

/**
 * Identify plant from image using Pl@ntNet API.
 * @param {File} file - Image file
 * @returns {Promise<Array<{ common_name: string, scientific_name: string, score: number }>>}
 */
export async function identifyPlant(file) {
  if (!API_KEY) throw new Error('VITE_PLANTNET_API_KEY is not set in .env.local');
  const form = new FormData();
  form.append('images', file);
  form.append('organs', 'auto');
  const url = `${BASE}/v2/identify/all?api-key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `PlantNet API error: ${res.status}`);
  }
  const data = await res.json();
  const results = (data.results || []).map((r) => {
    const species = r.species || {};
    const commonNames = species.commonNames || [];
    const common = Array.isArray(commonNames) ? commonNames[0] : (commonNames && commonNames[0]) ?? species.scientificNameWithoutAuthor ?? 'Unknown';
    return {
      common_name: typeof common === 'string' ? common : (common?.value ?? 'Unknown'),
      scientific_name: species.scientificNameWithoutAuthor || species.scientificName || '',
      score: typeof r.score === 'number' ? r.score : 0,
    };
  });
  return results;
}
