/**
 * Upper bound on a 3D table cell in CSS pixels, without loading three.js.
 * The table framing never shows a preset board larger than 8.2 units tall or
 * 10.4 units wide, so a canvas that fails this cannot fit any of them.
 */
export const mayFitTable = (width: number, height: number) =>
  height >= 260 && Math.min(height / 8.2, width / 10.4) >= 44;
