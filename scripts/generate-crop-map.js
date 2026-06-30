const fs = require('fs');

const TEAMS = [
  { name: 'Spain', file: 'españa.png', colors: { home: '#C8102E', away: '#FFFFFF' }, years: [1934, 1950, 1962, 1966, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Brazil', file: 'brasil.png', colors: { home: '#FFDF00', away: '#002776' }, years: [1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Argentina', file: 'argentina.png', colors: { home: '#43A1D5', away: '#000000' }, years: [1930, 1934, 1958, 1962, 1966, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Germany', file: 'alemania.png', colors: { home: '#FFFFFF', away: '#000000' }, years: [1934, 1938, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Uruguay', file: 'uruguay.png', colors: { home: '#00A1DE', away: '#FFFFFF' }, years: [1930, 1950, 1954, 1962, 1966, 1970, 1974, 1986, 1990, 2002, 2010, 2014, 2018] },
  { name: 'France', file: 'francia.png', colors: { home: '#002395', away: '#FFFFFF' }, years: [1930, 1934, 1938, 1954, 1958, 1966, 1978, 1982, 1986, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'England', file: 'inglaterra.png', colors: { home: '#FFFFFF', away: '#CE1124' }, years: [1950, 1954, 1958, 1962, 1966, 1970, 1982, 1986, 1990, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Portugal', file: 'portugal.png', colors: { home: '#E42518', away: '#FFFFFF' }, years: [1966, 1986, 2002, 2006, 2010, 2014, 2018] }
];

let mapOutput = `export type JerseyCrop = {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  team: string;
  year: number;
  kit: "home" | "away";
  dominantColor: string;
  pX: number;
  pY: number;
  pWidth: number;
  pHeight: number;
};

export const TEAMS_DATA = [
  { name: 'Spain', file: 'españa.png', centers: [161.5, 461.5, 747.5, 1034.5, 1390.5, 1677.5, 1962.5, 2242], colors: { home: '#C8102E', away: '#FFFFFF' }, years: [1934, 1950, 1962, 1966, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Brazil', file: 'brasil.png', centers: [156, 432, 699, 964, 1437, 1710, 1976, 2240], colors: { home: '#FFDF00', away: '#002776' }, years: [1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Argentina', file: 'argentina.png', centers: [147, 404.5, 652.5, 900, 1533.5, 1783.5, 2024, 2267], colors: { home: '#43A1D5', away: '#000000' }, years: [1930, 1934, 1958, 1962, 1966, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Germany', file: 'alemania.png', centers: [164.5, 451.5, 727.5, 1000.5, 1406, 1694, 1973, 2244.5], colors: { home: '#FFFFFF', away: '#000000' }, years: [1934, 1938, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Uruguay', file: 'uruguay.png', centers: [162.5, 441, 709, 977, 1444.5, 1705.5, 1963.5, 2225.5], colors: { home: '#00A1DE', away: '#FFFFFF' }, years: [1930, 1950, 1954, 1962, 1966, 1970, 1974, 1986, 1990, 2002, 2010, 2014, 2018] },
  { name: 'France', file: 'francia.png', centers: [158.5, 438.5, 713.5, 983.5, 1475, 1732, 1987, 2240.5], colors: { home: '#002395', away: '#FFFFFF' }, years: [1930, 1934, 1938, 1954, 1958, 1966, 1978, 1982, 1986, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'England', file: 'inglaterra.png', centers: [147.5, 408.5, 661.5, 913.5, 1504.5, 1757, 2002.5, 2247], colors: { home: '#FFFFFF', away: '#CE1124' }, years: [1950, 1954, 1958, 1962, 1966, 1970, 1982, 1986, 1990, 1998, 2002, 2006, 2010, 2014, 2018] },
  { name: 'Portugal', file: 'portugal.png', centers: [165.5, 473.5, 771, 1066.5, 1490.5, 1763, 2018.5, 2274.5], colors: { home: '#E42518', away: '#FFFFFF' }, years: [1966, 1986, 2002, 2006, 2010, 2014, 2018] }
];

export const JERSEY_CROP_MAP: Record<string, JerseyCrop> = {
`;

for (const team of TEAMS) {
  const totalItems = team.years.length;
  
  // Base proportions derived from actual templates
  const startX = 50 / 4076;
  const colSpacing = 500 / 4076;
  const visitanteOffsetX = 2038 / 4076;
  const startY = 150 / 2405;
  const rowSpacing = 550 / 2405;
  const itemWidth = 500 / 4076;
  const itemHeight = 550 / 2405;

  for (let i = 0; i < totalItems; i++) {
    const year = team.years[i];
    const row = Math.floor(i / 4);
    
    // How many items are in this specific row?
    let itemsInThisRow = 4;
    const itemsLeft = totalItems - row * 4;
    if (itemsLeft < 4) {
      itemsInThisRow = itemsLeft;
    }
    
    const originalCol = i % 4;
    const shiftCols = (4 - itemsInThisRow) / 2;
    const col = originalCol + shiftCols;

    // Home
    const hX = startX + col * colSpacing;
    const hY = startY + row * rowSpacing;
    
    mapOutput += `  "${team.name}-${year}-home": { file: "${team.file}", x: 0, y: 0, width: 0, height: 0, team: "${team.name}", year: ${year}, kit: "home", dominantColor: "${team.colors.home}", pX: ${hX.toFixed(4)}, pY: ${hY.toFixed(4)}, pWidth: ${itemWidth.toFixed(4)}, pHeight: ${itemHeight.toFixed(4)} },\n`;
    
    // Away (Except Uruguay 1954 which has no away kit in the grid!)
    if (!(team.name === 'Uruguay' && year === 1954)) {
      const aX = visitanteOffsetX + startX + col * colSpacing;
      const aY = startY + row * rowSpacing;
      mapOutput += `  "${team.name}-${year}-away": { file: "${team.file}", x: 0, y: 0, width: 0, height: 0, team: "${team.name}", year: ${year}, kit: "away", dominantColor: "${team.colors.away}", pX: ${aX.toFixed(4)}, pY: ${aY.toFixed(4)}, pWidth: ${itemWidth.toFixed(4)}, pHeight: ${itemHeight.toFixed(4)} },\n`;
    }
  }
}

mapOutput += `};

function hexToRgb(hex: string) {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
}

function colorDistance(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

export function findSimilarKits(dominantColor: string, excludeTeam: string, threshold = 60): JerseyCrop[] {
  const similar: JerseyCrop[] = [];
  for (const crop of Object.values(JERSEY_CROP_MAP)) {
    if (crop.team === excludeTeam) continue;
    const dist = colorDistance(dominantColor, crop.dominantColor);
    if (dist <= threshold) similar.push(crop);
  }
  return similar;
}
`;

fs.writeFileSync('lib/quiz/lab/jersey-crop-map.ts', mapOutput);
console.log('Map generated successfully!');
