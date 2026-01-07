"use client";

import jsPDF from "jspdf";

interface PDFOptions {
  title: string;
  subtitle?: string;
  date?: string;
  content: PDFContent[];
  footer?: string;
}

interface PDFContent {
  type: "heading" | "paragraph" | "table" | "spacer";
  text?: string;
  data?: { headers: string[]; rows: string[][] };
  height?: number;
}

export function generatePDF(options: PDFOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header with logo area
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
          const colWidth = (pageWidth - margin * 2) / headers.length;

          // Table header
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
          headers.forEach((header, i) => {
            doc.text(header, margin + i * colWidth + 2, y);
          });
          y += 8;

          // Table rows
          doc.setFont("helvetica", "normal");
          rows.forEach((row) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            row.forEach((cell, i) => {
              doc.text(cell, margin + i * colWidth + 2, y);
            });
            y += 6;
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
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}.pdf`);
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
}) {
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
}

export function generateMieterKommunikationPDF(data: {
  mieterName: string;
  mieterAdresse: string;
  betreff: string;
  nachricht: string;
  absender?: string;
}) {
  return generatePDF({
    title: data.betreff || "Mitteilung",
    subtitle: `An: ${data.mieterName}`,
    date: new Date().toLocaleDateString("de-DE"),
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
}

export function generateBriefPDF(data: {
  empfaenger: string;
  betreff: string;
  text: string;
}) {
  return generatePDF({
    title: data.betreff,
    subtitle: `An: ${data.empfaenger}`,
    date: new Date().toLocaleDateString("de-DE"),
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
}) {
  return generatePDF({
    title: `Rechnung Nr. ${data.rechnungsNr}`,
    subtitle: `An: ${data.empfaenger.name}`,
    date: `Datum: ${data.datum}`,
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
}
