# Pastelitos 3D-Asset-Pipeline

## Architektur

Geometrie, Oberflächen und Geschäftsdaten bleiben getrennt. Ein Kuchen wird zur Laufzeit aus einer wiederverwendeten Layer-Geometrie, katalogisierten PBR-Materialien und separaten Dekorationen zusammengesetzt. Größe und Schichtdicke werden skaliert; Geschmack erzeugt keine neue GLB-Datei.

Die zentrale Registry besteht aus `assets/catalog/materials.json`, `geometry.json`, `decorations.json` und `ingredients.json`. Stabile technische IDs wie `sponge.vanilla` werden nie als übersetzte UI-Texte verwendet. Zutaten, Allergene und Preise gehören ausschließlich in die Kataloge; ein GLB darf höchstens seine technische ID in `extras` tragen.

`src/3d/pastelitos-assets.js` stellt Lookup, Legacy-Mapping, `buildCakeStructure`, Texture-/Geometry-Caches und `loadCakeAsset` bereit. Dieselbe logische Struktur ist für ganzen Kuchen und Anschnitt zu verwenden. Der aktuelle Konfigurator zeichnet noch prozedural auf einem 2D-Canvas; diese Darstellung bleibt der sichere Fallback, bis Three.js und echte Assets eingebunden sind.

## Abmessungen und UVs

- Boden: 3 cm Standarddicke
- Creme: 1 cm Standarddicke
- Außenfinish: 0,3 cm Standarddicke

Authoring-Geometrien verwenden Zentimeter als dokumentierte Einheit und eine normierte Höhe. Die Laufzeit skaliert nur die Höhe auf die gewünschte Dicke. UVs dürfen nicht von Objekt-Scale abhängen: Texture-Repeats werden anhand realer Zentimeter gesetzt oder in Blender mit ausreichend nahtlosen, texeldichte-konstanten UVs angelegt. Vor dem Export Transformations anwenden und Tangenten/Normalen prüfen.

## Vanilleboden hinzufügen oder ersetzen

1. Einen echten Vanilleboden bei diffusem, farbneutralem Licht ohne harte Schatten fotografieren. Schnittfläche, Ober- und Unterseite frontal sowie mehrere Winkel hochaufgelöst aufnehmen; eine Farbkarte und ein Maßstab helfen.
2. Nahtlose PBR-Texturen erstellen: Base Color ohne eingebackenes Licht, Normal und Roughness; Height nur bei sichtbarem Mehrwert.
3. In Blender auf `geometry.layer.round` prüfen. Reale Texeldichte, Nähte, Normalen und Materialreaktion kontrollieren.
4. Master-Dateien archivieren; Web-Texturen typischerweise mit 1024 oder 2048 px als KTX2 exportieren. Nicht pauschal 4K verwenden.
5. Texturen unter `assets/textures/sponge/` ablegen. Nur wenn neue Geometrie nötig ist, ein optimiertes GLB unter `assets/geometry/` ablegen.
6. Beim bestehenden Eintrag `sponge.vanilla` in `assets/catalog/materials.json` die Texture-URLs ergänzen. ID, Rezept- und Commerce-Struktur nicht in das GLB verschieben.
7. Tests, Asset-Validierung und Konfigurator ausführen. Bei Ladefehlern muss das prozedurale Vanille-Fallback sichtbar bleiben.

Der Nussboden unter `sponge.hazelnut` dient als erstes bildbasiertes Beispiel. Seine generierte Master-Vorlage bleibt als `hazelnut-basecolor-source.png` erhalten; die Website referenziert die auf 1024 px optimierte `hazelnut-basecolor.png`. Normal-, Roughness- und Height-Maps werden erst nach einer kontrollierten PBR-Ableitung ergänzt und nicht aus der Farbetextur vorgetäuscht.

## Neue Creme hinzufügen

