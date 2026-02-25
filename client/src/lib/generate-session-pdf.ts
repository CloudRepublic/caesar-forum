import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Session } from "@shared/schema";
import caesarEmojisPath from "@assets/image_1772049028712.png";

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

function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
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
  y += 16;

  try {
    const emojisDataUrl = await loadImageAsDataUrl(caesarEmojisPath);
    const emojisW = cardW - 40;
    const emojisAspect = 1024 / 579;
    const emojisH = emojisW / emojisAspect;
    doc.addImage(emojisDataUrl, "PNG", cardCenterX - emojisW / 2, y, emojisW, emojisH);
    y += emojisH + 8;
  } catch {
    y += 8;
  }

  const logoH = 12;
  const cardBottom = cardMarginY + cardH;
  const remainingSpace = cardBottom - y - logoH - 16;

  const qrSize = Math.min(55, remainingSpace - 20);
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 500,
    margin: 1,
    color: { dark: "#1a2744", light: "#FFFFFF" },
  });
  doc.addImage(qrDataUrl, "PNG", cardCenterX - qrSize / 2, y, qrSize, qrSize);
  y += qrSize + 8;

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
