/* Données du prochain scrutin. Sources : admin.ch (objets, brochure), pages officielles des cantons,
   sites des partis et presse. Les mots d'ordre sont PARTIELS : seuls ceux retrouvés dans une source
   sont renseignés, les autres partis restent "à confirmer". Clés de "partis" = abréviations de data.js. */
window.VOTATIONS = {
  date: "2026-11-29",
  libelle: "Votation populaire du 29 novembre 2026",
  materiel: "Le matériel de vote est reçu entre le 2 et le 6 novembre 2026.",
  page: "https://www.admin.ch/fr/votation-populaire-du-29-novembre-2026",
  brochure: "https://www.admin.ch/dam/fr/sd-web/HXhFMFWOaa6u/BAR_Erlaeuterungen_Nov26_FR_v6.pdf",
  objets: [
    { id: "avs", court: "AVS et TVA", titre: "Financement additionnel de l'AVS par une hausse de la TVA",
      question: "Faut-il relever la TVA pour financer la 13e rente AVS ?",
      oui: "La TVA augmente et finance en partie la 13e rente. La Confédération estime les recettes à 1,4 milliard de francs par an.",
      non: "Pas de hausse de la TVA. Les opposants veulent d'autres mesures, comme un relèvement de l'âge de la retraite.",
      cf: null, lien: "https://www.admin.ch/fr/votation-populaire-du-29-novembre-2026",
      partis: { "PS": "oui", "Verts": "oui", "PLR": "non", "solidaritéS": "non" } },
    { id: "feux", court: "Feux d'artifice", titre: "Initiative « Pour une limitation des feux d'artifice »",
      question: "Faut-il limiter l'usage des feux d'artifice ?",
      oui: "Les feux d'artifice sont limités par la Constitution.",
      non: "Le Conseil fédéral et le Parlement jugent l'initiative trop radicale : pour beaucoup, les feux font partie des fêtes du 1er août et du Nouvel An.",
      cf: "non", lien: "https://www.admin.ch/fr/initiative-feux-artifice",
      partis: { "PLR": "non" } },
    { id: "couples", court: "Couples mariés", titre: "Initiative « Oui à des impôts fédéraux équitables pour les couples mariés »",
      question: "Faut-il mettre fin au désavantage fiscal des couples mariés ?",
      oui: "L'impôt fédéral direct ne pénalise plus les couples mariés par rapport aux couples non mariés.",
      non: "Le système d'imposition actuel est maintenu.",
      cf: null, lien: "https://www.admin.ch/fr/votation-populaire-du-29-novembre-2026",
      partis: { "Centre": "oui", "UDC": "oui" } },
    { id: "armes", court: "Matériel de guerre", titre: "Modification de la loi sur le matériel de guerre",
      question: "Faut-il assouplir les règles d'exportation d'armes ?",
      oui: "La loi modifiée est acceptée. Le Conseil fédéral et le Parlement la recommandent.",
      non: "Le comité référendaire craint un affaiblissement de la loi, avec des exportations possibles vers des régimes qui violent les droits humains.",
      cf: "oui", lien: "https://www.seco.admin.ch/fr/votation-lfmg",
      partis: {} }
  ],
  // Objets et pages cantonales (seulement ce qui a été retrouvé dans une source officielle).
  cantons: {
    VS: { objets: ["Loi sur la société de gestion et d'exploitation de l'aéroport de Sion Valais-Wallis"], lien: "https://www.vs.ch/web/votel" },
    VD: { objets: [], lien: "https://www.vd.ch/etat-droit-finances/votations-et-elections/votation-federale-du-29-novembre-2026" },
    GE: { objets: [], lien: "https://www.ge.ch/elections" },
    FR: { objets: [], lien: "https://www.fr.ch/etat-et-droit/votations-elections-et-droits-politiques/votations-informations-sur-les-objets-de-vote-et-resultats" },
    NE: { objets: [], lien: "https://www.ne.ch" },
    JU: { objets: [], lien: "https://www.jura.ch" }
  },
  // Sources des mots d'ordre, affichées sous le graphique.
  sources: [
    ["PLR : NON à la hausse de la TVA", "https://www.plr.ch/votations-campagnes/recommandations-de-vote"],
    ["Prises de position citées par solidaritéS Neuchâtel", "https://solidarites.ch/ne/2026/10/27/votation-populaire-du-29-novembre-2026/"],
    ["Sondage SSR et tendances par parti", "https://www.rts.ch/info/suisse/2026/article/votations-du-29-novembre-issue-incertaine-selon-le-sondage-ssr-29392960.html"]
  ]
};
