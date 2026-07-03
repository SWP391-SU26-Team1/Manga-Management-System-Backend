const fs = require('fs');
const path = require('path');
const app = fs.readFileSync('src/app.js', 'utf8');
const requireMap = {}; 
app.split(/\r?\n/).forEach(line => {
  const m = line.match(/const\s+(\w+)\s*=\s*require\(['"](.+?)['"]\);/);
  if(m){ requireMap[m[1]] = m[2]; }
});
const mounts = [];
app.split(/\r?\n/).forEach(line => {
  const m = line.match(/app\.use\((?:['"](.+?)['"]|([^,]+)),\s*([^\s;]+)\)/);
  if(m){
    let prefix = m[1] || m[2];
    const moduleName = m[3];
    if(prefix){ prefix = prefix.trim(); }
    mounts.push({ prefix, moduleName });
  }
});
const routeFiles = require('glob').sync('src/modules/**/*.routes.js');
const routeDefs = {};
routeFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const defs = [];
  lines.forEach(line => {
    const m = line.match(/router\.(get|post|patch|put|delete|all)\(\s*['\"]([^'\"]+)['\"]/);
    if(m){ defs.push({method:m[1].toUpperCase(), path:m[2]}); }
  });
  routeDefs[file] = defs;
});
const fullRoutes = [];
Object.entries(routeDefs).forEach(([file, defs]) => {
  const normalizedFile = './' + file.replace(/\\/g, '/');
  const matchedMounts = mounts.filter(m => {
    const modulePath = requireMap[m.moduleName];
    if(!modulePath) return false;
    const resolved = path.normalize(path.join('src', modulePath + '.js')).replace(/\\/g, '/');
    const fileNormalized = file.replace(/\\/g, '/');
    return fileNormalized.endsWith(resolved.substring(4));
  });
  if(matchedMounts.length === 0){
    // maybe direct path with route varname same as file basename
    const basename = path.basename(file, '.routes.js');
    matchedMounts.push(...mounts.filter(m => m.moduleName.toLowerCase().includes(basename.toLowerCase())));
  }
  defs.forEach(route => {
    matchedMounts.forEach(m => {
      let full = route.path === '/' ? m.prefix : `${m.prefix}/${route.path.replace(/^\//, '')}`;
      full = full.replace(/\/\//g, '/');
      fullRoutes.push({method: route.method, path: full, file});
    });
  });
});
// add explicit app routes from app.js
app.split(/\r?\n/).forEach(line => {
  const m = line.match(/app\.(get|post|patch|put|delete)\(['\"](.+?)['\"]/);
  if(m) fullRoutes.push({method:m[1].toUpperCase(), path:m[2], file:'app.js'});
});
const unique = [];
const seen = new Set();
fullRoutes.sort((a,b)=> a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
fullRoutes.forEach(r => {
  const key = `${r.method} ${r.path}`;
  if(!seen.has(key)) { seen.add(key); unique.push(r); }
});
const lines = ['FULL API LIST'];
unique.forEach(r => lines.push(`${r.method} ${r.path}`));
fs.writeFileSync('api_list_full.txt', lines.join('\n'));
console.log('api_list_full.txt written, count=' + unique.length);
