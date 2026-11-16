/* Données de la Boussole citoyenne.
   - federal.partis et cantons.XX.partis : classés de gauche à droite (position indicative).
   - url: null = site pas encore vérifié : la fiche propose alors une recherche.
   - Pour ajouter un canton : ajouter une entrée dans "cantons" (code en majuscules).
   Contrôle des liens : python3 tools/boussole.py liens */
(function () {
  function p(nom, abbr, court, position, desc, url, plus) {
    var o = { nom: nom, abbr: abbr, court: court, position: position, desc: desc, url: url };
    for (var k in (plus || {})) o[k] = plus[k];
    return o;
  }
  var GR = "Gauche radicale", GE_ = "Gauche écologiste", CG = "Centre gauche", C = "Centre", CD = "Centre droit", DC = "Droite conservatrice";

  window.BOUSSOLE = {
    // Tous les cantons : "couvert" est calculé d'après la présence de données.
    tousCantons: [
      ["AG","Argovie"],["AI","Appenzell Rhodes-Intérieures"],["AR","Appenzell Rhodes-Extérieures"],["BE","Berne"],["BL","Bâle-Campagne"],["BS","Bâle-Ville"],
      ["FR","Fribourg"],["GE","Genève"],["GL","Glaris"],["GR","Grisons"],["JU","Jura"],["LU","Lucerne"],["NE","Neuchâtel"],["NW","Nidwald"],["OW","Obwald"],
      ["SG","Saint-Gall"],["SH","Schaffhouse"],["SO","Soleure"],["SZ","Schwytz"],["TG","Thurgovie"],["TI","Tessin"],["UR","Uri"],["VD","Vaud"],["VS","Valais"],["ZG","Zoug"],["ZH","Zurich"]
    ],

    federal: {
      partis: [
        p("Parti suisse du travail", "PST-POP", "PST", GR, "Parti communiste et populaire.", "https://pst-pop.ch", { fonde: 1944, cf: 0 }),
        p("solidaritéS", "solidaritéS", "Sol.", "Gauche anticapitaliste", "Mouvement de gauche anticapitaliste et écosocialiste.", "https://www.solidarites.ch"),
        p("Les Vert-e-s suisses", "Verts", "Verts", GE_, "Écologie et justice sociale, issus du mouvement antinucléaire.", "https://www.verts.ch", { fonde: 1983, cf: 0 }),
        p("Parti socialiste suisse", "PS", "PS", CG, "Plus grand parti de gauche, deux sièges au Conseil fédéral.", "https://www.sp-ps.ch", { fonde: 1888, cf: 2 }),
        p("Parti vert'libéral", "PVL", "PVL", C, "Écologie et libéralisme économique.", "https://www.vertliberaux.ch", { fonde: 2007, cf: 0 }),
        p("Le Centre", "Centre", "Centre", C, "Parti du centre, issu du PDC et du PBD.", "https://www.le-centre.ch", { fonde: 2021, cf: 1 }),
        p("Parti évangélique suisse", "PEV", "PEV", C, "Valeurs chrétiennes, politique sociale et environnementale.", "https://www.evppev.ch", { fonde: 1919, cf: 0 }),
        p("Parti libéral-radical", "PLR", "PLR", CD, "Libéralisme économique, deux sièges au Conseil fédéral.", "https://www.plr.ch", { fonde: 2009, cf: 2 }),
        p("Union démocratique du centre", "UDC", "UDC", DC, "Droite conservatrice et nationale, premier parti de Suisse.", "https://www.udc.ch", { fonde: 1971, cf: 2 })
      ],
      etat: [
        ["Suisse", "ch.ch", "Portail officiel de la Confédération : droits politiques et démarches.", "https://www.ch.ch"],
        ["Suisse", "Confédération", "Site central de l'administration fédérale.", "https://www.admin.ch"],
        ["Suisse", "Parlement fédéral", "Objets, débats, votes et élus.", "https://www.parlament.ch"],
        ["Suisse", "Chancellerie fédérale", "Résultats et brochures officielles des votations et élections.", "https://www.bk.admin.ch"],
        ["Suisse", "Fedlex", "Lois fédérales en vigueur.", "https://www.fedlex.admin.ch"],
        ["Suisse", "Office fédéral de la statistique", "Statistiques et résultats électoraux.", "https://www.bfs.admin.ch"]
      ]
    },

    // Outils d'aide à la décision, valables pour tous les niveaux.
    outils: [
      ["smartvote", "Questionnaire qui vous place face aux candidats et aux partis, au fédéral et au cantonal.", "https://www.smartvote.ch"],
      ["smartmonitor", "Comportement de vote réel des élus au Parlement.", "https://www.smartmonitor.ch"],
      ["PolitPro", "Positions des partis suisses sur l'économie, l'Europe et la société.", "https://politpro.eu/fr/suisse/elections"],
      ["Vimentis", "Explications neutres des grands sujets politiques.", "https://www.vimentis.ch"],
      ["easyvote", "Objets de votation expliqués simplement.", "https://www.easyvote.ch"],
      ["Swissvotes", "Toutes les votations fédérales depuis 1848, avec les mots d'ordre des partis.", "https://swissvotes.ch"],
      ["Année politique suisse", "Analyses détaillées de la politique suisse, année par année.", "https://anneepolitique.swiss"]
    ],

    cantons: {
      GE: {
        nom: "Genève", note: "Liste des principaux partis, à compléter avec la composition du Grand Conseil.",
        partis: [
          p("Ensemble à Gauche", "EàG", "EàG", GR, "Coalition de solidaritéS, du Parti du Travail et de la DAL.", "https://www.ensembleagauche.ch"),
          p("Les Vert-e-s Genève", "Verts GE", "Verts", GE_, "Section cantonale des Verts.", "https://www.verts-ge.ch"),
          p("PS Genève", "PS GE", "PS", CG, "Section cantonale du Parti socialiste.", "https://www.ps-ge.ch"),
          p("Vert'libéraux Genève", "PVL GE", "PVL", C, "Section cantonale du Parti vert'libéral.", null),
          p("Le Centre Genève", "Centre GE", "Centre", C, "Section cantonale du Centre.", null),
          p("PLR Genève", "PLR GE", "PLR", CD, "Les Libéraux-Radicaux Genève.", "https://www.plr-ge.ch"),
          p("Mouvement Citoyens Genevois", "MCG", "MCG", "Droite populiste", "Parti régional centré sur la défense des résidents genevois.", "https://www.mcge.ch", { fonde: 2005 }),
          p("UDC Genève", "UDC GE", "UDC", DC, "Section cantonale de l'UDC.", "https://www.udc-ge.ch")
        ],
        etat: [
          ["Genève", "République et canton de Genève", "Site officiel du canton.", "https://www.ge.ch"],
          ["Genève", "Votations et élections", "Résultats et informations officielles du canton.", "https://www.ge.ch/elections"],
          ["Genève", "Grand Conseil", "Parlement cantonal, députés, mémorial, objets.", "https://ge.ch/grandconseil"],
          ["Genève", "Ville de Genève", "Conseil municipal et administration communale.", "https://www.geneve.ch"]
        ]
      },
      VD: {
        nom: "Vaud", note: "Liste des principaux partis, à compléter avec la composition du Grand Conseil.",
        partis: [
          p("Parti ouvrier et populaire Vaud", "POP VD", "POP", GR, "Parti de gauche radicale, avec solidaritéS dans Ensemble à Gauche.", null),
          p("Les Vert-e-s vaudois", "Verts VD", "Verts", GE_, "Section cantonale des Verts.", null),
          p("Parti socialiste vaudois", "PS VD", "PS", CG, "Section cantonale du Parti socialiste.", null),
          p("Vert'libéraux Vaud", "PVL VD", "PVL", C, "Section cantonale du Parti vert'libéral.", null),
          p("Le Centre Vaud", "Centre VD", "Centre", C, "Section cantonale du Centre.", null),
          p("PLR Vaud", "PLR VD", "PLR", CD, "Les Libéraux-Radicaux vaudois.", null),
          p("UDC Vaud", "UDC VD", "UDC", DC, "Section cantonale de l'UDC.", null)
        ],
        etat: [["Vaud", "Canton de Vaud", "Site officiel du canton.", "https://www.vd.ch"]]
      },
      VS: {
        nom: "Valais", note: "Liste des principaux partis, à compléter avec la composition du Grand Conseil.",
        partis: [
          p("Les Vert-e-s valaisans", "Verts VS", "Verts", GE_, "Section cantonale des Verts.", null),
          p("Parti socialiste du Valais romand", "PS VS", "PS", CG, "Section cantonale du Parti socialiste.", null),
          p("Le Centre Valais", "Centre VS", "Centre", C, "Section cantonale du Centre, très présente en Valais.", null),
          p("PLR Valais", "PLR VS", "PLR", CD, "Les Libéraux-Radicaux valaisans.", null),
          p("UDC Valais", "UDC VS", "UDC", DC, "Section cantonale de l'UDC.", null)
        ],
        etat: [["Valais", "Canton du Valais", "Site officiel du canton.", "https://www.vs.ch"]]
      },
      NE: {
        nom: "Neuchâtel", note: "Liste des principaux partis, à compléter avec la composition du Grand Conseil.",
        partis: [
          p("Parti ouvrier et populaire neuchâtelois", "POP NE", "POP", GR, "Parti de gauche radicale.", null),
          p("solidaritéS Neuchâtel", "Sol. NE", "Sol.", "Gauche anticapitaliste", "Section cantonale de solidaritéS.", null),
          p("Les Vert-e-s neuchâtelois", "Verts NE", "Verts", GE_, "Section cantonale des Verts.", null),
          p("Parti socialiste neuchâtelois", "PS NE", "PS", CG, "Section cantonale du Parti socialiste.", null),
          p("Vert'libéraux Neuchâtel", "PVL NE", "PVL", C, "Section cantonale du Parti vert'libéral.", null),
          p("PLR Neuchâtel", "PLR NE", "PLR", CD, "Les Libéraux-Radicaux neuchâtelois.", null),
          p("UDC Neuchâtel", "UDC NE", "UDC", DC, "Section cantonale de l'UDC.", null)
        ],
        etat: [["Neuchâtel", "République et canton de Neuchâtel", "Site officiel du canton.", "https://www.ne.ch"]]
      },
      JU: {
        nom: "Jura", note: "Liste des principaux partis, à compléter avec la composition du Parlement.",
        partis: [
          p("Combat socialiste - POP", "CS-POP", "CS-POP", GR, "Parti de gauche jurassien.", null),
          p("Les Vert-e-s jurassiens", "Verts JU", "Verts", GE_, "Section cantonale des Verts.", null),
          p("Parti socialiste jurassien", "PS JU", "PS", CG, "Section cantonale du Parti socialiste.", null),
          p("Vert'libéraux Jura", "PVL JU", "PVL", C, "Section cantonale du Parti vert'libéral.", null),
          p("Le Centre Jura", "Centre JU", "Centre", C, "Section cantonale du Centre.", null),
          p("PLR Jura", "PLR JU", "PLR", CD, "Les Libéraux-Radicaux jurassiens.", null),
          p("UDC Jura", "UDC JU", "UDC", DC, "Section cantonale de l'UDC.", null)
        ],
        etat: [["Jura", "République et canton du Jura", "Site officiel du canton.", "https://www.jura.ch"]]
      },
      FR: {
        nom: "Fribourg", note: "Liste des principaux partis, à compléter avec la composition du Grand Conseil.",
        partis: [
          p("Les Vert-e-s fribourgeois", "Verts FR", "Verts", GE_, "Section cantonale des Verts.", null),
          p("Parti socialiste fribourgeois", "PS FR", "PS", CG, "Section cantonale du Parti socialiste.", null),
          p("Vert'libéraux Fribourg", "PVL FR", "PVL", C, "Section cantonale du Parti vert'libéral.", null),
          p("Le Centre Fribourg", "Centre FR", "Centre", C, "Section cantonale du Centre.", null),
          p("PLR Fribourg", "PLR FR", "PLR", CD, "Les Libéraux-Radicaux fribourgeois.", null),
          p("UDC Fribourg", "UDC FR", "UDC", DC, "Section cantonale de l'UDC.", null)
        ],
        etat: [["Fribourg", "État de Fribourg", "Site officiel du canton.", "https://www.fr.ch"]]
      }
    }
  };
})();
