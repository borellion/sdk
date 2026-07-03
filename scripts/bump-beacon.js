const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'utils', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const current = pkg.dependencies['@borellion/beacon'];
const latest = execSync('npm view @borellion/beacon version').toString().trim();

if (current === latest) {
  console.log(`@borellion/beacon already pinned to latest (${latest})`);
} else {
  console.log(`Bumping @borellion/beacon: ${current} -> ${latest}`);
  pkg.dependencies['@borellion/beacon'] = latest;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  execSync('yarn install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}
