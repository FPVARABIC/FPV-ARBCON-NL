# Interfacecontrole — FPV Configurator NL

De Nederlandse editie heeft een nieuwe vormgeving, geïnspireerd op de officiële website https://www.firecom.nl/: donker marineblauw, goudgele acties, rustige kaders en het Lato-lettertype. De eigen productnaam en het oorspronkelijke beeldmerk blijven behouden. Lettertypen en licentie worden lokaal meegeleverd voor web en Android.

## Volledige functionaliteit blijft zichtbaar

De hoofdregistratie bevat dezelfde 17 bestemmingen: Instellen, Motoren, Poorten, GPS, Configuraties, Ontvanger, PID, Vliegmodi, Failsafe, Voeding en accu, OSD, Videozender, LED-strip, Sensoren, Vluchtregistratie, Presets en Opdrachtregel.

Home toont alle onderdelen. Desktopnavigatie houdt de volledige lijst met zichtbare scrolindicatie. Op de telefoon opent **Alle functies (17)** een verticale lijst met alle bestemmingen. Selecties gaan door dezelfde bestaande navigatie- en motorstopcontrole. Firmware, geavanceerde herstelgereedschappen en vliegstijlgidsen blijven bereikbaar. De donatiesectie en de bijbehorende Home-link zijn verwijderd.

De verbindings- en schrijfbeveiligingen, MSP-encoders en -decoders, transportlagen en navigatieregistratie zijn niet aangepast. Er zijn geen voorbeeldgegevens of testverbindingen toegevoegd aan de productiebundel.

## Gevonden en hersteld

- Onleesbare lichte tekst op gele acties, gidsstapnummers en witte waardechips.
- Lage contrasten van LED-nummers op bepaalde geelgroene kleuren; de tekstkleur kiest nu het hoogste WCAG-contrast zonder de LED-kleur of de firmwarewaarden te veranderen.
- Afgesneden acties bij smalle schermen: poorten opslaan, VTX-keuzes, propellerrichting en CLI-loggereedschappen.
- Een samengedrukte LED-inspector op tablets; de LED-canvas behoudt zijn eigen horizontale scrolruimte en de inspector krijgt een bruikbare kolombreedte.
- Te lange geheugenbenaming in de Blackbox-keuzelijst.
- Inconsistente lettertypen en achtergrondkleur bij opstarten en in invoervelden.

## Verificatie

De volledige testsuite is geslaagd: **484 suites, 9.025 tests**. TypeScript-controles voor native en web zijn geslaagd. De browserbundelscan is geslaagd. ESLint meldt **0 fouten**, met de bestaande 469 waarschuwingen.

De [browsermatrix](verification/firecom-layout-audit.json) bevat **84 gecontroleerde combinaties**: 21 schermen/werkstromen op 320, 390, 768 en 1280 CSS-pixels. De echte productiecomponenten zijn lokaal weergegeven via bestaande expliciete testfixtures. Dit zijn geen metingen van een aangesloten vluchtcontroller. In deze gecontroleerde toestanden zijn geen te kleine bedieningselementen, onvoldoende tekstcontrasten, afgekapte labels of onbedoeld afgeknipte knoppen aangetroffen na de correcties. Opzettelijk scrollbare navigatie en de LED-canvas blijven scrollbaar.

De echte Home-route naar de eenvoudige en de geavanceerde firmwaretool is apart geopend. De toetsenbordfocus blijft zichtbaar met een gouden rand. De telefoongids bevat alle 17 bestemmingen en de selecties zijn ook in componenttests gecontroleerd.

Fysieke USB-, motor- en radiotests en een nieuwe Android-APK zijn niet uitgevoerd in deze wijziging. Bestaande gidsafbeeldingen zijn illustratiemateriaal; de schermcomponenten zelf gebruiken het nieuwe thema.

## Publicatie

- Broncode: https://github.com/FPVARABIC/FPV-ARBCON-NL
- Publieke webapp: https://fpvarabic.github.io/FPV-ARBCON-NL/
- De Nederlandse GitHub Pages-publicatie staat op de aparte `gh-pages`-branch. De Arabische editie wordt niet gewijzigd.
