const fs = require('fs');
const path = '../Frontend-UnConnect/packages/api/index.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /console\.error\(`\[API \$\{options\.method \|\| 'GET'\} \$\{endpoint\}\]`, error\);/g,
  "console.log(`[API ${options.method || 'GET'} ${endpoint}]`, error.message);"
);

content = content.replace(
  /console\.error\(`\[API PUBLIC \$\{options\.method \|\| 'GET'\} \$\{endpoint\}\]`, error\);/g,
  "console.log(`[API PUBLIC ${options.method || 'GET'} ${endpoint}]`, error.message);"
);

fs.writeFileSync(path, content);
