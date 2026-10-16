// Report exports. CSV/XLSX/PDF all come from the same rows so the numbers always match.
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type Cell = string | number;

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function exportCSV(name: string, head: string[], rows: Cell[][]) {
  const esc = (v: Cell) => {
    const s = typeof v === "number" ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : v;
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // ";" separator + BOM so Excel pt-BR opens it correctly
  const csv = "﻿" + [head, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
}

export function exportXLSX(name: string, sheet: string, head: string[], rows: Cell[][]) {
  const ws = XLSX.utils.aoa_to_sheet([head, ...rows]);
  ws["!cols"] = head.map((h, i) => ({ wch: Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)) + 2 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
  XLSX.writeFile(wb, `${name}.xlsx`);
}

export function exportPDF(name: string, title: string, subtitle: string, head: string[], rows: Cell[][], foot?: Cell[]) {
  const doc = new jsPDF({ orientation: head.length > 6 ? "landscape" : "portrait", unit: "pt" });
  doc.setFillColor(0, 15, 69); // Idônea navy
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 40, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 40, 50);
  autoTable(doc, {
    startY: 84,
    head: [head],
    body: rows.map((r) => r.map((c) => (typeof c === "number" ? c.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : c))),
    foot: foot ? [foot.map((c) => (typeof c === "number" ? c.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : c))] : undefined,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [30, 94, 235] },
    footStyles: { fillColor: [235, 238, 245], textColor: [17, 22, 38], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 248, 252] },
  });
  doc.save(`${name}.pdf`);
}
