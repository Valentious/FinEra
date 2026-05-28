const fs = require('fs');
const path = require('path');
const s = fs.readFileSync(path.join('src','app','components','ProfileDetails.tsx'),'utf8');
let stack = [];
let quote = null;
let esc = false;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (quote) {
    if (esc) {
      esc = false;
    } else if (ch === '\\') {
      esc = true;
    } else if (ch === quote) {
      quote = null;
    }
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') {
    quote = ch;
    continue;
  }
  if (ch === '{' || ch === '(' || ch === '[') stack.push({ ch, i });
  else if (ch === '}' || ch === ')' || ch === ']') {
    const open = stack.pop();
    if (!open || (open.ch === '{' && ch !== '}') || (open.ch === '(' && ch !== ')') || (open.ch === '[' && ch !== ']')) {
      console.log('mismatch', open, ch, i + 1);
      break;
    }
  }
}
console.log('remaining', stack.slice(-10));
