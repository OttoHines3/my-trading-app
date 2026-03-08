"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExportPdfButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("reports-content");
      if (!element) return;

      const canvas = await html2canvas(element, { backgroundColor: "#030712", scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("trading-report.pdf");
    } catch {
      console.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors",
        exporting ? "opacity-50" : "text-muted-foreground hover:text-foreground hover:border-white/20"
      )}
    >
      <FileDown className="h-3.5 w-3.5" />
      {exporting ? "Exporting..." : "Export PDF"}
    </button>
  );
}
