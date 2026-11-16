(function () {
  var D = window.BOUSSOLE, V = window.VOTATIONS, B = window.Boussole;
  var NS = "http://www.w3.org/2000/svg";
  var $ = function (id) { return document.getElementById(id); };
  var esc = B.esc, hote = B.hote;
  var obj = -1, etape = 0, pIdx = -1;
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
  var MOIS_JOUR = "Dimanche 29 novembre 2026";
  function cantonalHtml() {
    var cant = lienCanton(), et = B.etat();
    if (et.niveau !== "canton") return "";
    return '<p class="cant">' + (cant.objets.length
      ? '<b>' + esc(B.nomCanton(et.canton)) + ' vote aussi sur :</b> ' + cant.objets.map(esc).join(" ; ") + ' <a href="' + esc(cant.lien) + '" target="_blank" rel="noopener noreferrer">Détails</a>'
      : '<b>' + esc(B.nomCanton(et.canton)) + ' :</b> aucun objet cantonal retrouvé. <a href="' + esc(cant.lien) + '" target="_blank" rel="noopener noreferrer">Vérifier sur le site du canton</a>') + '</p>';
  }
  function renderScrutin() {
    if (obj < 0) return renderListe();
    var j = jours(), o = V.objets[obj], n = V.objets.length;
    var tabs = ETAPES.map(function (e, i) {
      return '<button type="button" role="tab" class="etape' + (i === etape ? " is-on" : "") + '" data-etape="' + i + '" aria-selected="' + (i === etape) + '">' + e + '</button>';
    }).join("");
    $("scrutin").innerHTML =
      '<button type="button" class="retour" data-obj="-1">← Les ' + n + ' objets</button>' +
      '<p class="kicker">Objet ' + (obj + 1) + ' sur ' + n + '</p>' +
      '<h1 id="t-scrutin" class="h-page">' + esc(o.titre) + '</h1><p class="lede">' + esc(o.question) + '</p>' +
      '<div role="tablist" class="etapes" aria-label="Étapes">' + tabs + '</div><div class="etape__corps" id="etape-corps"></div>' +
      '<nav class="suite" aria-label="Autres objets">' +
      (obj > 0 ? '<button type="button" data-obj="' + (obj - 1) + '">← ' + esc(V.objets[obj - 1].court) + '</button>' : '<span></span>') +
      (obj < n - 1 ? '<button type="button" data-obj="' + (obj + 1) + '">' + esc(V.objets[obj + 1].court) + ' →</button>' : '<span></span>') + '</nav>';
    renderEtape();
  }
  function renderListe() {
    var j = jours(), n = V.objets.length;
    var cd = j > 1 ? "dans " + j + " jours" : j === 1 ? "demain" : j === 0 ? "aujourd'hui" : "scrutin passé";
    var lis = V.objets.map(function (x, i) {
      return '<li><button type="button" class="so" data-obj="' + i + '"><span class="so__n" aria-hidden="true">' + (i + 1) + '</span><span class="so__t"><b>' + esc(x.court) + '</b><span>' + esc(x.question) + '</span></span><span class="so__fl" aria-hidden="true">→</span></button></li>';
    }).join("");
    $("scrutin").innerHTML =
      '<p class="kicker">' + MOIS_JOUR + ' · ' + cd + '</p>' +
      '<h1 id="t-scrutin" class="h-page">' + n + ' objets à trancher</h1>' +
      '<p class="lede">Touchez un objet pour comprendre l\'enjeu, comparer les positions et décider. ' + esc(V.materiel) + '</p>' + cantonalHtml() +
      '<ol class="sommaire">' + lis + '</ol>';
  }
  function renderEtape() {
    var o = V.objets[obj], h = "", et = B.etat(), cant = lienCanton();
    if (etape === 0) {
      h = '<div class="oui-non"><div class="on on--oui"><h4>Si vous votez OUI</h4><p>' + esc(o.oui) + '</p></div><div class="on on--non"><h4>Si vous votez NON</h4><p>' + esc(o.non) + '</p></div></div>' +
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

  function tout() { renderScrutin(); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-obj],[data-etape]") : null;
    if (!t) return;
    if (t.hasAttribute("data-obj")) { obj = +t.getAttribute("data-obj"); pIdx = -1; etape = 0; renderScrutin(); if (obj >= 0) window.scrollTo(0, 0); }
    else if (t.hasAttribute("data-etape")) { etape = +t.getAttribute("data-etape"); renderScrutin(); }
  });
  document.addEventListener("boussole:maj", tout);
  tout();
})();
