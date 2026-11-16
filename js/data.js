/* Données de la Boussole citoyenne.
   Partis : classés de gauche à droite (position indicative, voir README).
   Pour corriger un lien : modifier l'url ci-dessous, le contrôle des liens
   (GitHub Actions) vérifie ensuite tout le fichier. */
window.BOUSSOLE = {
  partis: {
    Suisse: [
      { nom: "Parti suisse du travail", abbr: "PST-POP", court: "PST", position: "Gauche radicale", desc: "Parti communiste et populaire, fondé en 1944.", url: "https://pst-pop.ch" },
      { nom: "solidaritéS", abbr: "solidaritéS", court: "Sol.", position: "Gauche anticapitaliste", desc: "Mouvement de gauche anticapitaliste et écosocialiste.", url: "https://www.solidarites.ch" },
      { nom: "Les Vert-e-s suisses", abbr: "Verts", court: "Verts", position: "Gauche écologiste", desc: "Écologie politique et justice sociale, issus du mouvement antinucléaire.", url: "https://www.verts.ch" },
      { nom: "Parti socialiste suisse", abbr: "PS", court: "PS", position: "Centre gauche", desc: "Plus grand parti de gauche, deux sièges au Conseil fédéral.", url: "https://www.sp-ps.ch" },
      { nom: "Parti vert'libéral", abbr: "PVL", court: "PVL", position: "Centre", desc: "Écologie et libéralisme économique.", url: "https://www.vertliberaux.ch" },
      { nom: "Le Centre", abbr: "Centre", court: "Centre", position: "Centre", desc: "Parti du centre, issu du PDC et du PBD.", url: "https://www.le-centre.ch" },
      { nom: "Parti évangélique suisse", abbr: "PEV", court: "PEV", position: "Centre", desc: "Valeurs chrétiennes, politique sociale et environnementale.", url: "https://www.evppev.ch" },
      { nom: "Parti libéral-radical", abbr: "PLR", court: "PLR", position: "Centre droit", desc: "Libéralisme économique, deux sièges au Conseil fédéral.", url: "https://www.plr.ch" },
      { nom: "Union démocratique du centre", abbr: "UDC", court: "UDC", position: "Droite conservatrice", desc: "Droite conservatrice et nationale, premier parti de Suisse.", url: "https://www.udc.ch" }
    ],
    "Genève": [
      { nom: "Ensemble à Gauche", abbr: "EàG", court: "EàG", position: "Gauche radicale", desc: "Coalition de solidaritéS, du Parti du Travail et de la DAL.", url: "https://www.ensembleagauche.ch" },
      { nom: "Les Vert-e-s Genève", abbr: "Verts GE", court: "Verts", position: "Gauche écologiste", desc: "Section cantonale des Verts.", url: "https://www.verts-ge.ch" },
      { nom: "PS Genève", abbr: "PS GE", court: "PS", position: "Centre gauche", desc: "Section cantonale du Parti socialiste.", url: "https://www.ps-ge.ch" },
      { nom: "PLR Genève", abbr: "PLR GE", court: "PLR", position: "Centre droit", desc: "Les Libéraux-Radicaux Genève.", url: "https://www.plr-ge.ch" },
      { nom: "Mouvement Citoyens Genevois", abbr: "MCG", court: "MCG", position: "Droite populiste", desc: "Parti régional centré sur la défense des résidents genevois.", url: "https://www.mcge.ch" },
      { nom: "UDC Genève", abbr: "UDC GE", court: "UDC", position: "Droite conservatrice", desc: "Section cantonale de l'UDC.", url: "https://www.udc-ge.ch" }
    ]
  },
  // [section, niveau, nom, note, url]
  liens: [
    ["Aider à décider", "Suisse", "smartvote", "Questionnaire qui vous place face aux candidats et aux partis, au fédéral et au cantonal.", "https://www.smartvote.ch"],
    ["Aider à décider", "Suisse", "smartmonitor", "Comportement de vote réel des élus au Parlement.", "https://www.smartmonitor.ch"],
    ["Aider à décider", "Suisse", "PolitPro", "Positions des partis suisses sur l'économie, l'Europe et la société.", "https://politpro.eu/fr/suisse/elections"],
    ["Aider à décider", "Suisse", "Vimentis", "Explications neutres des grands sujets politiques.", "https://www.vimentis.ch"],
    ["Aider à décider", "Suisse", "easyvote", "Objets de votation expliqués simplement.", "https://www.easyvote.ch"],
    ["Aider à décider", "Suisse", "Swissvotes", "Toutes les votations fédérales depuis 1848, avec les mots d'ordre des partis.", "https://swissvotes.ch"],
    ["Aider à décider", "Suisse", "Année politique suisse", "Analyses détaillées de la politique suisse, année par année.", "https://anneepolitique.swiss"],
    ["Sites de l'État", "Suisse", "ch.ch", "Portail officiel de la Confédération : droits politiques et démarches.", "https://www.ch.ch"],
    ["Sites de l'État", "Suisse", "Confédération", "Site central de l'administration fédérale.", "https://www.admin.ch"],
    ["Sites de l'État", "Suisse", "Parlement fédéral", "Objets, débats, votes et élus.", "https://www.parlament.ch"],
    ["Sites de l'État", "Suisse", "Chancellerie fédérale", "Résultats et brochures officielles des votations et élections.", "https://www.bk.admin.ch"],
    ["Sites de l'État", "Suisse", "Fedlex", "Lois fédérales en vigueur.", "https://www.fedlex.admin.ch"],
    ["Sites de l'État", "Suisse", "Office fédéral de la statistique", "Statistiques et résultats électoraux.", "https://www.bfs.admin.ch"],
    ["Sites de l'État", "Genève", "République et canton de Genève", "Site officiel du canton.", "https://www.ge.ch"],
    ["Sites de l'État", "Genève", "Votations et élections", "Résultats et informations officielles du canton.", "https://www.ge.ch/elections"],
    ["Sites de l'État", "Genève", "Grand Conseil", "Parlement cantonal, députés, mémorial, objets.", "https://ge.ch/grandconseil"],
    ["Sites de l'État", "Genève", "Ville de Genève", "Conseil municipal et administration communale.", "https://www.geneve.ch"]
  ]
};
