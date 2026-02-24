import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Session } from "@shared/schema";

interface PdfOptions {
  session: Session;
  editionDate: string;
  reviewUrl: string;
}

export async function generateSessionPdf({ session, editionDate, reviewUrl }: PdfOptions): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  let y = 40;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(session.title.toUpperCase(), pageWidth - 40);
  doc.text(titleLines, centerX, y, { align: "center" });
  y += titleLines.length * 12 + 6;

  if (session.speakers.length > 0) {
    const speakerNames = session.speakers.map(s => s.name).join(", ");
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(speakerNames, centerX, y, { align: "center" });
    y += 10;
  }

  y += 10;

  doc.setDrawColor(0, 47, 108);
  doc.setLineWidth(0.8);
  doc.line(centerX - 30, y, centerX + 30, y);
  y += 18;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("WAT VOND JE ERVAN?", centerX, y, { align: "center" });
  y += 14;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Scan de QR-code en geef je feedback!", centerX, y, { align: "center" });
  y += 20;

  const qrSize = 70;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 600,
    margin: 1,
    color: { dark: "#002F6C", light: "#FFFFFF" },
  });
  doc.addImage(qrDataUrl, "PNG", centerX - qrSize / 2, y, qrSize, qrSize);
  y += qrSize + 14;

  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.setFont("helvetica", "normal");
  doc.text("(scan met je telefoon camera)", centerX, y, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(0, 47, 108);
  doc.setFont("helvetica", "bold");
  doc.text("Caesar Forum", centerX, pageHeight - 20, { align: "center" });

  const slug = session.slug || session.id;
  doc.save(`caesar-forum-${slug}.pdf`);
}
