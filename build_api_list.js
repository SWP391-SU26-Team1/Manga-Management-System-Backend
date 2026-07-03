const fs = require('fs');
const data = JSON.parse(fs.readFileSync('api_routes.json', 'utf8'));
const mounts = data.mounts.map(m => ({prefix: m.prefix.replace(/^'|'$/g, ''), modulePath: m.modulePath}));
const fullRoutes = [];
const normalizedPath = path => path.replace(/\/\//g, '/');
for(const file in data.routeDefs){
  const moduleRoutes = data.routeDefs[file];
  const moduleName = file.replace(/src\/modules\//, '').replace(/\.routes\.js$/, '');
  const mountEntries = mounts.filter(m => m.modulePath.toLowerCase().includes(moduleName.toLowerCase()));
  if(mountEntries.length === 0){
    continue;
  }
  moduleRoutes.forEach(route => {
    mountEntries.forEach(m => {
      let full = route.path === '/' ? m.prefix : `${m.prefix}/${route.path.replace(/^\//, '')}`;
      full = full.replace(/\/\//g, '/');
      fullRoutes.push({method: route.method, path: full, source: `${file}`});
    });
  });
}
// add explicit routes
data.explicit.forEach(r => fullRoutes.push({method: r.method, path: r.path, source: 'app.js'}));
// dedupe and sort
const seen = new Set();
const unique = [];
fullRoutes.sort((a,b)=> a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
fullRoutes.forEach(r => {
  const key = `${r.method} ${r.path}`;
  if(!seen.has(key)) { seen.add(key); unique.push(r); }
});
const group = {};
unique.forEach(r=>{
  const top = r.path.split('/')[2] || '';
  const g = top || 'root';
  if(!group[g]) group[g] = [];
  group[g].push(r);
});
const lines = [];
lines.push('API LIST, sorted by path');
Object.keys(group).sort().forEach(g=>{
  lines.push('');
  lines.push(`### /api/${g || ''}`);
  group[g].forEach(r=> lines.push(`${r.method} ${r.path}`));
});
fs.writeFileSync('api_list_final.txt', lines.join('\n'));
console.log('api_list_final.txt written');
