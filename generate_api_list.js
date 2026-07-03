const fs = require('fs');
const data = JSON.parse(fs.readFileSync('api_routes.json', 'utf8'));
const lines = [];
lines.push('EXPLICIT ROUTES');
data.explicit.forEach(r => lines.push(`${r.method} ${r.path}`));
lines.push('');
lines.push('MOUNT POINTS');
data.mounts.forEach(m => lines.push(`${m.prefix} -> ${m.modulePath}`));
lines.push('');
lines.push('ROUTE DEFINITIONS');
Object.keys(data.routeDefs).sort().forEach(file => {
  lines.push(`FILE: ${file}`);
  data.routeDefs[file].forEach(route => lines.push(`  ${route.method} ${route.path}`));
  lines.push('');
});
fs.writeFileSync('api_list.txt', lines.join('\n'));
console.log('api_list.txt written');
