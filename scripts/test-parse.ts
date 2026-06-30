function testParse(scoreStr: string) {
  let homeScore = 0;
  let awayScore = 0;
  let penaltyHome: number | null = null;
  let penaltyAway: number | null = null;
  
  // Hypothetical regex to match penalties
  const penMatch = scoreStr.match(/\((.*?)-(.*?)\)/);
  if (penMatch) {
    penaltyHome = parseInt(penMatch[1].trim(), 10);
    penaltyAway = parseInt(penMatch[2].trim(), 10);
    // remove penalty part for score parsing
    scoreStr = scoreStr.replace(/\(.*?\)/, "");
  }

  const parts = scoreStr.split("-").map(p => parseInt(p.trim(), 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    homeScore = parts[0];
    awayScore = parts[1];
  }

  console.log("Input:", scoreStr, "=>", { homeScore, awayScore, penaltyHome, penaltyAway });
}

testParse("1 - 1");
testParse("1 - 1 (4 - 2)");
testParse("0 - 0 (3 - 5)");
testParse("2 - 1");
