const fs = require('fs');

const content = fs.readFileSync('e:/github1/Hanzi-tracker/index.html', 'utf8');

// 1. Extract CSS
const styleStart = content.indexOf('<style>');
const styleEnd = content.indexOf('</style>') + 8;
const css = content.substring(styleStart + 7, styleEnd - 8).trim();
fs.writeFileSync('e:/github1/Hanzi-tracker/styles.css', css, 'utf8');

let html = content.slice(0, styleStart) + '<link rel="stylesheet" href="styles.css">\n' + content.slice(styleEnd);

// 2. Extract Javascript
const scriptStart = html.lastIndexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');

let jsContent = html.substring(scriptStart + 8, scriptEnd);

const arrays = [
  'SENTENCE_DATA', 'HANZI_DATA', 'LEVEL_GROUPS', 
  'RADICAL_DETAILS', 'RADICAL_DATA_URLS', 
  'RADICAL_RSINDEX_URLS', 'LEVELS', 'ACHIEVEMENTS'
];

let dataJs = '';
let appJs = jsContent;

// We process from bottom to top so that replacing strings by indices doesn't offset earlier indices
let segmentsToRemove = [];

for (const name of arrays) {
  const startStr = `const ${name} = [`;
  const startIdx = appJs.indexOf(startStr);
  if (startIdx === -1) {
    console.error(`Could not find ${name}`);
    continue;
  }
  
  // Find the closing ];
  const endIdx = appJs.indexOf('];', startIdx) + 2;
  
  const chunk = appJs.substring(startIdx, endIdx);
  dataJs += chunk + '\n\n';
  
  segmentsToRemove.push({ start: startIdx, end: endIdx });
}

// Sort segments descending so we can remove them safely
segmentsToRemove.sort((a, b) => b.start - a.start);

for (const seg of segmentsToRemove) {
  appJs = appJs.slice(0, seg.start) + appJs.slice(seg.end);
}

fs.writeFileSync('e:/github1/Hanzi-tracker/data.js', dataJs.trim(), 'utf8');
fs.writeFileSync('e:/github1/Hanzi-tracker/app.js', appJs.trim(), 'utf8');

// 3. Update HTML
html = html.slice(0, html.lastIndexOf('<script>')) + 
       '<script src="data.js"></script>\n<script src="app.js"></script>' + 
       html.slice(html.lastIndexOf('</script>') + 9);

fs.writeFileSync('e:/github1/Hanzi-tracker/index.html', html, 'utf8');

console.log('Successfully split files!');
