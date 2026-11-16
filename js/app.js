(function () {
  var D = window.BOUSSOLE;
  var NS = "http://www.w3.org/2000/svg";
  var niveau = "federal";      // "federal" ou "canton"
  var canton = "GE";           // dernier canton choisi
  var index = 0, requete = "";
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

  /* ---------- Niveau : Fédéral | Canton ▾ (sélecteur collant, mémorisé, partageable par #adresse) ---------- */
  function lire(h) {
    h = (h || "").replace("#", "").toLowerCase();
    if (h === "federal") return { n: "federal" };
    if (h && couvert(h.toUpperCase())) return { n: "canton", c: h.toUpperCase() };
    return null;
  }
  function etatInitial() {
    var d = lire(location.hash);
    if (d) return d;
    try { var m = lire(localStorage.getItem("boussole-niveau")); if (m) return m; } catch (e) {}
    return { n: "federal" };
  }
  function majSelecteur() {
    var seg = $("seg");
    seg.setAttribute("data-niveau", niveau);
    $("seg-canton").innerHTML = esc(nomCanton(canton)) + ' <span aria-hidden="true">▾</span>';
    Array.prototype.forEach.call(seg.querySelectorAll(".seg__btn"), function (b) {
      var on = b.getAttribute("data-niveau") === niveau;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
  }
  function appliquer(n, c, majAdresse) {
    niveau = n; if (c) canton = c; index = 0;
    var cle = n === "federal" ? "federal" : canton.toLowerCase();
    try { localStorage.setItem("boussole-niveau", cle); localStorage.setItem("boussole-canton", canton); } catch (e) {}
    if (majAdresse && history.replaceState) { try { history.replaceState(null, "", "#" + cle); } catch (e) {} }
    majSelecteur(); renderTout();
  }
  function renderTout() { renderTitre(); renderHemicycle(); renderDetail(); renderLiens(); try { document.dispatchEvent(new CustomEvent("boussole:maj")); } catch (e) {} }
  window.Boussole = { etat: function () { return { niveau: niveau, canton: canton }; }, aller: function (n, c) { appliquer(n, c, true); }, picker: function () { ouvrirPicker(); }, nomCanton: nomCanton, esc: esc, hote: hote };

  /* ---------- Sélecteur de canton (feuille qui monte du bas) ---------- */
  var retourFocus = null;
  function ouvrirPicker() {
    retourFocus = $("seg-canton");
    $("picker").hidden = false; $("picker-q").value = ""; renderPicker("");
    document.body.style.overflow = "hidden";
    $("picker-q").focus();
  }
  function fermerPicker() {
    $("picker").hidden = true; document.body.style.overflow = "";
    if (retourFocus) retourFocus.focus();
  }
  function renderPicker(q) {
    var nq = norm(q);
    var tous = D.tousCantons.filter(function (c) { return !nq || norm(c[1] + " " + c[0]).indexOf(nq) > -1; });
    var a = tous.filter(function (c) { return couvert(c[0]); }), b = tous.filter(function (c) { return !couvert(c[0]); });
    var html = "";
    a.concat(b).forEach(function (c) {
      var ok = couvert(c[0]);
      html += '<li><button type="button" class="picker__item" data-code="' + c[0] + '"' + (ok ? "" : " disabled") + (c[0] === canton && niveau === "canton" ? ' aria-current="true"' : "") + '>' +
        '<span class="picker__code">' + c[0] + '</span><span>' + esc(c[1]) + '</span><span class="picker__etat">' + (ok ? "" : "bientôt") + '</span></button></li>';
    });
    $("picker-liste").innerHTML = html || '<li class="vide">Aucun canton trouvé.</li>';
  }

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

  /* ---------- Outils et sites de l'État ---------- */
  function carte(nom, note, url, badge) {
    return '<li><a class="carte" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="carte__tete"><span class="carte__nom">' + esc(nom) + '</span><span class="badge badge--gray">' + esc(badge) + '</span></span>' +
      '<span class="carte__note">' + esc(note) + '</span><span class="host">' + esc(hote(url)) + '</span></a></li>';
  }
  function renderLiens() {
    var nq = norm(requete), html = "", total = 0;
    var outils = D.outils.filter(function (o) { return !nq || norm(o[0] + " " + o[1] + " " + o[2]).indexOf(nq) > -1; });
    if (outils.length) {
      total += outils.length;
      html += '<section class="bloc"><h2>Aider à décider</h2><p class="bloc__desc">Comparer les positions et comprendre les objets de votation.</p><ul class="cartes">' +
        outils.map(function (o) { return carte(o[0], o[1], o[2], "CH"); }).join("") + '</ul></section>';
    }
    var etat = courant().etat.filter(function (l) { return !nq || norm(l[1] + " " + l[2] + " " + l[3]).indexOf(nq) > -1; });
    if (etat.length) {
      total += etat.length;
      html += '<section class="bloc"><h2>Sites de l\'État</h2><p class="bloc__desc">Sources officielles : ' + (niveau === "federal" ? "Confédération" : "canton " + esc(deCanton(canton))) + '.</p><ul class="cartes">' +
        etat.map(function (l) { return carte(l[1], l[2], l[3], codeNiveau()); }).join("") + '</ul></section>';
    }
    $("liens").innerHTML = total ? html : '<p class="vide">Aucun résultat. Essayez un autre mot.</p>';
  }

  /* ---------- Branchements ---------- */
  var segBtns = $("seg").querySelectorAll(".seg__btn");
  Array.prototype.forEach.call(segBtns, function (b) {
    b.addEventListener("click", function () {
      if (b.getAttribute("data-niveau") === "federal") appliquer("federal", null, true);
      else if (niveau === "canton") ouvrirPicker();
      else appliquer("canton", canton, true);
    });
    b.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        var vers = niveau === "federal" ? "canton" : "federal";
        appliquer(vers, null, true);
        $("seg").querySelector('[data-niveau="' + vers + '"]').focus();
        e.preventDefault();
      }
    });
  });
  $("picker-fond").addEventListener("click", fermerPicker);
  $("picker-x").addEventListener("click", fermerPicker);
  $("picker-q").addEventListener("input", function (e) { renderPicker(e.target.value); });
  $("picker-liste").addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".picker__item") : null;
    if (!b || b.disabled) return;
    var code = b.getAttribute("data-code");
    $("picker").hidden = true; document.body.style.overflow = "";
    appliquer("canton", code, true);
    $("seg-canton").focus();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("picker").hidden) fermerPicker(); });
  window.addEventListener("hashchange", function () {
    var d = lire(location.hash);
    if (d && (d.n !== niveau || (d.c && d.c !== canton))) appliquer(d.n, d.c || null, false);
  });

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
  var init = etatInitial(); niveau = init.n; if (init.c) canton = init.c;
  majSelecteur(); renderTout();
  requestAnimationFrame(function () { requestAnimationFrame(function () { $("seg").classList.add("pret"); }); });
})();