1. PBR-Oberfläche wie oben aufnehmen und erstellen; Glanz/Roughness besonders unter streifendem Licht prüfen.
2. Dateien unter `assets/textures/cream/` ablegen.
3. Einen Materialeintrag mit stabiler ID, etwa `cream.strawberry`, `type: "cream"`, `geometryId: "geometry.layer.round"` und `defaultThicknessCm: 1` ergänzen.
4. Den vorhandenen deutschen UI-Namen in `CREAM_ASSET_IDS` abbilden. Keine Zutat, kein Allergen und keinen Preis erfinden.
5. Ganze Torte und Anschnitt mit derselben Ausgabe von `buildCakeStructure` testen.

## Neue Dekoration hinzufügen

1. Dekoration in Blender bereinigen, UVs/Normalen prüfen und Ursprung sowie reale Skalierung sinnvoll setzen.
2. Optimiertes GLB unter `assets/decorations/` und Texturen im passenden Texturordner ablegen.
3. Unter `assets/catalog/decorations.json` mit stabiler ID wie `decoration.berries` registrieren.
4. Wiederholte identische Elemente nach Möglichkeit als `InstancedMesh` rendern; Varianten dürfen eigene Transformationsdaten, aber keine duplizierte Geometrie erhalten.
5. Lazy Load, Cache-Hit, Schatten und mobile Performance prüfen.

## Blender- und Web-Export

- GLB bevorzugen; Meshopt oder Draco erst aktivieren, wenn der entsprechende Decoder beim GLTFLoader konfiguriert ist.
- KTX2/BasisU erst ausliefern, wenn `KTX2Loader.detectSupport(renderer)` eingerichtet ist. Der Katalog ist bereits für `.ktx2`-URLs vorbereitet.
- Base Color wird als sRGB interpretiert; Normal-, Roughness- und Height-Maps bleiben linear.
- Renderer: sRGB-Ausgabe, ACES Tone Mapping, physikalisch sinnvolle Lichtintensitäten, Environment Lighting und hochwertige, aber begrenzte Schatten verwenden.
- Textur-Anisotropie auf das vom Gerät unterstützte Maximum begrenzen.
- GLB vor Commit mit glTF Validator prüfen; ungenutzte Nodes, Materialien und Texturen entfernen.

## Performance-Ziele

- Layer-Geometrie: etwa 5.000–20.000 Dreiecke
- Dekoration: etwa 1.000–15.000 Dreiecke je einzigartigem Asset
- Web-Texturen: meist 1K–2K
- Geometrie und Texturen nur lazy laden und über die zentralen Promise-Caches deduplizieren
- Geladene Szenen klonen, BufferGeometry und Texturen teilen; Materialien nur dann klonen, wenn Parameter abweichen
- Wiederholte Dekorationen instanzieren und Draw Calls im Profiler kontrollieren

## Integration von Three.js

`CakeAssetManager` erhält Loader als Abhängigkeiten. Der Texture-Loader sollte KTX2 und gewöhnliche Texturen auflösen; der Geometry-Loader sollte GLTFLoader plus optional Meshopt/Draco kapseln. `createThreeMaterialFactory(THREE, renderer)` erzeugt ein `MeshPhysicalMaterial` und setzt sRGB sowie Anisotropie. Dadurch lädt der Kern weder Three.js noch Decoder ungefragt und bleibt testbar.

Für einen Layer wird die katalogisierte Geometrie geklont, mit `loadCakeAsset(assetId)` materialisiert und in Y auf `thicknessCm / unitHeightCm` skaliert. Whole-Cake- und Slice-Builder müssen beide dieselbe `buildCakeStructure(configuration)`-Ausgabe konsumieren; nur die Geometry-ID unterscheidet sich.

## Prüfung vor Freigabe

1. `npm test`
2. `npm run build`
3. Browser-Konfigurator: Layer hinzufügen/entfernen, alle vorhandenen Namen, Drehung und Größen testen.
4. Netzwerkfehler für GLB/Textur simulieren und prozedurales Fallback kontrollieren.
5. Development-Logs auf `Loaded`, `Cache hit` und `Falling back to procedural` prüfen; Production startet den Manager mit `debug: false`.
