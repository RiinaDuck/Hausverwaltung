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

// ============================================
// HAUSMANAGER STAMMDATEN
// ============================================

export async function getHausmanagerStammdaten(userId: string, typ?: string) {
  const supabase = createClient();
  let query = supabase
    .from("hausmanager_stammdaten")
    .select("*")
    .eq("user_id", userId);

  if (typ) {
    query = query.eq("typ", typ);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createHausmanagerStammdaten(stammdaten: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hausmanager_stammdaten")
    .insert(stammdaten)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHausmanagerStammdaten(id: string, updates: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hausmanager_stammdaten")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteHausmanagerStammdaten(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("hausmanager_stammdaten")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================
// EXPENSES (Betriebskosten / Nebenkosten)
// ============================================

export async function getExpenses(
  userId: string,
  objektId?: string,
  zeitraumVon?: string,
  zeitraumBis?: string,
) {
  const supabase = createClient();
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("zeitraum_von", { ascending: false });

  if (objektId) query = query.eq("objekt_id", objektId);
  if (zeitraumVon) query = query.gte("zeitraum_bis", zeitraumVon);
  if (zeitraumBis) query = query.lte("zeitraum_von", zeitraumBis);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createExpense(expense: {
  user_id: string;
  objekt_id: string;
  kostenart: string;
  betrag: number;
  zeitraum_von: string;
  zeitraum_bis: string;
  verteilerschluessel: string;
  rechnung_id?: string | null;
  notiz?: string | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert(expense)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, updates: Partial<{
  kostenart: string;
  betrag: number;
  zeitraum_von: string;
  zeitraum_bis: string;
  verteilerschluessel: string;
  rechnung_id: string | null;
  notiz: string | null;
}>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

