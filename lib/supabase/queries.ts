// Helper functions for Supabase database operations
import { createClient } from "@/lib/supabase/client";

// ============================================
// OBJEKTE (Immobilien)
// ============================================

export async function getObjekte(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("objekte")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createObjekt(objekt: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("objekte")
    .insert(objekt)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateObjekt(id: string, updates: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("objekte")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteObjekt(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("objekte").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// WOHNUNGEN
// ============================================

export async function getWohnungen(userId: string, objektId?: string) {
  const supabase = createClient();
  let query = supabase.from("wohnungen").select("*").eq("user_id", userId);

  if (objektId) {
    query = query.eq("objekt_id", objektId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createWohnung(wohnung: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wohnungen")
    .insert(wohnung)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWohnung(id: string, updates: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wohnungen")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWohnung(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("wohnungen").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// MIETER
// ============================================

export async function getMieter(userId: string, wohnungId?: string) {
  const supabase = createClient();
  let query = supabase.from("mieter").select("*").eq("user_id", userId);

  if (wohnungId) {
    query = query.eq("wohnung_id", wohnungId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createMieter(mieter: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mieter")
    .insert(mieter)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMieter(id: string, updates: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mieter")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMieter(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("mieter").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// ZAEHLER
// ============================================

export async function getZaehler(userId: string, wohnungId?: string) {
  const supabase = createClient();
  let query = supabase.from("zaehler").select("*").eq("user_id", userId);

  if (wohnungId) {
    query = query.eq("wohnung_id", wohnungId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createZaehler(zaehler: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("zaehler")
    .insert(zaehler)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateZaehler(id: string, updates: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("zaehler")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteZaehler(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("zaehler").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// RAUCHMELDER
// ============================================

export async function getRauchmelder(userId: string, wohnungId?: string) {
  const supabase = createClient();
  let query = supabase.from("rauchmelder").select("*").eq("user_id", userId);

  if (wohnungId) {
    query = query.eq("wohnung_id", wohnungId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createRauchmelder(rauchmelder: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rauchmelder")
    .insert(rauchmelder)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRauchmelder(id: string, updates: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rauchmelder")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRauchmelder(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("rauchmelder").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// RECHNUNGEN
// ============================================

export async function getRechnungen(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rechnungen")
    .select("*")
    .eq("user_id", userId)
    .order("datum", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createRechnung(rechnung: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rechnungen")
    .insert(rechnung)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRechnung(id: string, updates: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rechnungen")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRechnung(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("rechnungen").delete().eq("id", id);

  if (error) throw error;
}
