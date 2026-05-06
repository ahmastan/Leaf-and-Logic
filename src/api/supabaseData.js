import { supabase } from './supabaseClient';

const USER_PLANTS = 'user_plants';
const CARE_TASKS = 'care_tasks';
const PLANTS = 'plants';
const PROFILES = 'profiles';
const BUCKET = 'plant-photos';

/** @returns {Promise<string|null>} */
export async function getUserId() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ---------- User plants ----------
export async function listUserPlants(orderBy = 'created_at', ascending = false) {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from(USER_PLANTS)
    .select('*')
    .eq('user_id', userId)
    .order(orderBy, { ascending });
  if (error) throw error;
  return data || [];
}

export async function getUserPlant(id) {
  const { data, error } = await supabase
    .from(USER_PLANTS)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function filterUserPlants(filters) {
  let q = supabase.from(USER_PLANTS).select('*');
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v != null && v !== '') q = q.eq(k, v);
  });
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createUserPlant(row) {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');
  const { data, error } = await supabase.from(USER_PLANTS).insert({ ...row, user_id: userId }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateUserPlant(id, row) {
  const { data, error } = await supabase.from(USER_PLANTS).update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteUserPlant(id) {
  const { error } = await supabase.from(USER_PLANTS).delete().eq('id', id);
  if (error) throw error;
}

// ---------- Care tasks ----------
export async function listCareTasks(orderBy = 'due_date', limit = 200) {
  const userId = await getUserId();
  if (!userId) return [];
  const asc = !orderBy.startsWith('-');
  const col = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
  const { data, error } = await supabase
    .from(CARE_TASKS)
    .select('*')
    .eq('user_id', userId)
    .order(col, { ascending: asc })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function filterCareTasks(filters, orderBy = 'due_date', limit = 20) {
  let q = supabase.from(CARE_TASKS).select('*');
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v != null && v !== '') q = q.eq(k, v);
  });
  q = q.order(orderBy, { ascending: true }).limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function updateCareTask(id, row) {
  const { data, error } = await supabase.from(CARE_TASKS).update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteCareTask(id) {
  const { error } = await supabase.from(CARE_TASKS).delete().eq('id', id);
  if (error) throw error;
}

export async function bulkCreateCareTasks(rows) {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');
  const withUser = rows.map((r) => ({ ...r, user_id: userId }));
  const { data, error } = await supabase.from(CARE_TASKS).insert(withUser).select('*');
  if (error) throw error;
  return data || [];
}

// ---------- Plants (reference) ----------
export async function createPlant(row) {
  const { data, error } = await supabase.from(PLANTS).insert(row).select('*').single();
  if (error) throw error;
  return data;
}

// ---------- Profiles (user settings) ----------
export async function getProfile(userId) {
  const { data, error } = await supabase.from(PROFILES).select('*').eq('id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertProfile(userId, row) {
  const { data, error } = await supabase.from(PROFILES).upsert({ id: userId, ...row }, { onConflict: 'id' }).select('*').single();
  if (error) throw error;
  return data;
}

// ---------- Storage (photo upload) ----------
export async function uploadPlantPhoto(file, path) {
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData?.publicUrl ?? data.path;
}

/** Remove all objects under plant-photos/{userId}/ (best-effort; ignores failures). */
export async function deleteUserPlantPhotos(userId) {
  if (!userId) return;
  try {
    const { data: files, error: listErr } = await supabase.storage.from(BUCKET).list(userId, {
      limit: 1000,
    });
    if (listErr || !files?.length) return;
    const paths = files.map((f) => `${userId}/${f.name}`);
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (rmErr) console.warn('deleteUserPlantPhotos:', rmErr.message);
  } catch (e) {
    console.warn('deleteUserPlantPhotos:', e?.message || e);
  }
}
