const BASE_URL = 'https://api.inaturalist.org/v1';

/**
 * Search plants by name using the iNaturalist API.
 * Free, no API key required, CORS-enabled, returns photos.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchPlants(query) {
  if (!query || query.trim().length < 2) return [];

  const res = await fetch(
    `${BASE_URL}/taxa/autocomplete?q=${encodeURIComponent(query.trim())}&per_page=20&taxon_id=47126`,
  );

  if (!res.ok) throw new Error(`Search error: ${res.status}`);

  const data = await res.json();
  return (data.results || [])
    .filter((t) => {
      const ancestry = t.ancestry || '';
      return ancestry.includes('47126') || t.iconic_taxon_name === 'Plantae';
    })
    .slice(0, 10)
    .map((t) => {
      const raw = t.preferred_common_name || t.name || 'Unknown';
      const common_name = raw.charAt(0).toUpperCase() + raw.slice(1);
      return {
        id: t.id,
        common_name,
        scientific_name: t.name || '',
        image_url: t.default_photo?.medium_url || t.default_photo?.url || null,
        slug: String(t.id),
      };
    });
}
