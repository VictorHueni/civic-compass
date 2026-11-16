# Boussole citoyenne

Un lanceur pour la politique suisse et genevoise : les sites des partis classés **de gauche à droite**, les outils qui aident à décider lors des votations, et les sites de l'État.

Site statique, sans dépendance : ouvrez `index.html`.

## Contenu

- **Partis** : navigation de gauche à droite, au niveau suisse et genevois. Le classement est indicatif (usage courant des médias et de la recherche).
- **Aider à décider** : smartvote, smartmonitor, PolitPro, Vimentis, easyvote, Swissvotes, Année politique suisse.
- **Sites de l'État** : Confédération, Parlement, Chancellerie, canton et Grand Conseil de Genève.

## Modifier les liens

Tout est dans `js/data.js`. Ajoutez ou corrigez une entrée, puis poussez : le workflow **Contrôle des liens** (`.github/workflows/links.yml`) teste chaque URL à chaque push et chaque lundi.

## Outil local

`tools/boussole.py` tourne sur votre machine (Python 3.8+, aucune dépendance) :

```
python3 tools/boussole.py liens             # teste tous les liens de js/data.js
python3 tools/boussole.py sieges --show     # montre les colonnes du fichier de l'OFS
python3 tools/boussole.py sieges            # écrit data/sieges-cn-2023.json
```

Le fichier des sièges vient de l'OFS (opendata.swiss, élections au Conseil national 2023). Si l'outil ne reconnaît pas les colonnes, relancez avec `--col-nom N --col-sieges N`. Contrôlez que le total fait 200 sièges. Pour les votations et le Parlement : voir Swissvotes (CSV) et api.openparldata.ch.

## Design

Apparence basée sur le [Design System de la Confédération](https://swiss.github.io/designsystem/) (licence MIT, voir `css/DESIGNSYSTEM-LICENSE.txt`). Ce site est indépendant et n'est pas un site officiel : il ne reprend ni les armoiries ni les logos de la Confédération.

## Publication

Le workflow `pages.yml` publie le site sur GitHub Pages. Dans le dépôt : Settings, Pages, Source : GitHub Actions.

## Licence

Code du site : MIT. Fichiers `css/designsystem.css` et `css/fonts` : voir la licence du Design System de la Confédération.
