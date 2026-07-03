const execSync = require('child_process').execSync;

console.log('Building A-Frame:\n' + execSync('cd aframe && yarn build').toString());
console.log('Building babylon.js:\n' + execSync('cd babylonjs && yarn build').toString());
console.log('Building three.js:\n' + execSync('cd threejs && yarn build').toString());
console.log('Building Playcanvas:\n' + execSync('cd playcanvas && yarn build:editor && yarn build:no-editor').toString());
console.log('Building r3f:\n' + execSync('cd r3f && yarn build').toString());
console.log('Building Web:\n' + execSync('cd web && yarn build').toString());
console.log('Building Threlte:\n' + execSync('cd threlte && yarn build').toString());
console.log('Building Wonderland Engine:\n' + execSync('cd wonderland && yarn build && cp dist/borellion-wonderland-sdk.js ../tests/wonderland/js/').toString());
console.log('Building borellionFormats and borellionNetworking:\n' + execSync('cd utils && yarn build && yarn build-networking').toString());
