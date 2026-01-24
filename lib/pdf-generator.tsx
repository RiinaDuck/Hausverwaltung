"use client";

import jsPDF from "jspdf";

// Profil-Interface für den PDF-Header
export interface PDFProfile {
  name: string;
  email: string;
  anschrift: string;
  ansprechpartner: string;
}

interface PDFOptions {
  title: string;
  subtitle?: string;
  date?: string;
  content: PDFContent[];
  footer?: string;
  profile?: PDFProfile; // Optionale Profildaten für den Header
}

interface PDFContent {
  type: "heading" | "paragraph" | "table" | "spacer";
  text?: string;
  data?: { headers: string[]; rows: string[][] };
  height?: number;
}

// Hilfsfunktion für sichere Dateinamen
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, "_") // Ungültige Zeichen ersetzen
    .replace(/\s+/g, "_") // Leerzeichen durch Unterstriche
    .replace(/_{2,}/g, "_") // Mehrfache Unterstriche zusammenfassen
    .replace(/^_|_$/g, "") // Führende/Trailing Unterstriche entfernen
    .substring(0, 200); // Maximale Länge begrenzen
}

export function generatePDF(options: PDFOptions) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Profil-Header wenn vorhanden
    if (options.profile) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(options.profile.name || "Hausverwaltung Boss", margin, y);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      y += 5;
      
      if (options.profile.anschrift) {
        doc.text(options.profile.anschrift, margin, y);
        y += 4;
      }
      if (options.profile.email) {
        doc.text(`E-Mail: ${options.profile.email}`, margin, y);
        y += 4;
      }
      if (options.profile.ansprechpartner) {
        doc.text(`Ansprechpartner: ${options.profile.ansprechpartner}`, margin, y);
        y += 4;
      }
      
      // Datum rechts oben
      doc.text(
        options.date || new Date().toLocaleDateString("de-DE"),
        pageWidth - margin,
        20,
        { align: "right" }
      );
      
      y += 6;
    } else {
      // Standard-Header ohne Profil
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Hausverwaltung Boss", margin, y);
      doc.text(
        options.date || new Date().toLocaleDateString("de-DE"),
        pageWidth - margin,
        y,
        { align: "right" }
      );
      y += 15;
    }

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(options.title, margin, y);
    y += 8;

    // Subtitle
    if (options.subtitle) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(options.subtitle, margin, y);
      y += 10;
    }

    // Divider line
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Content
    doc.setTextColor(0);
    for (const item of options.content) {
      // Check if we need a new page
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      switch (item.type) {
        case "heading":
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(item.text || "", margin, y);
          y += 8;
          break;

        case "paragraph":
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(
            item.text || "",
            pageWidth - margin * 2
          );
          doc.text(lines, margin, y);
          y += lines.length * 5 + 5;
          break;

        case "table":
          if (item.data) {
            const { headers, rows } = item.data;
            const colCount = headers.length;
            const colWidth = (pageWidth - margin * 2) / colCount;
            const cellPadding = 2;
            const maxCellWidth = colWidth - cellPadding * 2;

            // Table header
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
            headers.forEach((header, i) => {
              // Header mit Textumbruch
              const headerLines = doc.splitTextToSize(header, maxCellWidth);
              doc.text(headerLines[0] || header, margin + i * colWidth + cellPadding, y);
            });
            y += 8;

            // Table rows mit Textumbruch
            doc.setFont("helvetica", "normal");
            rows.forEach((row) => {
              // Berechne die maximale Zeilenhöhe für diese Zeile
              let maxRowHeight = 6;
              const cellLines: string[][] = [];
              
              row.forEach((cell, i) => {
                const cellText = cell || "";
                const lines = doc.splitTextToSize(cellText, maxCellWidth);
                cellLines.push(lines);
                const cellHeight = lines.length * 4 + 2;
                if (cellHeight > maxRowHeight) {
                  maxRowHeight = cellHeight;
                }
              });

              // Prüfe ob neue Seite nötig
              if (y + maxRowHeight > 270) {
                doc.addPage();
                y = 20;
              }

              // Zeichne alle Zellen dieser Zeile
              cellLines.forEach((lines, i) => {
                let cellY = y;
                lines.forEach((line) => {
                  doc.text(line, margin + i * colWidth + cellPadding, cellY);
                  cellY += 4;
                });
              });

              y += maxRowHeight;
            });
            y += 5;
          }
          break;

        case "spacer":
          y += item.height || 10;
          break;
      }
    }

    // Footer
    if (options.footer) {
      const footerY = 280;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setDrawColor(200);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      const footerLines = doc.splitTextToSize(
        options.footer,
        pageWidth - margin * 2
      );
      doc.text(footerLines, margin, footerY);
    }

    return doc;
  } catch (error) {
    console.error("Fehler beim Erstellen des PDFs:", error);
    throw new Error("PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.");
  }
}

