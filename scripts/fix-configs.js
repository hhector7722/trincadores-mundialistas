const fs = require('fs');
const file = 'lib/stickers/teamCutConfig.ts';
let content = fs.readFileSync(file, 'utf8');

const teamsToSwap = [
  'paraguay', 'canada', 'marruecos', 'usa', 'brasil', 'mejico', 'egipto', 'argentina'
];

for (const team of teamsToSwap) {
  // Find the block for the team
  const regex = new RegExp(`(${team}:\\s*\\{[\\s\\S]*?back:\\s*\\{[^}]*\\},[\\s\\S]*?front:\\s*\\{[^}]*\\}[\\s\\S]*?\\})`);
  const match = content.match(regex);
  if (match) {
    let block = match[1];
    // extract back and front strings
    const backMatch = block.match(/back:\s*(\{[^}]*\})/);
    const frontMatch = block.match(/front:\s*(\{[^}]*\})/);
    
    if (backMatch && frontMatch) {
      const backStr = backMatch[1];
      const frontStr = frontMatch[1];
      
      block = block.replace(/back:\s*\{[^}]*\}/, `back: ${frontStr}`);
      block = block.replace(/front:\s*\{[^}]*\}/, `front: ${backStr}`);
      
      content = content.replace(match[1], block);
    }
  }
}

fs.writeFileSync(file, content);
console.log('Swapped front and back for specified teams.');
