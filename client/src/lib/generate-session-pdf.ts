import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Session } from "@shared/schema";

interface PdfOptions {
  session: Session;
  editionDate: string;
  reviewUrl: string;
}

function drawGeometricBackground(doc: jsPDF, w: number, h: number) {
  doc.setFillColor(26, 39, 68);
  doc.rect(0, 0, w, h, "F");

  const shapes: { points: number[][]; color: [number, number, number] }[] = [
    { points: [[0, 0], [60, 0], [0, 80]], color: [31, 51, 85] },
    { points: [[w - 70, 0], [w, 0], [w, 50], [w - 40, 30]], color: [35, 58, 95] },
    { points: [[0, h - 90], [50, h - 40], [0, h]], color: [35, 58, 95] },
    { points: [[w, h - 70], [w, h], [w - 80, h]], color: [31, 51, 85] },
    { points: [[w - 50, 60], [w, 90], [w, 150], [w - 30, 120]], color: [28, 45, 78] },
    { points: [[0, 120], [40, 100], [50, 160], [10, 170]], color: [28, 45, 78] },
    { points: [[30, h - 50], [80, h - 80], [100, h - 30], [50, h]], color: [28, 45, 78] },
    { points: [[w - 90, h - 20], [w - 50, h - 60], [w - 20, h - 10], [w - 60, h]], color: [35, 58, 95] },
    { points: [[60, 20], [90, 0], [110, 40], [80, 55]], color: [24, 36, 62] },
    { points: [[w - 120, h - 50], [w - 80, h - 70], [w - 60, h - 30]], color: [24, 36, 62] },
  ];

  for (const shape of shapes) {
    doc.setFillColor(...shape.color);
    const [first, ...rest] = shape.points;
    doc.moveTo(first[0], first[1]);
    for (const p of rest) doc.lineTo(p[0], p[1]);
    doc.fill();
  }
}

function drawWhiteCard(doc: jsPDF, x: number, y: number, w: number, h: number, r: number) {
  doc.setFillColor(240, 242, 245);
  doc.roundedRect(x + 1.5, y + 1.5, w, h, r, r, "F");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

function drawDivider(doc: jsPDF, centerX: number, y: number) {
  const lineLen = 35;
  const gap = 6;

  doc.setDrawColor(0, 47, 108);
  doc.setLineWidth(0.4);
  doc.line(centerX - lineLen - gap, y, centerX - gap, y);
  doc.line(centerX + gap, y, centerX + lineLen + gap, y);

  const d = 3.5;
  doc.setFillColor(0, 47, 108);
  doc.moveTo(centerX, y - d);
  doc.lineTo(centerX + d, y);
  doc.lineTo(centerX, y + d);
  doc.lineTo(centerX - d, y);
  doc.fill();
}

function drawEmoji(doc: jsPDF, cx: number, cy: number, radius: number, type: "sad" | "neutral" | "happy") {
  const colors: Record<string, [number, number, number]> = {
    sad: [231, 76, 60],
    neutral: [243, 156, 18],
    happy: [46, 174, 96],
  };

  doc.setFillColor(...colors[type]);
  doc.circle(cx, cy, radius, "F");

  doc.setFillColor(255, 255, 255);
  const eyeY = cy - radius * 0.2;
  const eyeSpacing = radius * 0.35;
  const eyeR = radius * 0.12;
  doc.circle(cx - eyeSpacing, eyeY, eyeR, "F");
  doc.circle(cx + eyeSpacing, eyeY, eyeR, "F");

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(radius * 0.1);
  const mouthY = cy + radius * 0.3;
  const mouthW = radius * 0.4;

  if (type === "sad") {
    const cp1x = cx - mouthW * 0.6;
    const cp1y = mouthY + radius * 0.35;
    const cp2x = cx + mouthW * 0.6;
    const cp2y = mouthY + radius * 0.35;

    doc.moveTo(cx - mouthW, mouthY + radius * 0.15);
    doc.curveTo(cp1x, cp1y - radius * 0.3, cp2x, cp2y - radius * 0.3, cx + mouthW, mouthY + radius * 0.15);
    doc.stroke();
  } else if (type === "neutral") {
    doc.line(cx - mouthW, mouthY, cx + mouthW, mouthY);
  } else {
    const cp1x = cx - mouthW * 0.6;
    const cp1y = mouthY + radius * 0.35;
    const cp2x = cx + mouthW * 0.6;
    const cp2y = mouthY + radius * 0.35;

    doc.moveTo(cx - mouthW, mouthY);
    doc.curveTo(cp1x, cp1y, cp2x, cp2y, cx + mouthW, mouthY);
    doc.stroke();
  }
}

function drawLogo(doc: jsPDF, centerX: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.setTextColor(31, 86, 134);
  const caesarWidth = doc.getTextWidth("CAESAR ");
  const totalWidth = caesarWidth + doc.getTextWidth("FORUM");
  const startX = centerX - totalWidth / 2;

  doc.text("CAESAR", startX, y);

  doc.setTextColor(239, 97, 98);
  doc.text("FORUM", startX + caesarWidth, y);
}

export async function generateSessionPdf({ session, reviewUrl }: PdfOptions): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  drawGeometricBackground(doc, pageWidth, pageHeight);

  const cardMarginX = 16;
  const cardMarginY = 14;
  const cardW = pageWidth - cardMarginX * 2;
  const cardH = pageHeight - cardMarginY * 2;
  drawWhiteCard(doc, cardMarginX, cardMarginY, cardW, cardH, 4);

  const cardCenterX = centerX;
  let y = cardMarginY + 28;

  doc.setTextColor(26, 39, 68);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const maxTitleWidth = cardW - 30;
  const titleLines = doc.splitTextToSize(session.title.toUpperCase(), maxTitleWidth);
  doc.text(titleLines, cardCenterX, y, { align: "center" });
  y += titleLines.length * 9 + 4;

  if (session.speakers.length > 0) {
    const speakerNames = session.speakers.map(s => s.name).join("  ·  ");
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(speakerNames.toUpperCase(), cardCenterX, y, { align: "center" });
    y += 10;
  }

  y += 8;
  drawDivider(doc, cardCenterX, y);
  y += 16;

  doc.setTextColor(26, 39, 68);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("HOE WAS", cardCenterX, y, { align: "center" });
  y += 12;
  doc.text("DEZE SESSIE?", cardCenterX, y, { align: "center" });
  y += 20;

  const emojiR = 12;
  const emojiSpacing = 38;
  drawEmoji(doc, cardCenterX - emojiSpacing, y, emojiR, "sad");
  drawEmoji(doc, cardCenterX, y, emojiR, "neutral");
  drawEmoji(doc, cardCenterX + emojiSpacing, y, emojiR, "happy");
  y += emojiR + 22;

  const qrSize = 55;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 500,
    margin: 1,
    color: { dark: "#1a2744", light: "#FFFFFF" },
  });
  doc.addImage(qrDataUrl, "PNG", cardCenterX - qrSize / 2, y, qrSize, qrSize);
  y += qrSize + 10;

  doc.setTextColor(26, 39, 68);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN & BEOORDEEL", cardCenterX, y, { align: "center" });

  const logoY = cardMarginY + cardH - 14;
  drawLogo(doc, cardCenterX, logoY);

  const slug = session.slug || session.id;
  doc.save(`caesar-forum-${slug}.pdf`);
}
