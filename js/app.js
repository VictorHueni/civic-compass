(function () {
  var D = window.BOUSSOLE;
  var NS = "http://www.w3.org/2000/svg";
  var niveau = "federal";      // "federal" ou "canton"
  var canton = "GE";           // dernier canton choisi
  var index = 0, requete = "", page = "votation";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function hote(u) { return u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); }
  function el(nom, attrs, parent) {
    var e = document.createElementNS(NS, nom);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function nomCanton(code) { for (var i = 0; i < D.tousCantons.length; i++) if (D.tousCantons[i][0] === code) return D.tousCantons[i][1]; return code; }
  function deCanton(code) { var n = nomCanton(code); return code === "JU" || code === "VS" ? "du " + n : (/^[AEIOUÉ]/.test(n) ? "d'" : "de ") + n; }
  function couvert(code) { return !!D.cantons[code]; }
  function courant() { return niveau === "federal" ? D.federal : D.cantons[canton]; }
  function codeNiveau() { return niveau === "federal" ? "CH" : canton; }

  /* ---------- Territoire (Toute la Suisse ou un canton), choisi sur la carte ---------- */
  var PAGES = ["votation", "partis", "aides", "etat"];
  function lire(h) {
    h = (h || "").replace(/^#\/?/, "").toLowerCase().split("/");
    var p = h[0], s = h[1], r = {};
    if (PAGES.indexOf(p) > -1) { r.p = p; } else if (p === "federal" || (p && couvert(p.toUpperCase()))) { r.p = "votation"; s = p; }
    if (s === "federal") { r.n = "federal"; } else if (s && couvert(s.toUpperCase())) { r.n = "canton"; r.c = s.toUpperCase(); }
    return r;
  }
  function cleScope() { return niveau === "federal" ? "federal" : canton.toLowerCase(); }
  function majAdresse() { if (history.replaceState) { try { history.replaceState(null, "", "#" + page + "/" + cleScope()); } catch (e) {} } }
  function memoriser() { try { localStorage.setItem("boussole-niveau", cleScope()); localStorage.setItem("boussole-canton", canton); } catch (e) {} }
  function majBarre() {
    renderMenuEtat();
    $("scope-val").textContent = niveau === "federal" ? "Toute la Suisse" : nomCanton(canton);
    Array.prototype.forEach.call(document.querySelectorAll("#menu a[data-page]"), function (l) {
      if (l.getAttribute("data-page") === page) l.setAttribute("aria-current", "page"); else l.removeAttribute("aria-current");
    });
    PAGES.forEach(function (p) { $("page-" + p).hidden = p !== page; });
  }
  function appliquer(n, c) { niveau = n; if (c) canton = c; index = 0; memoriser(); majAdresse(); majBarre(); renderTout(); }
  function allerPage(p) {
    page = p; majAdresse(); majBarre(); fermerMenu(); renderTout(); window.scrollTo(0, 0);
  }
  function renderTout() {
    if (page === "partis") { renderTitre(); renderHemicycle(); renderDetail(); }
    if (page === "etat") renderLiens();
    if (page === "aides") renderAides();
    try { document.dispatchEvent(new CustomEvent("boussole:maj")); } catch (e) {}
  }

  /* ---------- Menu "Voir ce que fait l'État" : sites officiels selon le territoire ---------- */
  function renderMenuEtat() {
    var fed = niveau === "federal", c = courant(), V = window.VOTATIONS || { cantons: {} };
    var cant = V.cantons[canton] || { lien: c.etat[0][3] };
    function cherche(mot, defaut) { var l = c.etat.filter(function (x) { return x[1].toLowerCase().indexOf(mot) > -1; })[0]; return l ? l[3] : defaut; }
    var items = [
      ["Lire une loi", fed ? "https://www.fedlex.admin.ch" : c.etat[0][3]],
      ["Trouver un élu", fed ? "https://www.parlament.ch" : cherche("grand conseil", c.etat[0][3])],
      ["Voir les résultats", fed ? "https://www.bk.admin.ch" : cherche("votations", cant.lien)],
      ["Consulter les chiffres", "https://www.bfs.admin.ch"]
    ];
    $("menu-etat").innerHTML = items.map(function (x) {
      return '<li><a href="' + esc(x[1]) + '" target="_blank" rel="noopener noreferrer"><b>' + esc(x[0]) + ' <span aria-hidden="true">↗</span></b><small>' + esc(hote(x[1])) + '</small></a></li>';
    }).join("") + '<li><a href="#etat" data-page="etat"><b>Tous les sites officiels</b><small>Liste complète et recherche</small></a></li>';
  }

  /* ---------- Menu (hamburger sur téléphone, déplié sur ordinateur) ---------- */
  function fermerMenu() { document.body.classList.remove("menu-ouvert"); $("menu-btn").setAttribute("aria-expanded", "false"); }
  $("menu-btn").addEventListener("click", function () {
    var ouvert = document.body.classList.toggle("menu-ouvert");
    $("menu-btn").setAttribute("aria-expanded", String(ouvert));
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fermerMenu(); });
  window.addEventListener("hashchange", function () {
    var d = lire(location.hash);
    if (d.p && d.p !== page) page = d.p;
    if (d.n && (d.n !== niveau || (d.c && d.c !== canton))) { niveau = d.n; if (d.c) canton = d.c; memoriser(); }
    majBarre(); renderTout();
  });
  $("menu").addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) { fermerMenu(); window.scrollTo(0, 0); } });

  /* ---------- Carte des cantons (feuille qui monte du bas) ---------- */
  var GRILLE = { SH: [4, 0], TG: [5, 0], BS: [1, 1], BL: [2, 1], AG: [3, 1], ZH: [4, 1], SG: [5, 1], AR: [6, 1], AI: [7, 1],
    JU: [0, 2], SO: [1, 2], LU: [2, 2], ZG: [3, 2], SZ: [4, 2], GL: [5, 2], NE: [0, 3], BE: [1, 3], OW: [2, 3], NW: [3, 3], UR: [4, 3], GR: [5, 3],
    VD: [0, 4], FR: [1, 4], GE: [0, 5], VS: [2, 5], TI: [4, 5] };
  var retourFocus = null;
  function renderTuiles() {
    var V = window.VOTATIONS || { cantons: {} }, h = "";
    Object.keys(GRILLE).forEach(function (k) {
      var ok = couvert(k), g = GRILLE[k], on = niveau === "canton" && canton === k, vot = V.cantons[k] && V.cantons[k].objets.length;
      h += '<button type="button" class="tuile' + (ok ? " ok" : "") + (on ? " is-on" : "") + '" style="grid-column:' + (g[0] + 1) + ';grid-row:' + (g[1] + 1) + '" data-c="' + k + '"' + (ok ? "" : " disabled") +
        ' aria-label="' + esc(nomCanton(k)) + (ok ? "" : ", bientôt") + (vot ? ", objet cantonal en votation" : "") + '">' + k + (vot ? '<i aria-hidden="true"></i>' : "") + '</button>';
    });
    $("tuiles").innerHTML = h;
    $("scope-ch").className = "scope-tout" + (niveau === "federal" ? " is-on" : "");
  }
  function ouvrirPicker() { retourFocus = $("scope-btn"); renderTuiles(); $("picker").hidden = false; document.body.style.overflow = "hidden"; $("scope-ch").focus(); }
  function fermerPicker() { $("picker").hidden = true; document.body.style.overflow = ""; if (retourFocus) retourFocus.focus(); }
  $("scope-btn").addEventListener("click", ouvrirPicker);
  $("picker-fond").addEventListener("click", fermerPicker);
  $("picker-x").addEventListener("click", fermerPicker);
  $("scope-ch").addEventListener("click", function () { fermerPicker(); appliquer("federal", null); });
  $("tuiles").addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".tuile") : null;
    if (!b || b.disabled) return;
    fermerPicker(); appliquer("canton", b.getAttribute("data-c"));
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("picker").hidden) fermerPicker(); });

  /* ---------- Hémicycle ---------- */
  var CX = 180, CY = 178, R = 172, r = 88, GAP = 1.6;
  function pt(rayon, deg) { var a = deg * Math.PI / 180; return [CX + rayon * Math.cos(a), CY - rayon * Math.sin(a)]; }
  function listePartis() { return courant().partis; }
  function renderTitre() {
    $("niveau-titre").textContent = niveau === "federal"
      ? "Partis représentés au niveau fédéral. Touchez un parti, ou glissez vers la gauche et la droite."
      : "Principaux partis du canton " + deCanton(canton) + ". Touchez un parti, ou glissez vers la gauche et la droite.";
    $("note-niveau").textContent = niveau === "federal" ? "" : (courant().note || "");
  }
  function renderHemicycle() {
    var liste = listePartis(), n = liste.length, w = 180 / n;
    var box = $("hemicycle");
    box.innerHTML = "";
    var svg = el("svg", { viewBox: "0 0 360 200", role: "group", "aria-label": "Hémicycle des partis, de gauche à droite" }, box);
    liste.forEach(function (p, i) {
      var a0 = 180 - i * w - GAP / 2, a1 = 180 - (i + 1) * w + GAP / 2;
      var o0 = pt(R, a0), o1 = pt(R, a1), i1 = pt(r, a1), i0 = pt(r, a0);
      var d = "M" + o0 + " A" + R + " " + R + " 0 0 1 " + o1 + " L" + i1 + " A" + r + " " + r + " 0 0 0 " + i0 + " Z";
      var g = el("g", {
        "class": "sect" + (i === index ? " is-active" : ""),
        role: "button", tabindex: "0", "aria-pressed": String(i === index),
        "aria-label": p.nom + ", " + p.position + ", position " + (i + 1) + " sur " + n
      }, svg);
      el("path", { d: d }, g);
      var mid = 180 - (i + 0.5) * w, pos = pt((R + r) / 2, mid);
      var rot = mid > 90 ? 180 - mid : -mid;
      var t = el("text", { transform: "translate(" + pos[0].toFixed(1) + " " + pos[1].toFixed(1) + ") rotate(" + rot.toFixed(1) + ")", "text-anchor": "middle", "dominant-baseline": "central" }, g);
      t.textContent = p.court;
      var choisir = function () { index = i; renderHemicycle(); renderDetail(); };
      g.addEventListener("click", choisir);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choisir(); } });
    });
    var c1 = el("text", { x: CX, y: CY - 30, "text-anchor": "middle", "class": "centre-nom" }, svg);
    c1.textContent = liste[index].court;
    var c2 = el("text", { x: CX, y: CY - 8, "text-anchor": "middle", "class": "centre-rang" }, svg);
    c2.textContent = (index + 1) + " sur " + n;
    var g1 = el("text", { x: 4, y: 196, "class": "axe" }, svg); g1.textContent = "← Gauche";
    var g2 = el("text", { x: 356, y: 196, "text-anchor": "end", "class": "axe" }, svg); g2.textContent = "Droite →";
  }

  function renderDetail() {
    var liste = listePartis(), p = liste[index];
    var faits = [["Position", p.position]];
    if (p.fonde) faits.push(["Fondé en", String(p.fonde)]);
    if (typeof p.cf === "number") faits.push(["Conseil fédéral", p.cf ? p.cf + (p.cf > 1 ? " sièges" : " siège") : "Aucun siège"]);
    var dl = faits.map(function (f) { return '<div class="fiche__ligne"><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join("");
    var lien;
    if (p.url) {
      lien = '<a class="fiche__lien" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer"><span>Site du parti<small>' + esc(hote(p.url)) + '</small></span><span aria-hidden="true">↗</span></a>';
    } else {
      lien = '<a class="fiche__lien fiche__lien--cherche" href="https://duckduckgo.com/?q=' + encodeURIComponent(p.nom) + '" target="_blank" rel="noopener noreferrer"><span>Chercher le site du parti<small>adresse pas encore vérifiée</small></span><span aria-hidden="true">↗</span></a>';
    }
    $("detail").innerHTML =
      '<h3 class="fiche__nom">' + esc(p.nom) + '</h3>' +
      '<p class="fiche__desc">' + esc(p.desc) + '</p>' +
      '<dl class="fiche__faits">' + dl + '</dl>' + lien;
    $("prev").disabled = index === 0;
    $("next").disabled = index === liste.length - 1;
  }
  function aller(delta) {
    var ni = Math.max(0, Math.min(listePartis().length - 1, index + delta));
    if (ni === index) return;
    index = ni; renderHemicycle(); renderDetail();
  }

  function carte(nom, note, url, badge) {
    return '<li><a class="carte" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="carte__tete"><span class="carte__nom">' + esc(nom) + '</span><span class="badge badge--gray">' + esc(badge) + '</span></span>' +
      '<span class="carte__note">' + esc(note) + '</span><span class="host">' + esc(hote(url)) + '</span></a></li>';
  }

  /* ---------- Aides à décider : comprendre, comparer, décider ---------- */
  function renderAides() {
    var cant = (window.VOTATIONS && window.VOTATIONS.cantons[canton]) || null;
    var groupes = [
      ["Comprendre", "Saisir l'objet avant de voter.", ["easyvote", "Vimentis", "Année politique suisse"]],
      ["Comparer", "Se situer face aux partis et aux élus.", ["smartvote", "smartmonitor", "PolitPro", "Swissvotes"]]
    ];
    var h = '<h2 id="t-aides">Aides à décider</h2><p class="bloc__desc">Trois étapes pour se faire une opinion.</p>';
    groupes.forEach(function (g, i) {
      var items = D.outils.filter(function (o) { return g[2].indexOf(o[0]) > -1; });
      h += '<section class="bloc"><h3 class="etape-titre"><span>' + (i + 1) + '</span> ' + g[0] + '</h3><p class="bloc__desc">' + g[1] + '</p><ul class="cartes">' +
        items.map(function (o) { return carte(o[0], o[1], o[2], "CH"); }).join("") + '</ul></section>';
    });
    var cantLien = niveau === "canton" && cant ? cant.lien : "https://www.ch.ch";
    var cantNom = niveau === "canton" ? "Votations du canton " + nomCanton(canton) : "ch.ch, droits politiques";
    h += '<section class="bloc"><h3 class="etape-titre"><span>3</span> Décider</h3><p class="bloc__desc">Voter est simple : par correspondance ou dans sa commune.</p><ul class="cartes">' +
      carte(cantNom, "Matériel de vote, dates et marche à suivre.", cantLien, codeNiveau()) +
      '<li><a class="carte" href="#votation"><span class="carte__tete"><span class="carte__nom">Prochaine votation</span><span class="badge badge--gray">Ici</span></span><span class="carte__note">Les objets, les mots d\'ordre et le parcours complet.</span></a></li></ul></section>';
    $("aides").innerHTML = h;
  }

  function renderLiens() {
    var nq = norm(requete), html = "", total = 0;
    $("etat-desc").textContent = "Sources officielles : " + (niveau === "federal" ? "Confédération." : "canton " + deCanton(canton) + ".");
    var etat = courant().etat.filter(function (l) { return !nq || norm(l[1] + " " + l[2] + " " + l[3]).indexOf(nq) > -1; });
    if (etat.length) html = '<ul class="cartes">' + etat.map(function (l) { return carte(l[1], l[2], l[3], codeNiveau()); }).join("") + '</ul>';
    $("liens").innerHTML = html || '<p class="vide">Aucun résultat. Essayez un autre mot.</p>';
  }

  $("prev").onclick = function () { aller(-1); };
  $("next").onclick = function () { aller(1); };
  var zone = $("spectre-zone"), x0 = null;
  zone.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { aller(-1); e.preventDefault(); }
    if (e.key === "ArrowRight") { aller(1); e.preventDefault(); }
  });
  zone.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  zone.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) aller(dx < 0 ? 1 : -1);
  }, { passive: true });
  $("q").addEventListener("input", function (e) { requete = e.target.value; renderLiens(); });

  try { var dernier = localStorage.getItem("boussole-canton"); if (dernier && couvert(dernier)) canton = dernier; } catch (e) {}
  var d0 = lire(location.hash), s0 = null;
  try { s0 = lire("#votation/" + (localStorage.getItem("boussole-niveau") || "")); } catch (e) {}
  if (d0.n) { niveau = d0.n; if (d0.c) canton = d0.c; } else if (s0 && s0.n) { niveau = s0.n; if (s0.c) canton = s0.c; }
  if (d0.p) page = d0.p;
  window.Boussole = { etat: function () { return { niveau: niveau, canton: canton }; }, aller: appliquer, page: allerPage, picker: ouvrirPicker, nomCanton: nomCanton, esc: esc, hote: hote };
  majBarre(); majAdresse(); renderTout();
})();
