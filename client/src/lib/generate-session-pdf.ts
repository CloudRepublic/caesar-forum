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
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFillColor(0, 47, 108);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Caesar Forum", margin, 26);

  if (editionDate) {
    const formattedDate = new Date(editionDate).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(formattedDate, pageWidth - margin, 26, { align: "right" });
  }

  y = 55;

  doc.setTextColor(0, 47, 108);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(session.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 6;

  if (session.categories && session.categories.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let badgeX = margin;
    for (const category of session.categories) {
      const textWidth = doc.getTextWidth(category) + 8;
      doc.setFillColor(230, 235, 245);
      doc.roundedRect(badgeX, y - 4, textWidth, 7, 2, 2, "F");
      doc.setTextColor(0, 47, 108);
      doc.text(category, badgeX + 4, y + 1);
      badgeX += textWidth + 4;
    }
    y += 14;
  }

  doc.setDrawColor(200, 210, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);

  const startTime = new Date(session.startTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  const endTime = new Date(session.endTime).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  const details = [
    { label: "Tijd", value: `${startTime} - ${endTime}` },
    { label: "Locatie", value: session.room },
  ];

  if (session.speakers.length > 0) {
    const speakerNames = session.speakers.map(s => s.name).join(", ");
    details.push({ label: session.speakers.length > 1 ? "Sprekers" : "Spreker", value: speakerNames });
  }

  if (session.capacity) {
    details.push({ label: "Capaciteit", value: `${session.capacity} deelnemers` });
  }

  for (const detail of details) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`${detail.label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(detail.value, margin + 28, y);
    y += 7;
  }

  y += 6;

  doc.setDrawColor(200, 210, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  if (session.description) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 47, 108);
    doc.setFontSize(13);
    doc.text("Beschrijving", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);

    const maxDescLength = 1500;
    let descText = session.description;
    if (descText.length > maxDescLength) {
      descText = descText.substring(0, maxDescLength) + "...";
    }

    const descLines = doc.splitTextToSize(descText, contentWidth);
    const maxLines = 25;
    const linesToRender = descLines.slice(0, maxLines);
    doc.text(linesToRender, margin, y);
    y += linesToRender.length * 5 + 8;
  }

  const qrSize = 45;
  const qrBlockHeight = qrSize + 20;
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y + qrBlockHeight > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }

  y = Math.max(y, pageHeight - margin - qrBlockHeight - 10);

  doc.setDrawColor(200, 210, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 47, 108);
  doc.setFontSize(13);
  doc.text("Feedback geven", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text("Scan de QR-code om feedback te geven over deze sessie", margin, y);
  y += 8;

  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 300,
    margin: 1,
    color: { dark: "#002F6C", light: "#FFFFFF" },
  });

  const qrX = margin;
  doc.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);

  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  const urlLines = doc.splitTextToSize(reviewUrl, contentWidth - qrSize - 10);
  doc.text(urlLines, qrX + qrSize + 8, y + qrSize / 2);

  const slug = session.slug || session.id;
  doc.save(`caesar-forum-${slug}.pdf`);
}
