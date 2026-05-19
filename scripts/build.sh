#!/bin/bash
set -euo pipefail

(cd utils && yarn)
(cd aframe && yarn && yarn run build)
(cd babylonjs && yarn && yarn run build)
(cd playcanvas && yarn && yarn run build:editor && yarn run build:no-editor)
(cd r3f && yarn && yarn run build && cp dist/* ../tests/r3f/src)
(cd threlte && yarn && yarn run build && cp dist/borellion-threlte-sdk.js ../tests/threlte/src/)
(cd threejs && yarn && yarn run build)
(cd web && yarn && yarn run build)
(cd wonderland && yarn && yarn run build && cp dist/borellion-wonderland-sdk.js ../tests/wonderland/js/)
(cd utils && yarn run build && yarn run build-networking)
(cd tests/r3f && yarn && yarn run build)
(cd tests/threlte && yarn && yarn run build)
