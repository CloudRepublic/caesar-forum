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

function drawEmojiCircle(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  bgColor: [number, number, number],
  faceColor: [number, number, number],
  mouth: "sad" | "neutral" | "happy",
) {
  doc.setFillColor(...bgColor);
  doc.circle(cx, cy, radius, "F");

  doc.setFillColor(...faceColor);
  const eyeR = radius * 0.1;
  const eyeY = cy - radius * 0.15;
  const eyeSpacing = radius * 0.3;
  doc.circle(cx - eyeSpacing, eyeY, eyeR, "F");
  doc.circle(cx + eyeSpacing, eyeY, eyeR, "F");

  doc.setDrawColor(...faceColor);
  doc.setLineWidth(radius * 0.08);

  const mouthY = cy + radius * 0.25;
  const mouthW = radius * 0.35;

  if (mouth === "happy") {
    const segments = 12;
    const startAngle = 0;
    const endAngle = Math.PI;
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (endAngle - startAngle) * (i / segments);
      const a2 = startAngle + (endAngle - startAngle) * ((i + 1) / segments);
      const x1 = cx - mouthW + (mouthW * 2 * i) / segments;
      const y1 = mouthY - Math.sin(a1) * radius * 0.15;
      const x2 = cx - mouthW + (mouthW * 2 * (i + 1)) / segments;
      const y2 = mouthY - Math.sin(a2) * radius * 0.15;
      doc.line(x1, y1, x2, y2);
    }
  } else if (mouth === "sad") {
    const segments = 12;
    const startAngle = Math.PI;
    const endAngle = Math.PI * 2;
    const sadY = mouthY + radius * 0.1;
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (endAngle - startAngle) * (i / segments);
      const a2 = startAngle + (endAngle - startAngle) * ((i + 1) / segments);
      const x1 = cx - mouthW + (mouthW * 2 * i) / segments;
      const y1 = sadY - Math.sin(a1) * radius * 0.15;
      const x2 = cx - mouthW + (mouthW * 2 * (i + 1)) / segments;
      const y2 = sadY - Math.sin(a2) * radius * 0.15;
      doc.line(x1, y1, x2, y2);
    }
  } else {
    doc.line(cx - mouthW, mouthY, cx + mouthW, mouthY);
  }
}

async function loadLogoAsDataUrl(): Promise<string> {
  const res = await fetch("/logo.svg");
  const svgText = await res.text();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 4;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load logo")); };
    img.src = url;
  });
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
  const cardBottom = cardMarginY + cardH;
  let y = cardMarginY + 28;

  doc.setTextColor(26, 39, 68);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const maxTitleWidth = cardW - 30;
  const titleLines = doc.splitTextToSize(session.title.toUpperCase(), maxTitleWidth);
  doc.text(titleLines, cardCenterX, y, { align: "center" });
  y += titleLines.length * 9 + 4;

  if (session.speakers.length > 0) {
    const speakerNames = session.speakers.map((s) => s.name).join("  ·  ");
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(speakerNames.toUpperCase(), cardCenterX, y, { align: "center" });
    y += 10;
  }

  y += 8;
  drawDivider(doc, cardCenterX, y);
  y += 18;

  doc.setTextColor(26, 39, 68);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("HOE WAS", cardCenterX, y, { align: "center" });
  y += 12;
  doc.text("DEZE SESSIE?", cardCenterX, y, { align: "center" });
  y += 16;

  const emojiRadius = 14;
  const emojiSpacing = 42;
  const emojiCenterY = y + emojiRadius;
  drawEmojiCircle(doc, cardCenterX - emojiSpacing, emojiCenterY, emojiRadius, [220, 53, 69], [255, 255, 255], "sad");
  drawEmojiCircle(doc, cardCenterX, emojiCenterY, emojiRadius, [255, 183, 27], [255, 255, 255], "neutral");
  drawEmojiCircle(doc, cardCenterX + emojiSpacing, emojiCenterY, emojiRadius, [40, 167, 69], [255, 255, 255], "happy");
  y += emojiRadius * 2 + 14;

  const qrSize = 52;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 500,
    margin: 1,
    color: { dark: "#1a2744", light: "#FFFFFF" },
  });
  doc.addImage(qrDataUrl, "PNG", cardCenterX - qrSize / 2, y, qrSize, qrSize);
  y += qrSize + 6;

  doc.setTextColor(26, 39, 68);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN & BEOORDEEL", cardCenterX, y, { align: "center" });

  try {
    const logoDataUrl = await loadLogoAsDataUrl();
    const logoAspect = 1684 / 375;
    const logoW = 55;
    const logoFinalH = logoW / logoAspect;
    const logoY = cardBottom - logoFinalH - 10;
    doc.addImage(logoDataUrl, "PNG", cardCenterX - logoW / 2, logoY, logoW, logoFinalH);
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(31, 86, 134);
    const caesarW = doc.getTextWidth("CAESAR ");
    const totalW = caesarW + doc.getTextWidth("FORUM");
    const startX = cardCenterX - totalW / 2;
    const logoY = cardBottom - 14;
    doc.text("CAESAR", startX, logoY);
    doc.setTextColor(239, 97, 98);
    doc.text("FORUM", startX + caesarW, logoY);
  }

  const slug = session.slug || session.id;
  doc.save(`caesar-forum-${slug}.pdf`);
}
