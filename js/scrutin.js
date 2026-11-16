(function () {
  var D = window.BOUSSOLE, V = window.VOTATIONS, B = window.Boussole;
  var NS = "http://www.w3.org/2000/svg";
  var $ = function (id) { return document.getElementById(id); };
  var esc = B.esc, hote = B.hote;
  var obj = 0, etape = 0, pIdx = -1;
  var ETAPES = ["Comprendre", "Comparer", "Décider"];
  var LIBELLE = { oui: "Oui", non: "Non" };

  function jours() {
    var d = new Date(V.date + "T00:00:00"), n = new Date();
    n = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return Math.round((d - n) / 86400000);
  }
  function lienCanton() { var c = B.etat(); return V.cantons[c.canton] || { objets: [], lien: "https://www.ch.ch" }; }
  function lien(url, titre, note) {
    return '<a class="fiche__lien" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(titre) + '<small>' + esc(note || hote(url)) + '</small></span><span aria-hidden="true">↗</span></a>';
  }

  /* ---------- 1. Prochain scrutin + 2. fiche objet + 3. parcours ---------- */
  function renderScrutin() {
    var j = jours(), o = V.objets[obj], cant = lienCanton(), et = B.etat();
    var cd = j > 1 ? "Dans " + j + " jours" : j === 1 ? "Demain" : j === 0 ? "Aujourd'hui" : "Scrutin passé";
    var chips = V.objets.map(function (x, i) {
      return '<button type="button" class="chip' + (i === obj ? " is-on" : "") + '" data-obj="' + i + '" aria-pressed="' + (i === obj) + '"><span class="chip__n">' + (i + 1) + '</span>' + esc(x.court) + '</button>';
    }).join("");
    var cantonal = et.niveau === "canton" ? (cant.objets.length
      ? '<p class="scrutin__cant"><strong>' + esc(B.nomCanton(et.canton)) + ' :</strong> ' + cant.objets.map(esc).join(" ; ") + ' <a href="' + esc(cant.lien) + '" target="_blank" rel="noopener noreferrer">Détails</a></p>'
      : '<p class="scrutin__cant">Objet cantonal : aucun retrouvé dans nos sources. <a href="' + esc(cant.lien) + '" target="_blank" rel="noopener noreferrer">Vérifier sur le site du canton</a></p>') : "";
    var tabs = ETAPES.map(function (e, i) {
      return '<button type="button" role="tab" class="etape' + (i === etape ? " is-on" : "") + '" data-etape="' + i + '" aria-selected="' + (i === etape) + '"><span>' + (i + 1) + '</span> ' + e + '</button>';
    }).join("");
    $("scrutin").innerHTML =
      '<div class="prochain"><div class="prochain__j"><b>' + esc(cd) + '</b><span>29 nov. 2026</span></div>' +
      '<div><h1 id="t-scrutin" class="h-page">Prochaine votation</h1><p>' + V.objets.length + ' objets fédéraux. ' + esc(V.materiel) + '</p></div></div>' + cantonal +
      '<div class="chips" role="group" aria-label="Objets de la votation">' + chips + '</div>' +
      '<article class="objet"><h3 class="objet__titre">' + esc(o.titre) + '</h3><p class="objet__q">' + esc(o.question) + '</p>' +
      '<div role="tablist" class="etapes" aria-label="Étapes">' + tabs + '</div><div class="etape__corps" id="etape-corps"></div></article>';
    renderEtape();
  }
  function renderEtape() {
    var o = V.objets[obj], h = "", et = B.etat(), cant = lienCanton();
    if (etape === 0) {
      h = '<div class="oui-non"><div class="on on--oui"><b>Si OUI</b><p>' + esc(o.oui) + '</p></div><div class="on on--non"><b>Si NON</b><p>' + esc(o.non) + '</p></div></div>' +
        (o.cf ? '<p class="reco">Conseil fédéral et Parlement : <b>' + (o.cf === "oui" ? "OUI" : "NON") + '</b></p>' : '<p class="reco">Recommandation du Conseil fédéral : voir la brochure officielle.</p>') +
        '<p class="mini">Résumé indicatif. La brochure officielle fait foi.</p>' +
        lien(o.lien, "Page officielle de l'objet", "admin.ch") + lien(V.brochure, "Brochure officielle (PDF)", "Explications du Conseil fédéral") +
        lien("https://www.easyvote.ch", "easyvote", "Expliqué simplement") + lien("https://www.vimentis.ch", "Vimentis", "Explications neutres");
    } else if (etape === 1) {
      h = '<p class="mini">Mots d\'ordre des partis nationaux. Seuls ceux retrouvés dans une source sont indiqués, les autres sont à confirmer sur le site du parti.</p>' +
        '<div id="mini-hemi" class="hemicycle hemicycle--mini"></div><div id="mini-detail" class="mini-detail" aria-live="polite"></div>' +
        lien("https://www.smartvote.ch", "smartvote", "Comparer avec vos propres opinions") + lien("https://www.smartmonitor.ch", "smartmonitor", "Comment les élus ont réellement voté") + lien("https://swissvotes.ch", "Swissvotes", "Mots d'ordre et historique des votations");
    } else {
      h = '<ol class="decider"><li>Vérifiez que vous avez reçu le matériel de vote (' + esc(V.materiel.replace("Le matériel de vote est reçu", "reçu")) + ').</li>' +
        '<li>Votez par correspondance, ou dans votre commune le dimanche 29 novembre.</li><li>En cas de doute, contactez la chancellerie de votre commune ou de votre canton.</li></ol>' +
        lien(cant.lien, et.niveau === "canton" ? "Votations du canton " + B.nomCanton(et.canton) : "Votations de votre canton", hote(cant.lien)) + lien("https://www.ch.ch", "ch.ch", "Comment voter, droits politiques");
    }
    $("etape-corps").innerHTML = h;
    if (etape === 1) miniHemi();
  }
  function miniHemi() {
    var liste = D.federal.partis, n = liste.length, w = 180 / n, o = V.objets[obj];
    var CX = 180, CY = 178, R = 172, r = 100;
    function pt(rr, d) { var a = d * Math.PI / 180; return [CX + rr * Math.cos(a), CY - rr * Math.sin(a)]; }
    var s = '<svg viewBox="0 0 360 195" role="group" aria-label="Positions des partis sur cet objet">';
    liste.forEach(function (p, i) {
      var a0 = 180 - i * w - 1, a1 = 180 - (i + 1) * w + 1, o0 = pt(R, a0), o1 = pt(R, a1), i1 = pt(r, a1), i0 = pt(r, a0);
      var pos = o.partis[p.abbr] || (o.partis[p.court]) || "";
      var mid = 180 - (i + .5) * w, tp = pt((R + r) / 2, mid), rot = mid > 90 ? 180 - mid : -mid;
      s += '<g class="mp mp--' + (pos || "inconnu") + (i === pIdx ? " is-on" : "") + '" data-i="' + i + '" role="button" tabindex="0" aria-label="' + esc(p.nom) + ' : ' + (pos ? LIBELLE[pos] : "à confirmer") + '">' +
        '<path d="M' + o0 + " A" + R + " " + R + " 0 0 1 " + o1 + " L" + i1 + " A" + r + " " + r + " 0 0 0 " + i0 + ' Z"/>' +
        '<text transform="translate(' + tp[0].toFixed(1) + " " + tp[1].toFixed(1) + ") rotate(" + rot.toFixed(1) + ')" text-anchor="middle" dominant-baseline="central">' + esc(p.court) + '</text></g>';
    });
    s += '</svg><ul class="legende"><li><i class="k k--oui"></i>Oui</li><li><i class="k k--non"></i>Non</li><li><i class="k k--inconnu"></i>À confirmer</li></ul>';
    $("mini-hemi").innerHTML = s;
    Array.prototype.forEach.call($("mini-hemi").querySelectorAll(".mp"), function (g) {
      var f = function () { pIdx = +g.getAttribute("data-i"); miniHemi(); };
      g.addEventListener("click", f);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } });
    });
    var d = $("mini-detail");
    if (pIdx < 0) { d.innerHTML = "Touchez un parti pour voir sa position."; }
    else {
      var p = liste[pIdx], pos = o.partis[p.abbr] || "";
      d.innerHTML = '<b>' + esc(p.nom) + '</b> : ' + (pos ? '<span class="pos pos--' + pos + '">' + LIBELLE[pos] + '</span>' : 'à confirmer') +
        (p.url ? ' · <a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">site du parti ↗</a>' : "");
    }
  }

  /* ---------- Je veux... : navigation vers les pages et les sites officiels ---------- */
  function renderBesoins() {
    var et = B.etat(), fed = et.niveau === "federal", c = fed ? D.federal : D.cantons[et.canton];
    function cherche(mot, defaut) { var l = c.etat.filter(function (x) { return x[1].toLowerCase().indexOf(mot) > -1; })[0]; return l ? l[3] : defaut; }
    var cant = lienCanton();
    var items = [
      ["Voir les partis politiques", "De gauche à droite", "#partis", true],
      ["Être aidé à décider", "Comprendre, comparer, décider", "#aides", true],
      ["Lire une loi", "Textes en vigueur", fed ? "https://www.fedlex.admin.ch" : c.etat[0][3]],
      ["Trouver un élu", "Députés et conseillers", fed ? "https://www.parlament.ch" : cherche("grand conseil", c.etat[0][3])],
      ["Voir les résultats", "Votations et élections", fed ? "https://www.bk.admin.ch" : cherche("votations", cant.lien)],
      ["Consulter les chiffres", "Statistiques officielles", "https://www.bfs.admin.ch"]
    ];
    var h = '<h2 id="t-besoins">Je veux...</h2><p class="bloc__desc">Aller directement au bon endroit (' + (fed ? "toute la Suisse" : "canton " + esc(B.nomCanton(et.canton))) + ').</p><ul class="besoins">';
    items.forEach(function (x) {
      h += '<li><a class="besoin' + (x[3] ? " besoin--int" : "") + '" href="' + esc(x[2]) + '"' + (x[3] ? "" : ' target="_blank" rel="noopener noreferrer"') + '><b>' + esc(x[0]) + (x[3] ? "" : ' <span aria-hidden="true">↗</span>') + '</b><span>' + esc(x[1]) + '</span></a></li>';
    });
    $("besoins").innerHTML = h + '</ul>';
  }

  function tout() { renderScrutin(); renderBesoins(); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-obj],[data-etape]") : null;
    if (!t) return;
    if (t.hasAttribute("data-obj")) { obj = +t.getAttribute("data-obj"); pIdx = -1; renderScrutin(); }
    else if (t.hasAttribute("data-etape")) { etape = +t.getAttribute("data-etape"); renderScrutin(); }
  });
  document.addEventListener("boussole:maj", tout);
  tout();
})();
