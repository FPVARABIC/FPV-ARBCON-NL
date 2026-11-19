# fiercon · nieuwe werkruimten

De Nederlandse editie gebruikt nu de bronstructuur en echte vliegtuigmodellen van de open source Betaflight App als uitgangspunt, aangepast voor de bestaande React Native/Web-toepassing. De donkerblauw-gouden fiercon-vormgeving blijft behouden. De volledige bron, het GPL-bestand, modelbronnen en afgeleide meshes staan in deze repository; zie [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md).

De eerste cosmetische aanpassing loste de inhoudsverdeling onvoldoende op. Deze wijziging vervangt de smalle werkruimten, de kleine vlakke vliegtuigweergave, de uitgerekte informatiekaarten en de lange PID-pagina door gerichte schermindelingen. Overbodige inleidingen zijn ingekort en onjuiste Nederlandse poort-, configuratie-, LED- en Blackbox-termen zijn verbeterd.

## Gepubliceerde interface

Op de startpagina staan de verbinding en firmware naast elkaar, gevolgd door zeventien configuratieschermen in vijf groepen. PID, Rates, Filters en Expert hebben elk een eigen tabblad met een uitleesbare selectiestatus. Bij Motoren staan de motorkaart en de regelaars naast elkaar. GPS verdeelt configuratie, kaart en positiewaarden over de werkruimte en schakelt op een telefoon naar één kolom.

[Open de galerij met de startpagina, firmware en alle 17 schermen](verification/workbench/schermen/README.md).

De vorige meting controleerde de buitenste webpagina. De werkruimte van React Native Web kan daarbinnen afzonderlijk scrollen. Bij een venster van 1280 px kwam de GPS-inhoud 562 px buiten die werkruimte. De bijbehorende regressiecontrole meet nu zowel de pagina als de inhoud van het werkpaneel en wacht eerst tot een schermspecifieke bediening is geladen.

| Controle | Resultaat |
|---|---|
| Werkruimte en pagina | 153 van 153 combinaties binnen de beschikbare breedte, 17 onderdelen op 320, 390, 768, 1024, 1056, 1280, 1440, 1920 en 2560 px |
| Interactie | Alle vier PID-tabbladen tonen het bijbehorende paneel en één geselecteerd tabblad. Beide firmwareweergaven en de vijf vliegstijlgidsen zijn geopend in de browser. |
| Mobiel en browser | De TypeScript-controles voor beide platformen zijn geslaagd. De visuele controle is uitgevoerd in Chromium, met testgegevens voor de configuratieschermen. |
| Volledige Jest-run | 488 suites, 9070 geslaagde tests en nul overgeslagen tests |
| 3D | Negen lokale glTF-bestanden in de release. De testbrowser tekende de driehoeksmesh via de CPU. Een fysieke vluchtcontroller, een Android-APK en rendering op een GPU vallen buiten deze meting. |

[Bekijk de metingen per scherm en breedte](verification/workbench/scrollview-audit.json) of [de testresultaten per suite](verification/workbench/jest-release-summary.json).

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
| Presets | Zoek- en categoriefilters met de resultaten links en het wijzigingsvoorbeeld rechts op desktop. Op telefoon staan lijst en detail onder elkaar. |
| Opdrachtregel | Grote terminal met compacte leesopdrachten ernaast. |

Home, verbinding, firmwareflashen en de vliegstijlgidsen gebruiken dezelfde kleuren en typografie. Alle 17 onderdelen blijven via de navigatie bereikbaar. De donatiesectie blijft verwijderd.

## 3D en gegevens

Negen upstream glTF-modellen zijn lokaal meegeleverd. Three.js rendert deze op het web; Android en browsers zonder WebGL gebruiken vereenvoudigde echte driehoeksmeshes met dezelfde geteste poseconventie. Voor mixers zonder upstream mesh wordt geometrie uit de geverifieerde rotoropstelling opgebouwd. Een onbekende mixer of een tegenstrijdig motoraantal wordt nooit een verzonnen quadcopter.

Er is geen animatielus of gesimuleerde vlucht toegevoegd. De nieuwste echte attitude gaat naar model, instrumenten en getallen. Oude gegevens blijven herkenbaar oud. De ingebedde GPS-kaart gebruikt lokaal gebundelde Natural Earth-geometrie en verstuurt geen coördinaten.

## Verificatie van de eerdere ontwerpversie

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

Bronversie voor deze publicatie is [`3f28aee`](https://github.com/FPVARABIC/FPV-ARBCON-NL/commit/3f28aeeb45a28351bda03f35fdc1e7ba717cac6e). De bijbehorende [Pages-publicatie](https://github.com/FPVARABIC/FPV-ARBCON-NL/actions/runs/44503356840) is geslaagd. De startpagina op het vaste adres kwam byte voor byte overeen met de gebouwde pagina. Alle 101 opvraagbare bestanden kwamen overeen met hun lokale SHA-256. Het besturingsbestand `.nojekyll` telt afzonderlijk mee in de uitgegeven Git-boom.

[Bekijk de HTTP-controle per gepubliceerd bestand](verification/workbench/publicatiebestanden.json).
