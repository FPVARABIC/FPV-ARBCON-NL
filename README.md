# fiercon

## Webversie proberen

[Open fiercon](https://fpvarabic.github.io/FPV-ARBCON-NL/)

Openbare webversie op GitHub Pages. Aanmelden is niet nodig. Hetzelfde adres staat in **About** van deze repository.

Zelfstandige Nederlandse editie van FPV-ARBCON. Deze repository bouwt voort op de gecontroleerde Nederlandse commit `a2b1d5661ebe12b1e2292903a0a7b169b764d7bf`. De webversie wordt afzonderlijk via GitHub Pages gepubliceerd; het actieve adres staat in About.

De functies, MSP-protocollen, configuratiewaarden en beveiligingen blijven gelijk aan de brontoepassing. De interface, meldingen, toegankelijkheidslabels en 37 handleidingafbeeldingen zijn Nederlandstalig. De weergaverichting is van links naar rechts, ook op een apparaat met een Arabische systeemtaal.

De Android-app heet **fiercon** en krijgt applicatie-ID `com.fpvarbcon.nl`, zodat beide edities naast elkaar kunnen worden geïnstalleerd. De interne Kotlin-namespace en React Native-registratienaam blijven behouden.

## Interface

De volledige interface gebruikt een donkerblauw-gouden vormgeving, geïnspireerd op [Firecom](https://www.firecom.nl/), met lokaal meegeleverde Lato-lettertypen. De productnaam is **fiercon**. De indeling gebruikt compacte instellingenpanelen en gegroepeerde navigatie, met Betaflight als functionele referentie en een eigen vormgeving.

Alle 17 configuratieonderdelen staan in het overzicht op Home en in de werkruimtenavigatie. Op de telefoon opent **Alle functies** een complete lijst. De donatiesectie is verwijderd. De bestaande verbindingscontrole, motorbeveiligingen en schrijfbevestigingen blijven van kracht.

[Verificatierapport van fiercon](docs/FIERCON_INTERFACE_REVIEW_NL.md).

## Lokaal controleren

```sh
npm ci
npm run typecheck
npm run typecheck:web
npm test -- --maxWorkers=2
npm run build:web
npm run scan:web-bundle
```

Het Arabische referentiebestand blijft in `src/i18n/locales/ar.json` voor de sleutel- en interpolatiecontrole. Alleen `nl.json` wordt door deze editie geladen.

## GitHub Pages opnieuw bouwen

De webpublicatie staat op de `gh-pages`-branch, met de gebouwde bestanden in de hoofdmap. Bouw met het repositorypad zodat scripts, lettertypen en afbeeldingen ook vanaf GitHub Pages laden:

```sh
FPV_ARBCON_WEB_BASE=/FPV-ARBCON-NL/ FPV_ARBCON_WEB_SOURCEMAP=false npm run build:web
```

Publiceer de inhoud van `dist-web/` in de hoofdmap van `gh-pages`, met een leeg `.nojekyll`-bestand. Kopieer `index.html` ook naar `404.html`. De broncode blijft op `main`. Deze repository bevat geen overgenomen Android-workflows.

## Android

Een Nederlandse APK wordt in een volgende stap gebouwd. Deze repository bevat de broncode; de webpublicatie staat op de afzonderlijke gh-pages-branch. De Android-controles voor een eerste start, herstart en oude RTL-voorkeuren zijn aangepast voor deze editie; uitvoering op een Android-apparaat blijft onderdeel van die volgende stap.

Verwijder de propellers vóór motortests. Ontvangstbevestigingen van de vluchtcontroller bewijzen geen mechanische beweging of veilige vlucht. Het oorspronkelijke beeldmerk is behouden.

## Handleidingafbeeldingen opnieuw maken

De browserfixture in `e2e/flight-guides` gebruikt echte schermcomponenten met expliciete voorbeeldgegevens. De 76 controles in `docs/flight-guides/_tools/validate.mjs` lezen de waarden en selecties van de echte bedieningselementen.

Installeer voor deze ontwikkeltools `playwright-core` lokaal en gebruik een geïnstalleerde Chromium-browser:

```sh
npm install --no-save --package-lock=false playwright-core@1.62.1
```

Dit is alleen nodig voor de ontwikkeltools. Bouw en serveer de fixture op poort 4182:

```sh
npx vite build --config e2e/flight-guides/vite.config.mts
npx vite preview --config e2e/flight-guides/vite.config.mts
```

Voer vanuit een tweede terminal de controles en opnamen uit. Stel zo nodig `CHROME_PATH` in op uw Chromium-uitvoerbaar bestand:

```sh
node docs/flight-guides/_tools/validate.mjs
node docs/flight-guides/_tools/capture.mjs
node docs/flight-guides/_tools/write-app-content.mjs
```

Met `GUIDE_STYLE=firmware` maakt u alleen de drie firmwareafbeeldingen opnieuw. Een mislukte opname vervangt de bestaande afbeeldingen niet. Voorbeeldgegevens zijn geen waarnemingen van aangesloten hardware.

[Oorspronkelijke projectdocumentatie](README.original.md).
