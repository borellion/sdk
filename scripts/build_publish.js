const execSync = require('child_process').execSync;

console.log('Checking for latest @borellion/beacon:\n' + execSync('node scripts/bump-beacon.js').toString());

console.log('Building A-Frame:\n' + execSync('cd aframe && yarn build').toString());
console.log('Building babylon.js:\n' + execSync('cd babylonjs && yarn build').toString());
console.log('Building Playcanvas:\n' + execSync('cd playcanvas && yarn build:editor && yarn build:no-editor').toString());
console.log('Building three.js:\n' + execSync('cd threejs && yarn build').toString());
console.log('Building r3f:\n' + execSync('cd r3f && yarn build').toString());
console.log('Building Web:\n' + execSync('cd web && yarn build').toString());
console.log('Building Threlte:\n' + execSync('cd threlte && yarn build').toString());
console.log('Building formats:\n' + execSync('cd utils && yarn build').toString());

console.log('Publishing A-Frame:\n' + execSync('cd aframe && npm publish --access public').toString());
console.log('Publishing babylon.js:\n' + execSync('cd babylonjs && npm publish --access public').toString());
console.log('Publishing three.js:\n' + execSync('cd threejs && npm publish --access public').toString());
console.log('Publishing Playcanvas:\n' + execSync('cd playcanvas && npm publish --access public').toString());
console.log('Publishing r3f:\n' + execSync('cd r3f && npm publish --access public').toString());
console.log('Publishing Web:\n' + execSync('cd web && npm publish --access public').toString());
console.log('Publishing Threlte:\n' + execSync('cd threlte && npm publish --access public').toString());
