# Pastelitos Brand Guide

## Purpose
Pastelitos should feel like a small, modern patisserie with strong product focus: handcrafted, warm, premium and contemporary without becoming formal or distant.

The visual direction is inspired by premium editorial patisserie sites such as Heavens Taste, but it must remain recognisably Pastelitos rather than copying another brand.

## Tone of Voice

### Personality
- Warm, direct and personal.
- Confident about craftsmanship without sounding boastful.
- Playful in small doses, never childish.
- Modern and concise rather than flowery.
- Product first: taste, texture, ingredients and occasion are more important than generic lifestyle language.

### How we speak
Use `du` consistently. Prefer short active sentences. Headlines may be emotional and compact; supporting copy should be concrete. Avoid exaggerated promises such as “der beste Kuchen der Welt”.

Preferred examples:
- `Dein Kuchen. Deine Kombination.`
- `Schicht für Schicht nach deinem Geschmack.`
- `Frisch gebacken. Persönlich gestaltet.`
- `Wähle Teig, Creme, Finish und Dekoration.`
- `Für Geburtstage, Feiern und alles, was Kuchen verdient.`

Avoid:
- bureaucratic language (`Bitte wählen Sie…`)
- generic luxury clichés (`exklusiv`, `einzigartig`, `unvergleichlich`) unless they are factually justified
- too many emojis
- long marketing paragraphs

### Microcopy
Buttons are action-oriented and short:
- `Kuchen konfigurieren`
- `Konfiguration anfragen`
- `Weiter gestalten`
- `Zur Anfrage`

Labels should describe the product, not the interface. Prefer `Teig`, `Creme`, `Finish`, `Dekoration` over technical wording.

## Look & Feel

### Core idea
Editorial patisserie meets a real bakery workbench. Large typography, generous whitespace, close-up food imagery and strong contrast. The product should always be the visual hero.

### Color system
- Ink / Espresso: `#231B18` — primary text, navigation, strong buttons.
- Paper: `#F6F0E8` — page background.
- Cream: `#FFFAF3` — cards and content surfaces.
- Berry: `#9F2F45` — controlled accent for prices, active states and key details.
- Blush: `#E7C7C7` — secondary editorial accent.
- Warm line: `rgba(35,27,24,.18)` — borders and grid rhythm.

Use berry red sparingly. Large areas should remain neutral so cake colors stay accurate.

### Typography
Use a high-contrast serif for large editorial headlines and a clean sans-serif for UI and body text. In the prototype we use Georgia plus the system sans stack to avoid external font dependencies. A future production font may replace Georgia without changing hierarchy.

Headlines are large, compact and slightly tight. Navigation, labels and small badges use uppercase with increased tracking.

### Layout
- Maximum content width around 1200–1240px.
- Large section spacing.
- Prefer editorial grids and fine borders over rounded floating cards.
- Fewer visual containers; stronger hierarchy through type, spacing and contrast.
- Product photography can use square or portrait crops and should feel close, tactile and real.

### Components
Buttons are rectangular, dark and typographically strong. Selected configurator options invert to dark background with white text. Cards and forms have minimal rounding or none. The 3D viewer sits on a warm neutral studio background so material colors remain believable.

## 3D Asset Language
Every cake component is a replaceable asset with a stable semantic ID. Current V1 IDs include:
- `fruit.strawberry`
- `filling.vanilla`
- `dough.vanilla`
- `dough.chocolate`

The configurator must depend on these IDs rather than on a specific mesh implementation. Procedural V1 assets may be replaced later with optimized photogrammetry GLBs without changing configuration logic.

### Rendering rules
- Neutral, warm studio light rather than colored effect lighting.
- ACES tone mapping and physically based materials.
- Avoid perfect primitive silhouettes where possible.
- Sponge should read as porous and dry-to-moist, not plastic.
- Cream should be ivory with irregular spatula flow.
- Fruit should have controlled moist highlights, visible seeds and natural hue variation.
- Mobile Safari performance is a first-class constraint.

## Photography
Prefer macro or near-macro food photography with natural imperfections. Show cut surfaces, crumb, cream texture and fresh ingredients. Avoid generic stock imagery, very hard shadows and overly saturated food colors.

## Reference principle
Heavens Taste is used as a directional reference for editorial confidence, strong typography, concise copy and premium patisserie presentation. Pastelitos should not reproduce its exact layout, wording, logo treatment or visual assets.
