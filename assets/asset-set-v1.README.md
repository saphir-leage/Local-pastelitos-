# Pastelitos Asset Set V1

This prototype establishes stable IDs for four interchangeable food components:

- `fruit.strawberry`
- `filling.vanilla`
- `dough.vanilla`
- `dough.chocolate`

The current implementation in `asset-set-v1.js` is deliberately replaceable. Each `create(id)` call returns a standalone Three.js `Group` with the asset ID in `group.userData.assetId`. Future photogrammetry/GLB versions should keep these IDs and dimensions so the configurator can swap visual quality without changing business logic.

`asset-lab.html` renders the four components separately under the same lighting and allows touch/mouse rotation. Use this page as the visual QA surface before adding new asset families or replacing a V1 component with a higher quality source.
