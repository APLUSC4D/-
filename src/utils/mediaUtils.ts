/**
 * Format bytes to readable size like "2.34 MB" or "146 KB"
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date to string "2026/06/12 10:39"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateString;
  }
}

/**
 * Detect image dimensions (Width x Height) asynchronously
 */
export function getImageDimensions(base64Data: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 });
    };
    img.src = base64Data;
  });
}

/**
 * Extract 5 primary colors from an image base64 data using browser canvas
 */
export function extractPalette(base64Data: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(['#888888', '#aaaaaa', '#cccccc', '#555555', '#333333']);
          return;
        }

        // Draw image small to sample pixel colors easily
        canvas.width = 30;
        canvas.height = 30;
        ctx.drawImage(img, 0, 0, 30, 30);

        const imgData = ctx.getImageData(0, 0, 30, 30).data;
        const colorCounts: { [hex: string]: number } = {};
        const colors: string[] = [];

        // Sample pixels linearly
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const alpha = imgData[i + 3];

          if (alpha < 50) continue; // Skip semi-transparent

          // Low quantization to group similar colors
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;

          const toHex = (c: number) => c.toString(16).padStart(2, '0');
          const hex = `#${toHex(qr)}${toHex(qg)}${toHex(qb)}`.toUpperCase();
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        // Sort by occurrence
        const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);

        // Prioritize interesting saturated colors over white/black/grey if possible
        // But keep fallback
        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return { r, g, b };
        };

        const isGrey = (hex: string) => {
          const rgb = hexToRgb(hex);
          const max = Math.max(rgb.r, rgb.g, rgb.b);
          const min = Math.min(rgb.r, rgb.g, rgb.b);
          return (max - min) < 20;
        };

        const vibrant = sortedColors.filter((c) => !isGrey(c));
        const neutral = sortedColors.filter((c) => isGrey(c));

        const finalColors = [...vibrant, ...neutral].slice(0, 5);
        if (finalColors.length < 5) {
          while (finalColors.length < 5) {
            finalColors.push('#888888');
          }
        }

        resolve(finalColors);
      } catch (e) {
        resolve(['#8EAEB3', '#DCEBEF', '#E2824C', '#1E1E1E', '#FFFFFF']);
      }
    };
    img.onerror = () => {
      resolve(['#8EAEB3', '#DCEBEF', '#E2824C', '#1E1E1E', '#FFFFFF']);
    };
    img.src = base64Data;
  });
}
