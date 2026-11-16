(function () {
  var D = window.BOUSSOLE;
  var niveau = "Suisse", index = 0, requete = "";
  var NS = "http://www.w3.org/2000/svg";
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

  /* Niveau : un seul sélecteur, collant en haut de page, mémorisé dans l'adresse (#geneve, #federal). */
  var HASH = { Suisse: "federal", "Genève": "geneve" };
  function niveauDepuisAdresse() {
    var h = (location.hash || "").replace("#", "");
    if (h === "geneve") return "Genève";
    if (h === "federal") return "Suisse";
    try { var m = localStorage.getItem("boussole-niveau"); if (m === "Suisse" || m === "Genève") return m; } catch (e) {}
    return "Suisse";
  }
  function majSelecteur() {
    var seg = $("seg");
    seg.setAttribute("data-niveau", niveau);
    Array.prototype.forEach.call(seg.querySelectorAll(".seg__btn"), function (b) {
      var on = b.getAttribute("data-niveau") === niveau;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
  }
  function choisirNiveau(n, majAdresse) {
    if (n === niveau && !majAdresse) return;
    niveau = n; index = 0;
    try { localStorage.setItem("boussole-niveau", n); } catch (e) {}
    if (majAdresse && history.replaceState) { try { history.replaceState(null, "", "#" + HASH[n]); } catch (e) {} }
    majSelecteur(); renderHemicycle(); renderDetail(); renderLiens();
  }
  function initSelecteur() {
    Array.prototype.forEach.call($("seg").querySelectorAll(".seg__btn"), function (b) {
      b.addEventListener("click", function () { choisirNiveau(b.getAttribute("data-niveau"), true); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          var n = niveau === "Suisse" ? "Genève" : "Suisse";
          choisirNiveau(n, true);
          $("seg").querySelector('[data-niveau="' + n + '"]').focus();
          e.preventDefault();
        }
      });
    });
    window.addEventListener("hashchange", function () { var n = niveauDepuisAdresse(); if (n !== niveau) choisirNiveau(n, false); });
  }

  /* Hémicycle : un secteur par parti, de la gauche (à gauche) à la droite. */
  var CX = 180, CY = 178, R = 172, r = 88, GAP = 1.6;
  function pt(rayon, deg) {
    var a = deg * Math.PI / 180;
    return [CX + rayon * Math.cos(a), CY - rayon * Math.sin(a)];
  }
  function renderHemicycle() {
    var liste = D.partis[niveau], n = liste.length, w = 180 / n;
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
    var liste = D.partis[niveau], p = liste[index];
    var faits = [["Position", p.position]];
    if (p.fonde) faits.push(["Fondé en", String(p.fonde)]);
    if (typeof p.cf === "number") faits.push(["Conseil fédéral", p.cf ? p.cf + (p.cf > 1 ? " sièges" : " siège") : "Aucun siège"]);
    var dl = faits.map(function (f) { return '<div class="fiche__ligne"><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join("");
    $("detail").innerHTML =
      '<h3 class="fiche__nom">' + esc(p.nom) + '</h3>' +
      '<p class="fiche__desc">' + esc(p.desc) + '</p>' +
      '<dl class="fiche__faits">' + dl + '</dl>' +
      '<a class="fiche__lien" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer"><span>Site du parti<small>' + esc(hote(p.url)) + '</small></span><span aria-hidden="true">↗</span></a>';
    $("prev").disabled = index === 0;
    $("next").disabled = index === liste.length - 1;
  }

  function aller(delta) {
    var n = D.partis[niveau].length;
    var ni = Math.max(0, Math.min(n - 1, index + delta));
    if (ni === index) return;
    index = ni; renderHemicycle(); renderDetail();
  }

  var SECTIONS = [
    ["Aider à décider", "Comparer les positions et comprendre les objets de votation."],
    ["Sites de l'État", "Sources officielles du niveau choisi : lois, résultats, parlements."]
  ];
  function renderLiens() {
    var nq = norm(requete), html = "", total = 0;
    SECTIONS.forEach(function (s) {
      var items = D.liens.filter(function (l) {
        if (l[0] !== s[0]) return false;
        if (s[0] === "Sites de l'État" && l[1] !== niveau) return false;
        return !nq || norm(l[2] + " " + l[3] + " " + l[4]).indexOf(nq) > -1;
      });
      if (!items.length) return;
      total += items.length;
      html += '<section class="bloc"><h2>' + esc(s[0]) + '</h2><p class="bloc__desc">' + esc(s[1]) + '</p><ul class="cartes">';
      items.forEach(function (l) {
        html += '<li><a class="carte" href="' + esc(l[4]) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="carte__tete"><span class="carte__nom">' + esc(l[2]) + '</span><span class="badge badge--gray">' + (l[1] === "Genève" ? "GE" : "CH") + '</span></span>' +
          '<span class="carte__note">' + esc(l[3]) + '</span><span class="host">' + esc(hote(l[4])) + '</span></a></li>';
      });
      html += '</ul></section>';
    });
    $("liens").innerHTML = total ? html : '<p class="vide">Aucun résultat. Essayez un autre mot.</p>';
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

  niveau = niveauDepuisAdresse(); initSelecteur(); majSelecteur(); renderHemicycle(); renderDetail(); renderLiens();
  requestAnimationFrame(function () { requestAnimationFrame(function () { $("seg").classList.add("pret"); }); });
})();
