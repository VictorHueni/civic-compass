/* Adaptateur : transforme window.DONNEES (généré depuis data/*.json par tools/boussole.py generer)
   en window.BOUSSOLE et window.VOTATIONS, les formes qu'attendent app.js et scrutin.js.
   Les données ne se modifient pas ici : voir data/*.json. */
(function () {
  var D = window.DONNEES;

  function parti(x) {
    var o = { id: x.id, nom: x.nom, abbr: x.abbr, court: x.court, position: x.position, desc: x.description, url: x.url, statut: x.statut };
    for (var k in (x.faits || {})) o[k] = x.faits[k];
    return o;
  }
  function nomTerritoire(code) {
    if (code === "CH") return "Suisse";
    for (var i = 0; i < D.territoires.length; i++) if (D.territoires[i].code === code) return D.territoires[i].nom;
    return code;
  }
  // Sites de l'État : [territoire affiché, nom, description, url]. Les sites sans URL sont omis.
  function etat(code) {
    return D.etat.filter(function (x) { return x.territoire === code && x.url; })
      .map(function (x) { return [nomTerritoire(code), x.nom, x.description, x.url]; });
  }
  function partis(code) {
    return D.partis.filter(function (x) { return x.territoire === code; }).map(parti);
  }

  var cantons = {};
  D.territoires.forEach(function (t) {
    if (t.code === "CH" || !partis(t.code).length) return;
    cantons[t.code] = { nom: t.nom, note: t.note || "", partis: partis(t.code), etat: etat(t.code) };
  });

  window.BOUSSOLE = {
    tousCantons: D.territoires.filter(function (t) { return t.code !== "CH"; }).map(function (t) { return [t.code, t.nom]; }),
    federal: { partis: partis("CH"), etat: etat("CH") },
    outils: D.outils.filter(function (x) { return x.url; }).map(function (x) { return [x.nom, x.description, x.url]; }),
    cantons: cantons
  };

  var V = JSON.parse(JSON.stringify(D.votation));
  V.sources = V.sources.map(function (s) { return [s.titre, s.url]; });
  window.VOTATIONS = V;
})();