export function downloadPDF(doc: jsPDF, filename: string) {
  try {
    const safeFilename = sanitizeFilename(filename);
    doc.save(`${safeFilename}.pdf`);
  } catch (error) {
    console.error("Fehler beim Herunterladen des PDFs:", error);
    throw new Error("PDF konnte nicht heruntergeladen werden.");
  }
}

// Specialized PDF generators for different document types

export function generateNebenkostenPDF(data: {
  title: string;
  dateVon: string;
  dateBis: string;
  introText: string;
  kostenarten: { name: string; kosten: string; schluessel: string }[];
  total: string;
  outroText: string;
  mieterName?: string;
  objektAdresse?: string;
  profile?: PDFProfile;
}) {
  try {
    const schluesselLabels: Record<string, string> = {
      wohnflaeche: "Wohnfläche",
      nutzflaeche: "Nutzfläche",
      einheiten: "Einheiten",
      personen: "Personen",
      verbrauch: "Verbrauch",
      mea: "MEA",
      direkt: "Direkt",
    };

    return generatePDF({
      title: data.title,
      subtitle: data.mieterName ? `Mieter: ${data.mieterName}` : undefined,
      date: `Zeitraum: ${new Date(data.dateVon).toLocaleDateString(
        "de-DE"
      )} - ${new Date(data.dateBis).toLocaleDateString("de-DE")}`,
      profile: data.profile,
      content: [
        { type: "paragraph", text: data.introText },
        { type: "spacer", height: 10 },
        { type: "heading", text: "Kostenaufstellung" },
        {
          type: "table",
          data: {
            headers: ["Kostenart", "Betrag (€)", "Verteilerschlüssel"],
            rows: [
              ...data.kostenarten
                .filter((k) => k.name && k.kosten)
                .map((k) => [
                  k.name,
                  `${k.kosten} €`,
                  schluesselLabels[k.schluessel] || k.schluessel,
                ]),
              ["Summe Gesamt", `${data.total} €`, ""],
            ],
          },
        },
        { type: "spacer", height: 10 },
        { type: "paragraph", text: data.outroText },
      ],
      footer:
        "Hausverwaltung Boss | Erstellt am " +
        new Date().toLocaleDateString("de-DE"),
    });
  } catch (error) {
    console.error("Fehler bei Nebenkostenabrechnung PDF:", error);
    throw new Error("Nebenkostenabrechnung konnte nicht erstellt werden.");
  }
}

export function generateMieterKommunikationPDF(data: {
  mieterName: string;
  mieterAdresse: string;
  betreff: string;
  nachricht: string;
  absender?: string;
  profile?: PDFProfile;
}) {
  try {
    return generatePDF({
      title: data.betreff || "Mitteilung",
      subtitle: `An: ${data.mieterName}`,
      date: new Date().toLocaleDateString("de-DE"),
      profile: data.profile,
      content: [
        { type: "paragraph", text: data.mieterAdresse },
        { type: "spacer", height: 15 },
        { type: "paragraph", text: data.nachricht },
        { type: "spacer", height: 20 },
        {
          type: "paragraph",
          text:
            data.absender || "Mit freundlichen Grüßen\nIhre Hausverwaltung Boss",
        },
      ],
      footer:
        "Hausverwaltung Boss | Erstellt am " +
        new Date().toLocaleDateString("de-DE"),
    });
  } catch (error) {
    console.error("Fehler bei Mieterkommunikation PDF:", error);
    throw new Error("Mieterkommunikation konnte nicht erstellt werden.");
  }
}

export function generateBriefPDF(data: {
  empfaenger: string;
  betreff: string;
  text: string;
  profile?: PDFProfile;
}) {
  try {
    return generatePDF({
      title: data.betreff,
      subtitle: `An: ${data.empfaenger}`,
      date: new Date().toLocaleDateString("de-DE"),
      profile: data.profile,
      content: [
        { type: "spacer", height: 10 },
        { type: "paragraph", text: data.text },
        { type: "spacer", height: 20 },
        {
          type: "paragraph",
          text: "Mit freundlichen Grüßen\nIhre Hausverwaltung Boss",
        },
      ],
      footer:
        "Hausverwaltung Boss | Erstellt am " +
        new Date().toLocaleDateString("de-DE"),
    });
  } catch (error) {
    console.error("Fehler bei Brief PDF:", error);
    throw new Error("Brief konnte nicht erstellt werden.");
  }
}

