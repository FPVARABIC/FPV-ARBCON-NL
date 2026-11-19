# fiercon · nieuwe werkruimten

De Nederlandse editie gebruikt nu de bronstructuur en echte vliegtuigmodellen van de open source Betaflight App als uitgangspunt, aangepast voor de bestaande React Native/Web-toepassing. De donkerblauw-gouden fiercon-vormgeving blijft behouden. De volledige bron, het GPL-bestand, modelbronnen en afgeleide meshes staan in deze repository; zie [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md).

De eerste cosmetische aanpassing loste de inhoudsverdeling onvoldoende op. Deze wijziging vervangt de smalle werkruimten, de kleine vlakke vliegtuigweergave, de uitgerekte informatiekaarten en de lange PID-pagina door gerichte schermindelingen. Overbodige inleidingen zijn ingekort en onjuiste Nederlandse poort-, configuratie-, LED- en Blackbox-termen zijn verbeterd.

## Alle onderdelen

| Onderdeel | Nieuwe indeling en controle |
|---|---|
| Instellen | Brede 3D-werkruimte, waarden linksboven, instrumenten rechtsonder, kalibratie eronder en compacte Status/GPS/Build-kaarten. Op kleine schermen staan de instrumenten onder het model. |
| Motoren | Mixer en motorkaart links; sessie, bediening, verticale motorregelaars en Master rechts. Telemetrie staat bij de bediening. De permanente stop blijft bereikbaar. |
| Poorten | Desktoptafel met vaste kolommen, vergrendelde USB-MSP en echte dropdowns. Mobiele kaarten blijven uitklapbaar. |
| GPS | Configuratie en satellieten links, navigatie en offline kaart rechts. Een positie verschijnt alleen bij een verse geldige fix. |
| Configuraties | Afzonderlijke panelen voor identiteit, arming/PID, functies, zoemer en DShot Beacon. |
| Ontvanger | Kanaalmonitor en sticks naast elkaar; configuratievelden in twee kolommen. |
| PID | Echte tabbladen PID, Rates, Filters en Expert. Niet-actieve werkruimten blijven gemonteerd zodat wijzigingen behouden blijven. |
| Vliegmodi | Zoeken, herkenbare geconfigureerde modi en volledige AUX-bereiken met hun bestaande bediening. |
| Failsafe | Fasen en Rescue-instellingen naast kanaalgedrag; waarschuwingen en ongeldige waarden blijven zichtbaar. |
| Voeding en accu | Compacte meetstrook en aparte panelen voor bronnen, accugrenzen en kalibratie. |
| OSD | Preview naast geselecteerd element en elementenlijst; overige instellingen eronder. De exacte canvasverhouding en sleepcoördinaten blijven behouden. |
| Videozender | Kanaal/vermogen naast band- en vermogenstabellen. Hoogtefouten door rij-breedtes in verticale panelen zijn hersteld. |
| LED-strip | Raster naast selectie, functies en draadvolgorde. De brede celmatrix heeft op een telefoon een eigen horizontale scroller. |
| Sensoren | Hardwarestatus en kalibratie naast de gedeelde 3D-oriëntatie. Ingesteld, gedetecteerd en aanwezig blijven afzonderlijke feiten. |
| Vluchtregistratie | Opslagstatus, instellingen en geavanceerde velden in werkpanelen. De bestaande wisbevestiging blijft van kracht. |
| Presets | Zoek- en categoriefilters, compatibele pakketten en wijzigingsvoorbeeld. |
| Opdrachtregel | Grote terminal met compacte leesopdrachten ernaast. |

Home, verbinding, firmwareflashen en de vliegstijlgidsen gebruiken dezelfde kleuren en typografie. Alle 17 onderdelen blijven via de navigatie bereikbaar. De donatiesectie blijft verwijderd.

## 3D en gegevens

Negen upstream glTF-modellen zijn lokaal meegeleverd. Three.js rendert deze op het web; Android en browsers zonder WebGL gebruiken vereenvoudigde echte driehoeksmeshes met dezelfde geteste poseconventie. Voor mixers zonder upstream mesh wordt geometrie uit de geverifieerde rotoropstelling opgebouwd. Een onbekende mixer of een tegenstrijdig motoraantal wordt nooit een verzonnen quadcopter.

Er is geen animatielus of gesimuleerde vlucht toegevoegd. De nieuwste echte attitude gaat naar model, instrumenten en getallen. Oude gegevens blijven herkenbaar oud. De ingebedde GPS-kaart gebruikt lokaal gebundelde Natural Earth-geometrie en verstuurt geen coördinaten.

## Verificatie

- Volledige Jest-run: **487/487 suites, 9066/9066 tests geslaagd**. De runner hergebruikt geen onbeperkt groeiende worker; `workerIdleMemoryLimit=768MB` voorkomt de heap-uitputting van een eerdere seriële run. Geen assertions zijn overgeslagen.
- TypeScript voor native en web: geslaagd.
- Interface-lint: geen fouten; bestaande waarschuwingen zijn afzonderlijk zichtbaar in de ontwikkelcontrole.
- Daarna zijn de laatste OSD- en PID-indelingsaanpassingen opnieuw gericht gecontroleerd: 22/22 OSD-tests en 91/91 PID-tests geslaagd. De controllers, wire-bytes, opslagverificatie en motorbeveiligingen zijn daarbij behouden.
- Werkelijke browsermetingen: alle 17 schermen op **320, 390, 1280, 1920 en 2560 px**, 85 scherm/maat-combinaties. Geen pagina-overloop. De 320px-kalibratieknop is gecorrigeerd. De meest rechtse LED-cel is met een echte klik via de eigen scroller bereikt.
- Extra checks: juiste PID-tab zichtbaar, overige tabs verborgen; vier afzonderlijke motorregelaars plus Master; echte 3D-geometrie bij meerdere mixeropstellingen; veilige weergave zonder GPS-fix.

De [Jest-samenvatting](verification/workbench/jest-summary.json), [browsermetingen](verification/workbench/layout-audit.json) en schermafbeeldingen staan naast de bron. De afbeeldingen gebruiken expliciete voorbeeldgegevens zonder aangesloten hardware; deze ontwikkelfixtures worden niet gepubliceerd.

De testbrowser had geen WebGL-context. De echte CPU-meshfallback is visueel gecontroleerd. De Three.js-route is gebouwd en typegecontroleerd, maar niet visueel op een GPU getest. Er is bij deze wijziging geen APK of fysieke vluchtcontroller getest.

## Publicatie

De Nederlandse bron staat op `main`; de gebouwde webversie staat op `gh-pages`. Het vaste adres is [fiercon op GitHub Pages](https://fpvarabic.github.io/FPV-ARBCON-NL/), tevens het websiteveld in GitHub About. De webuitgave bevat een `release.json` met de precieze broncommit. Het Arabische project is niet gewijzigd.
