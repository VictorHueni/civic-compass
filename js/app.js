(function () {
  var D = window.BOUSSOLE;
  var niveau = "Suisse", index = 0, requete = "";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function hote(u) { return u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); }

  function renderNiveaux() {
    var box = $("niveaux");
    box.innerHTML = "";
    ["Suisse", "Genève"].forEach(function (n) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--sm " + (n === niveau ? "btn--filled" : "btn--outline");
      b.textContent = n;
      b.setAttribute("aria-pressed", String(n === niveau));
      b.onclick = function () { niveau = n; index = 0; renderNiveaux(); renderSpectre(); };
      box.appendChild(b);
    });
  }

  function renderSpectre() {
    var liste = D.partis[niveau];
    var ol = $("spectre");
    ol.innerHTML = "";
    liste.forEach(function (p, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "party" + (i === index ? " is-active" : "");
      b.setAttribute("aria-pressed", String(i === index));
      b.innerHTML = '<span class="party__dot" aria-hidden="true"></span><span class="party__abbr">' + esc(p.abbr) + '</span>';
      b.onclick = function () { index = i; renderSpectre(); };
      li.appendChild(b);
      ol.appendChild(li);
    });
    var p = liste[index];
    $("detail").innerHTML =
      '<p class="detail__pos">' + esc(p.position) + ' <span class="detail__rank">position ' + (index + 1) + ' sur ' + liste.length + ', de gauche à droite</span></p>' +
      '<h3 class="detail__name">' + esc(p.nom) + '</h3>' +
      '<p>' + esc(p.desc) + '</p>' +
      '<p><a class="btn btn--filled" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer"><span class="btn__text">Ouvrir le site du parti</span></a> ' +
      '<span class="host">' + esc(hote(p.url)) + '</span></p>';
    $("prev").disabled = index === 0;
    $("next").disabled = index === liste.length - 1;
    var actif = ol.querySelector(".is-active");
    if (actif && actif.scrollIntoView) { try { actif.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {} }
  }

  function aller(delta) {
    var n = D.partis[niveau].length;
    index = Math.max(0, Math.min(n - 1, index + delta));
    renderSpectre();
  }

  var SECTIONS = [
    ["Aider à décider", "Comparer les positions et comprendre les objets de votation."],
    ["Sites de l'État", "Sources officielles : lois, résultats, parlements."]
  ];
  function renderLiens() {
    var nq = norm(requete), html = "", total = 0;
    SECTIONS.forEach(function (s) {
      var items = D.liens.filter(function (l) {
        if (l[0] !== s[0]) return false;
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
  $("spectre-zone").addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { aller(-1); e.preventDefault(); }
    if (e.key === "ArrowRight") { aller(1); e.preventDefault(); }
  });
  $("q").addEventListener("input", function (e) { requete = e.target.value; renderLiens(); });

  renderNiveaux(); renderSpectre(); renderLiens();
})();
