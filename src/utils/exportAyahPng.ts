import { Capacitor } from '@capacitor/core';

export interface ExportAyahPngOptions {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  theme: 'light' | 'dark';
}

function wrapRtlLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${currentLine} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

export async function exportAyahAsTransparentPng({
  surahName,
  surahNumber,
  ayahNumber,
  arabicText,
  theme,
}: ExportAyahPngOptions): Promise<boolean> {
  try {
    if ('fonts' in document) {
      await document.fonts.ready;
    }

    const dpr = 2;
    const width = 1080;
    const horizontalPadding = 84;
    const topPadding = 72;
    const bottomPadding = 68;
    const maxTextWidth = width - horizontalPadding * 2;
    const arabicFontSize = 54;
    const arabicLineHeight = 104;
    const captionGap = 38;
    const captionFontSize = 24;

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) return false;

    measureCtx.font = `400 ${arabicFontSize}px "Amiri", "Scheherazade New", serif`;
    const lines = wrapRtlLines(measureCtx, arabicText, maxTextWidth);
    const contentHeight =
      topPadding +
      lines.length * arabicLineHeight +
      captionGap +
      captionFontSize +
      bottomPadding;

    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = Math.ceil(contentHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, contentHeight);

    const primaryInk = theme === 'dark' ? '#f4f4f5' : '#18181b';
    const accentInk = theme === 'dark' ? '#2dd4bf' : '#0f766e';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillStyle = primaryInk;
    ctx.font = `400 ${arabicFontSize}px "Amiri", "Scheherazade New", serif`;

    let y = topPadding + arabicLineHeight / 2;
    for (const line of lines) {
      ctx.fillText(line, width / 2, y);
      y += arabicLineHeight;
    }

    ctx.direction = 'ltr';
    ctx.fillStyle = accentInk;
    ctx.font = `600 ${captionFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillText(
      `QS. ${surahName} (${surahNumber}) : Ayat ${ayahNumber}`,
      width / 2,
      topPadding + lines.length * arabicLineHeight + captionGap,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), 'image/png'),
    );
    if (!blob) return false;

    const slug = surahName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const fileName = `qs-${surahNumber}-${slug || 'ayat'}-ayat-${ayahNumber}.png`;

    if (Capacitor.isNativePlatform() && typeof navigator !== 'undefined' && navigator.share) {
      try {
        const file = new File([blob], fileName, { type: 'image/png' });
        const canShareFiles =
          typeof navigator.canShare === 'function' ? navigator.canShare({ files: [file] }) : true;
        if (canShareFiles) {
          await navigator.share({
            files: [file],
            title: `QS. ${surahName} (${surahNumber}) : Ayat ${ayahNumber}`,
          });
          return true;
        }
      } catch {
        // User canceled share or WebView share unsupported; fall back to download
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
