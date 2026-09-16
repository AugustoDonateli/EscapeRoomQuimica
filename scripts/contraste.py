"""Mede o contraste de todos os pares de cor usados em texto e em borda.

Roda com `python3 scripts/contraste.py`. As duas paletas aqui são cópia das de
src/app/globals.css — mudou cor lá, muda aqui e roda de novo antes de publicar.

Os mínimos são os da WCAG 2.2: 4.5:1 para texto normal, 3:1 para borda de campo
(1.4.11, contraste de não-texto), 7:1 para corpo de texto longo.
"""

def lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

# Paleta clara proposta: papel de caderno de laboratório, tinta quase preta.
CLARO = {
    "fundo":          "#f1efe8",
    "superficie":     "#fbfaf6",
    "superficie-2":   "#e5e2d8",
    "tinta":          "#15181a",
    "tinta-2":        "#4f544e",
    "tinta-3":        "#65695f",
    "linha":          "#dbd7ca",
    "linha-2":        "#8d8877",
    "acento":         "#0d7263",
    "acento-suave":   "#dceee9",
    "acento-2":       "#2b5fcc",
    "acento-2-suave": "#e2e8f8",
    "alerta":         "#8a5100",
    "alerta-suave":   "#f6ecd6",
    "perigo":         "#a01f35",
    "perigo-suave":   "#f9e6e8",
}

ESCURO = {
    "fundo":          "#0b100f",
    "superficie":     "#161f1d",
    "superficie-2":   "#1f2b28",
    "tinta":          "#e2ebe8",
    "tinta-2":        "#95a6a2",
    "tinta-3":        "#7c8d89",
    "linha":          "#1d2927",
    "linha-2":        "#5c6b67",
    "acento":         "#3fd9c4",
    "acento-suave":   "#0f2520",
    "acento-2":       "#8fb8ff",
    "acento-2-suave": "#131e30",
    "alerta":         "#e8a64a",
    "alerta-suave":   "#241a0e",
    "perigo":         "#ff7089",
    "perigo-suave":   "#2a1319",
}

# (frente, fundo, mínimo exigido, para que serve)
PARES = [
    ("tinta", "fundo", 7.0, "corpo na página"),
    ("tinta", "superficie", 7.0, "corpo no cartão"),
    ("tinta-2", "fundo", 4.5, "apoio na página"),
    ("tinta-2", "superficie", 4.5, "apoio no cartão"),
    ("tinta-3", "fundo", 4.5, "rótulo micro na página"),
    ("tinta-3", "superficie", 4.5, "rótulo micro no cartão"),
    ("acento", "fundo", 4.5, "link na página"),
    ("acento", "superficie", 4.5, "link no cartão"),
    ("acento", "acento-suave", 4.5, "texto no realce"),
    ("acento-2", "acento-2-suave", 4.5, "texto em jogo"),
    ("alerta", "alerta-suave", 4.5, "texto de alerta"),
    ("perigo", "perigo-suave", 4.5, "texto de perigo"),
    ("alerta", "fundo", 4.5, "alerta na página"),
    ("perigo", "fundo", 4.5, "perigo na página"),
    ("fundo", "acento", 4.5, "texto do botão primário"),
    ("linha-2", "fundo", 3.0, "borda de campo (não-texto)"),
    ("superficie-2", "fundo", 1.1, "cartão precisa se distinguir do fundo"),
    ("superficie", "fundo", 1.1, "cartão precisa se distinguir do fundo"),
]

for nome, p in (("CLARO (fora da sala)", CLARO), ("ESCURO (.sala)", ESCURO)):
    print(f"\n=== {nome} ===")
    for fg, bg, minimo, uso in PARES:
        r = ratio(p[fg], p[bg])
        marca = "ok " if r >= minimo else "FALHA"
        print(f"{marca} {r:5.2f} (min {minimo:4.1f})  {fg:14s} sobre {bg:14s}  {uso}")
