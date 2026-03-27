"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Kontakt } from "@/components/views/kontakte-view";

const KONTAKTE_STORAGE_KEY = "hausverwaltung_kontakte";

interface ArchivedItem {
  id: string;
  name: string;
  archived_at: string;
  archive_reason: string | null;
}

export function ArchivView() {
  const { profile } = useAuth();
  const { toast } = useToast();
  // useMemo gives a stable reference without module-scope initialization,
  // which would run before Next.js layout router mounts and cause an invariant error.
  const supabase = useMemo(() => createClient(), []);
  
  const [activeTab, setActiveTab] = useState("mieter");
  const [archivedMieter, setArchivedMieter] = useState<ArchivedItem[]>([]);
  const [archivedWohnungen, setArchivedWohnungen] = useState<ArchivedItem[]>([]);
  const [archivedObjekte, setArchivedObjekte] = useState<ArchivedItem[]>([]);
  const [archivedKontakte, setArchivedKontakte] = useState<ArchivedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ type: string; id: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);

  // Load archived entries
  useEffect(() => {
    const loadArchivedEntries = async () => {
      setLoading(true);
      try {
        // All three archive tables loaded in parallel
        if (supabase) {
          const [
            { data: archivedMieterData, error: mieterError },
            { data: archivedWohnungenData, error: wohnungenError },
            { data: archivedObjekteData, error: objekteError },
          ] = await Promise.all([
            supabase
              .from("mieter")
              .select("id, name, archived_at, archive_reason")
              .not("archived_at", "is", null)
              .order("archived_at", { ascending: false }),
            supabase
              .from("wohnungen")
              .select("id, bezeichnung, archived_at, archive_reason")
              .not("archived_at", "is", null)
              .order("archived_at", { ascending: false }),
            supabase
              .from("objekte")
              .select("id, adresse, archived_at, archive_reason")
              .not("archived_at", "is", null)
              .order("archived_at", { ascending: false }),
          ]);

          if (!mieterError && archivedMieterData) {
            setArchivedMieter(archivedMieterData);
          }
          if (!wohnungenError && archivedWohnungenData) {
            setArchivedWohnungen(
              archivedWohnungenData.map((w: any) => ({
                id: w.id,
                name: w.bezeichnung,
                archived_at: w.archived_at,
                archive_reason: w.archive_reason,
              }))
            );
          }
          if (!objekteError && archivedObjekteData) {
            setArchivedObjekte(
              archivedObjekteData.map((o: any) => ({
                id: o.id,
                name: o.adresse,
                archived_at: o.archived_at,
                archive_reason: o.archive_reason,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error loading archived entries:", error);
        toast({ title: "Fehler", description: "Archivierte Einträge konnten nicht geladen werden.", variant: "destructive" });
      } finally {
        setLoading(false);
      }

      // Load archived kontakte from localStorage
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(KONTAKTE_STORAGE_KEY);
          if (stored) {
            const all: Kontakt[] = JSON.parse(stored);
            const archived = all
              .filter((k) => !!k.archived_at)
              .map((k) => ({
                id: k.id,
                name: k.name,
                archived_at: k.archived_at!,
                archive_reason: k.archive_reason ?? null,
              }))
              .sort((a, b) => b.archived_at.localeCompare(a.archived_at));
            setArchivedKontakte(archived);
          }
        }
      } catch (error) {
        console.error("Error loading archived kontakte:", error);
      }
    };

    loadArchivedEntries();
  }, [toast]);

  const handleRestore = async (type: string, id: string) => {
    setRestoreInProgress(true);
    try {
      if (type === "kontakt") {
        // Restore from localStorage
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(KONTAKTE_STORAGE_KEY);
          if (stored) {
            const all: Kontakt[] = JSON.parse(stored);
            const updated = all.map((k) =>
              k.id === id ? { ...k, archived_at: undefined, archive_reason: undefined } : k
            );
            localStorage.setItem(KONTAKTE_STORAGE_KEY, JSON.stringify(updated));
          }
        }
        setArchivedKontakte((prev) => prev.filter((k) => k.id !== id));
        toast({ title: "Erfolg", description: "Kontakt wurde wiederhergestellt." });
        return;
      }
      if (supabase) {
        const { error } = await supabase
          .from(type === "mieter" ? "mieter" : type === "wohnung" ? "wohnungen" : "objekte")
          .update({
            archived_at: null,
            archive_reason: null,
          })
          .eq("id", id);

        if (error) {
          toast({ title: "Fehler", description: "Eintrag konnte nicht wiederhergestellt werden.", variant: "destructive" });
        } else {
          toast({ title: "Erfolg", description: "Eintrag wurde wiederhergestellt." });
          
          // Refresh the list
          if (type === "mieter") {
            setArchivedMieter((prev) => prev.filter((m) => m.id !== id));
          } else if (type === "wohnung") {
            setArchivedWohnungen((prev) => prev.filter((w) => w.id !== id));
          } else {
            setArchivedObjekte((prev) => prev.filter((o) => o.id !== id));
          }
        }
      }
    } catch (error) {
      console.error("Error restoring entry:", error);
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten.", variant: "destructive" });
    } finally {
      setRestoreInProgress(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === "kontakt") {
        // Delete from localStorage
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(KONTAKTE_STORAGE_KEY);
          if (stored) {
            const all: Kontakt[] = JSON.parse(stored);
            const updated = all.filter((k) => k.id !== selectedItem.id);
            localStorage.setItem(KONTAKTE_STORAGE_KEY, JSON.stringify(updated));
          }
        }
        setArchivedKontakte((prev) => prev.filter((k) => k.id !== selectedItem.id));
        toast({ title: "Erfolg", description: "Kontakt wurde endgültig gelöscht." });
        setDeleteConfirmOpen(false);
        setSelectedItem(null);
        return;
      }
      if (supabase) {
        const { error } = await supabase
          .from(selectedItem.type === "mieter" ? "mieter" : selectedItem.type === "wohnung" ? "wohnungen" : "objekte")
          .delete()
          .eq("id", selectedItem.id);

        if (error) {
          toast({ title: "Fehler", description: "Eintrag konnte nicht gelöscht werden.", variant: "destructive" });
        } else {
          toast({ title: "Erfolg", description: "Eintrag wurde endgültig gelöscht." });
          
          // Refresh the list
          if (selectedItem.type === "mieter") {
            setArchivedMieter((prev) => prev.filter((m) => m.id !== selectedItem.id));
          } else if (selectedItem.type === "wohnung") {
            setArchivedWohnungen((prev) => prev.filter((w) => w.id !== selectedItem.id));
          } else {
            setArchivedObjekte((prev) => prev.filter((o) => o.id !== selectedItem.id));
          }
        }
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten.", variant: "destructive" });
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedItem(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderArchivedList = (items: ArchivedItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Keine archivierten Einträge vorhanden.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Archiviert: {formatDate(item.archived_at)}
                </p>
                {item.archive_reason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Grund: {item.archive_reason}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleRestore(activeTab, item.id)}
                  disabled={restoreInProgress}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Wiederherstellen
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => {
                    setSelectedItem({ type: activeTab, id: item.id });
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Löschen
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Left Side */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Archiv</CardTitle>
            <CardDescription>Verwaltung archivierter Einträge</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="mieter">Mieter</TabsTrigger>
                <TabsTrigger value="wohnung">Wohnungen</TabsTrigger>
                <TabsTrigger value="objektdaten">Objekte</TabsTrigger>
                <TabsTrigger value="kontakt">Kontakte</TabsTrigger>
              </TabsList>

              <TabsContent value="mieter" className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Wird geladen...
                  </div>
                ) : (
                  renderArchivedList(archivedMieter)
                )}
              </TabsContent>

              <TabsContent value="wohnung" className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Wird geladen...
                  </div>
                ) : (
                  renderArchivedList(archivedWohnungen)
                )}
              </TabsContent>

              <TabsContent value="objektdaten" className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Wird geladen...
                  </div>
                ) : (
                  renderArchivedList(archivedObjekte)
                )}
              </TabsContent>

              <TabsContent value="kontakt" className="space-y-4">
                {renderArchivedList(archivedKontakte)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:flex lg:flex-col gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informationen</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-medium text-foreground mb-1">Archiv</p>
              <p>Archivierte Einträge können wiederhergestellt oder endgültig gelöscht werden.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Wiederherstellen</p>
              <p>Der Eintrag wird wieder als aktiv markiert und ist sichtbar.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Endgültig löschen</p>
              <p>Der Eintrag wird komplett aus dem System entfernt.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eintrag endgültig löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden. Der Eintrag wird komplett aus dem System entfernt."
        onConfirm={handleDelete}
        confirmText="Endgültig löschen"
        variant="destructive"
      />
    </div>
  );
}
