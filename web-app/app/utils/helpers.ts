export const sklanjaj = (n: number, besede: string[]) => {
  if (n == 1) return besede[0];
  if (n == 2) return besede[1];
  if (n == 3 || n == 4) return besede[2];
  return besede[3];
};

export const secondsToString = (num: number) => {
  return `${Math.floor(num / 60)}:${(Math.floor(num) % 60).toString().padStart(2, '0')}`
}

export const chartColorsHex = [
  "#36a2eb",
  "#ff6384",
  "#4bc0c0",
  "#ff9f40",
  "#9966ff",
  "#ffcd56" 
]

export const hexToRGB = (hex: string) => {
  const hexValue = hex.replace("#", "");
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  return [r,g,b];
}

export const chartColorsRGB = chartColorsHex.map(hexToRGB);

export const getColorHex = (i: number) => chartColorsHex[i % chartColorsHex.length];
