#!/usr/bin/env python3
"""Outil local de la Boussole citoyenne. Python 3.8+, aucune dépendance.

  python3 tools/boussole.py liens            teste tous les liens de js/data.js
  python3 tools/boussole.py sieges --show    montre les colonnes du fichier de l'OFS
  python3 tools/boussole.py sieges           écrit data/sieges-cn-2023.json
"""
import argparse, csv, io, json, re, sys, urllib.request, urllib.error, datetime, pathlib
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = "Mozilla/5.0 (compatible; boussole-citoyenne-outil-local)"
# Résultats des partis, élections au Conseil national 2023 (OFS, via opendata.swiss)
URL_SIEGES = "https://ogd-static.voteinfo-app.ch/v4/ogd/sd-t-17.02-NRW2023-parteien-appendix.csv"

def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    return urllib.request.urlopen(req, timeout=timeout)

# ---------- liens ----------
def verifier(url):
    try:
        with get(url) as r:
            final = r.geturl()
            code = r.status
        note = "redirigé vers " + final if final.rstrip("/") != url.rstrip("/") else ""
        return url, code, "ok", note
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            return url, e.code, "bloqué", "le site refuse les robots, à vérifier à la main"
        return url, e.code, "casse", e.reason
    except Exception as e:
        return url, 0, "casse", str(getattr(e, "reason", e))

def cmd_liens(a):
    texte = pathlib.Path(a.data).read_text(encoding="utf-8")
    urls = sorted(set(re.findall(r'https?://[^"\'\s)]+', texte)))
    with ThreadPoolExecutor(8) as ex:
        res = list(ex.map(verifier, urls))
    ordre = {"casse": 0, "bloque": 1, "bloqué": 1, "ok": 2}
    for url, code, etat, note in sorted(res, key=lambda r: ordre.get(r[2], 3)):
        icone = {"ok": "OK    ", "bloqué": "A VOIR", "casse": "CASSE "}[etat]
        print(f"{icone} {code or '---'}  {url}" + (f"   ({note})" if note else ""))
    cassés = [r for r in res if r[2] == "casse"]
    print(f"\n{len(res)} liens, {len(cassés)} cassé(s), {sum(r[2]=='bloqué' for r in res)} à vérifier à la main.")
    return 1 if cassés else 0

# ---------- sièges ----------
ALIAS = {  # nom brut (minuscules) -> abréviation du site
    "udc": "UDC", "svp": "UDC", "ps": "PS", "sp": "PS", "pss": "PS", "plr": "PLR", "fdp": "PLR",
    "le centre": "Centre", "die mitte": "Centre", "centre": "Centre", "mitte": "Centre",
    "verts": "Verts", "les vert-e-s": "Verts", "grüne": "Verts", "gps": "Verts", "vert-e-s": "Verts",
    "pvl": "PVL", "glp": "PVL", "vert'libéraux": "PVL", "pev": "PEV", "evp": "PEV", "mcg": "MCG",
    "pst": "PST-POP", "pst-pop": "PST-POP", "pda": "PST-POP", "sol.": "solidaritéS", "solidarités": "solidaritéS",
}
def trouver_colonne(entetes, motifs):
    for i, h in enumerate(entetes):
        if any(re.search(m, h.lower()) for m in motifs):
            return i
    return None

def cmd_sieges(a):
    brut = get(a.url).read().decode("utf-8-sig")
    dialecte = csv.Sniffer().sniff(brut[:4096], delimiters=",;\t")
    lignes = list(csv.reader(io.StringIO(brut), dialecte))
    entetes = lignes[0]
    if a.show:
        print("Colonnes :")
        for i, h in enumerate(entetes): print(f"  {i}: {h}")
        print("\nPremières lignes :")
        for l in lignes[1:6]: print("  ", l)
        return 0
    cn = a.col_nom if a.col_nom is not None else trouver_colonne(entetes, [r"parti.*(name|nom)", r"party.*name", r"partei.*name", r"^parti", r"^party", r"^partei", r"name"])
    cs = a.col_sieges if a.col_sieges is not None else trouver_colonne(entetes, [r"mandat", r"sitze", r"seats", r"sieges"])
    if cn is None or cs is None:
        print("Colonnes introuvables. Lancez avec --show puis --col-nom N --col-sieges N.", file=sys.stderr)
        return 2
    sieges = {}
    for l in lignes[1:]:
        if len(l) <= max(cn, cs): continue
        nom = l[cn].strip()
        try: n = int(float(l[cs].replace(",", ".")))
        except ValueError: continue
        if nom and nom not in sieges: sieges[nom] = n  # première occurrence : total suisse
    sortie = {
        "source": a.url, "licence": "opendata.swiss, mention de la source obligatoire (OFS)",
        "recupere_le": datetime.date.today().isoformat(),
        "colonnes": {"nom": entetes[cn], "sieges": entetes[cs]},
        "sieges_brut": sieges,
        "sieges": {ALIAS[k.lower()]: v for k, v in sieges.items() if k.lower() in ALIAS},
    }
    out = ROOT / "data" / "sieges-cn-2023.json"
    out.write_text(json.dumps(sortie, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Écrit {out.relative_to(ROOT)} : {len(sortie['sieges'])} partis reconnus sur {len(sieges)}.")
    inconnus = [k for k in sieges if k.lower() not in ALIAS]
    if inconnus: print("Non reconnus (à ajouter dans ALIAS si utile) :", ", ".join(inconnus[:15]))
    print("Vérifiez : le total devrait faire 200 sièges ->", sum(sieges.values()))
    return 0

def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest="cmd", required=True)
    l = s.add_parser("liens"); l.add_argument("--data", default=str(ROOT / "js" / "data.js")); l.set_defaults(f=cmd_liens)
    g = s.add_parser("sieges"); g.add_argument("--url", default=URL_SIEGES); g.add_argument("--show", action="store_true")
    g.add_argument("--col-nom", type=int); g.add_argument("--col-sieges", type=int); g.set_defaults(f=cmd_sieges)
    a = p.parse_args(); sys.exit(a.f(a))
main()
