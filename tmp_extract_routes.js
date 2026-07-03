const fs = require('fs');
const glob = require('glob');
const app = fs.readFileSync('src/app.js','utf8');
const mounts = [];
app.split(/\r?\n/).forEach(line => {
  const m = line.match(/app\.use\(([^,]+),\s*require\(['\"](.+?)['\"]\)/);
  if(m) mounts.push({prefix: m[1].trim(), modulePath: m[2].trim()});
  else {
    const mm = line.match(/app\.use\(([^,]+),\s*([^\s,]+)\);/);
    if(mm) mounts.push({prefix: mm[1].trim(), modulePath: mm[2].trim()});
  }
});
const explicit = [];
app.split(/\r?\n/).forEach(line => {
  const m = line.match(/app\.(get|post|patch|put|delete)\('([^']+)'/);
  if(m) explicit.push({method: m[1].toUpperCase(), path: m[2]});
});
const routeFiles = glob.sync('src/modules/**/*.routes.js');
const routeDefs = {};
routeFiles.forEach(file => {
  const content = fs.readFileSync(file,'utf8');
  const lines = content.split(/\r?\n/);
  const defs = [];
  lines.forEach(line => {
    const m = line.match(/router\.(get|post|patch|put|delete|all)\(\s*['\"]([^'\"]+)['\"]/);
    if(m) defs.push({method: m[1].toUpperCase(), path: m[2].trim()});
  });
  routeDefs[file.replace(/\\/g, '/')] = defs;
});
fs.writeFileSync('api_routes.json', JSON.stringify({explicit, mounts, routeDefs}, null, 2));
console.log('Written api_routes.json');