export function generateRechnungPDF(data: {
  rechnungsNr: string;
  datum: string;
  empfaenger: { name: string; adresse: string };
  positionen: {
    beschreibung: string;
    menge: number;
    einzelpreis: number;
    gesamt: number;
  }[];
  summeNetto: number;
  mwst: number;
  summeBrutto: number;
  zahlungsziel?: string;
  bemerkung?: string;
  profile?: PDFProfile;
}) {
  try {
    return generatePDF({
      title: `Rechnung Nr. ${data.rechnungsNr}`,
      subtitle: `An: ${data.empfaenger.name}`,
      date: `Datum: ${data.datum}`,
      profile: data.profile,
      content: [
        { type: "paragraph", text: data.empfaenger.adresse },
        { type: "spacer", height: 15 },
        { type: "heading", text: "Rechnungspositionen" },
        {
          type: "table",
          data: {
            headers: ["Beschreibung", "Menge", "Einzelpreis", "Gesamt"],
            rows: [
              ...data.positionen.map((p) => [
                p.beschreibung,
                p.menge.toString(),
                `${p.einzelpreis.toFixed(2)} €`,
                `${p.gesamt.toFixed(2)} €`,
              ]),
              ["", "", "Summe Netto:", `${data.summeNetto.toFixed(2)} €`],
              ["", "", "MwSt. 19%:", `${data.mwst.toFixed(2)} €`],
              ["", "", "Summe Brutto:", `${data.summeBrutto.toFixed(2)} €`],
            ],
          },
        },
        { type: "spacer", height: 10 },
        {
          type: "paragraph",
          text: data.zahlungsziel
            ? `Zahlungsziel: ${data.zahlungsziel}`
            : "Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.",
        },
        ...(data.bemerkung
          ? [{ type: "paragraph" as const, text: data.bemerkung }]
          : []),
      ],
      footer:
        "Hausverwaltung Boss | Erstellt am " +
        new Date().toLocaleDateString("de-DE"),
    });
  } catch (error) {
    console.error("Fehler bei Rechnung PDF:", error);
    throw new Error("Rechnung konnte nicht erstellt werden.");
  }
}

// Generiere Mieterdaten PDF mit Profil
export function generateMieterdatenPDF(data: {
  mieterName: string;
  wohnung: string;
  einzugsDatum: string;
  kaltmiete: number;
  nebenkosten: number;
  kaution: number;
  email: string;
  telefon: string;
  objektAdresse?: string;
  profile?: PDFProfile;
}) {
  try {
    return generatePDF({
      title: "Mieterdaten",
      subtitle: `Mieter: ${data.mieterName}`,
      date: new Date().toLocaleDateString("de-DE"),
      profile: data.profile,
      content: [
        { type: "heading", text: "Mietvertragsdaten" },
        {
          type: "table",
          data: {
            headers: ["Feld", "Wert"],
            rows: [
              ["Wohnung", data.wohnung],
              ["Objekt", data.objektAdresse || "-"],
              ["Einzugsdatum", new Date(data.einzugsDatum).toLocaleDateString("de-DE")],
              ["Kaltmiete", `${data.kaltmiete.toFixed(2)} €`],
              ["Nebenkosten", `${data.nebenkosten.toFixed(2)} €`],
              ["Gesamtmiete", `${(data.kaltmiete + data.nebenkosten).toFixed(2)} €`],
              ["Kaution", `${data.kaution.toFixed(2)} €`],
            ],
          },
        },
        { type: "spacer", height: 10 },
        { type: "heading", text: "Kontaktdaten" },
        {
          type: "table",
          data: {
            headers: ["Feld", "Wert"],
            rows: [
              ["E-Mail", data.email || "-"],
              ["Telefon", data.telefon || "-"],
            ],
          },
        },
      ],
      footer:
        "Hausverwaltung Boss | Erstellt am " +
        new Date().toLocaleDateString("de-DE"),
    });
  } catch (error) {
    console.error("Fehler bei Mieterdaten PDF:", error);
    throw new Error("Mieterdaten konnten nicht erstellt werden.");
  }
}
