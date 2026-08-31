# Pastelitos – Design System

## Positionierung
Pastelitos soll wie eine junge, hochwertige Konditorei wirken: handwerklich, appetitlich, präzise und selbstbewusst. Nicht verspielt und nicht wie eine generische SaaS-Landingpage. Die Torte und ihre Konfiguration stehen immer im Mittelpunkt.

## Look & Feel
- Editoriale Patisserie statt App- oder Baukasten-Look
- Helle, warme Flächen mit mehr Frische und Kontrast
- Dunkles Cocoa/Espresso für Text und Navigation
- Beeriges Rosé als kontrollierter Akzent
- Weiche, hochwertige Flächen statt harter Kartenstapel
- Moderate Rundungen (10–18 px), keine übertriebenen Bubble-Elemente
- Große Serif-Headlines, ruhige Sans-Serif für Bedienung
- Produkt-/3D-Vorschau ist der visuelle Anker
- Presets dürfen als kuratierte Empfehlungen erscheinen, nicht als Promo-Kacheln

### Farben
- Ink `#2A211D`
- Paper `#FBF7F1`
- Surface `#FFFDF9`
- Soft Cream `#F3E9DF`
- Berry `#B8515F`
- Berry Soft `#F2D9DC`
- Cocoa `#51372E`
- Muted `#7B6E66`
- Linie `rgba(42,33,29,.12)`

## Typografie
Headlines: Georgia, Times New Roman, Serif als robuste Web-Basis. UI und Fließtext: Inter/System-Stack. Headlines dürfen groß und emotional über Produktqualität wirken; Interface-Texte bleiben klein, knapp und funktional.

## Tone of Voice
- konsequent `du`
- kurz, konkret und appetitlich
- handwerklich statt werblich
- Empfehlungen dürfen selbstbewusst formuliert sein
- keine unbelegten Superlative
- keine Emojis
- keine künstlich emotionalen Claims

Beispiele:
- `Deine Torte, ganz nach deinem Geschmack.`
- `Drei gute Ausgangspunkte.`
- `Vanille & Erdbeere`
- `Wähle Größe, Böden, Creme, Finish und Dekoration.`
- `Diese Konfiguration anfragen`

Vermeiden:
- `Magische Kuchenmomente`
- `Einzigartige Geschmacksexplosionen`
- `Mit ganz viel Liebe für dich`
- Ausrufezeichen als Standard

## Konfigurator
Der Konfigurator ist die Hauptanwendung. Die Seite führt in vier klaren Schritten: Größe, Böden, Cremes, Finish. Auf Desktop bleibt die Vorschau sticky. Ausgewählte Optionen müssen klar sichtbar sein, ohne die Seite bunt oder technisch wirken zu lassen.

Drei kuratierte Startkombinationen helfen beim Einstieg:
1. Signature – Vanille, Erdbeere, frische Beeren
2. Intensiv – Schoko Ganache
3. Frisch – Zitrone und essbare Blüten

Alle Presets sind nur Startpunkte; jede Auswahl bleibt danach frei veränderbar.

## Formulare
Das Anfrageformular ist der einzige Conversion-Schritt. Es soll ruhig, hochwertig und kurz wirken. Konfiguration, Zutaten, Zubereitung und Richtpreis werden automatisch übertragen. Keine zusätzlichen Marketing-Formulare oder Newsletter-Elemente.

## Fotografie und 3D
Food-Visuals sollen wie Studio-Food-Fotografie wirken: warm-neutral, kontrollierte Highlights, natürliche Oberflächen, realistische Feuchtigkeit und keine künstlich bunten Lichter. Der 3D-Viewer erhält eine ruhige Studiofläche und möglichst wenig UI-Chrome.

Assets bleiben über stabile IDs austauschbar. Neue Qualitätsstufen werden als Versionen ergänzt, z. B. `dough.vanilla.v2` oder `finish.chocolate.v2`, damit bessere Photoscan-/GLB-Versionen später ohne Änderung der Konfigurationslogik eingesetzt werden können.

## Mobile
Mobile ist gleichwertig zu Desktop. Presets stapeln sich, die 3D-Vorschau wird unter den Konfigurationsschritten gezeigt, Eingabeflächen bleiben mindestens fingerfreundlich und die Anfrage bleibt ohne horizontales Scrollen nutzbar.
