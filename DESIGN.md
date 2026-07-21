# DESIGN.md — Waira / mvpMedico

Fuente de verdad visual del producto. Prioridad: este archivo → tokens en `src/app/globals.css` → clases Tailwind en `src/`.

**Última actualización:** 2026-07-21  
**Marca:** Waira (vende) · **Repo:** mvpMedico · **Hub:** Mallanet  
**Isotipo canónico:** [`public/brand/waira-isotipo.svg`](public/brand/waira-isotipo.svg)

Basado en [taste-skill / stitch DESIGN.md](https://github.com/Leonxlnx/taste-skill/tree/main/skills) adaptado a un SaaS médico (agenda + landing), no a landing awwwards.

---

## 1. Atmósfera

| Dial | Valor | Lectura |
| --- | ---: | --- |
| Densidad | 4 | Daily app equilibrada: aire en marketing, más densa en agenda |
| Varianza | 5 | Offset leve; split editorial en landings; simetría en dashboards |
| Motion | 3 | Transiciones CSS cortas (150ms); sin GSAP ni parallax en v1 |
| Claridad | 9 | Legible, clínico, confiable |

**Mood:** consultorio limpio, confianza teal, sin “AI purple”, sin glassmorphism pesado, sin emojis en UI.

**Anti-patrones (ban):**
- Púrpura / indigo / neon glow
- Inter / Roboto / Arial como display
- Hero centrado con badges flotantes, stats strips, pill clusters
- Cards por default (solo cuando elevación comunica jerarquía o hay interacción)
- Spinners genéricos si hay skeleton posible
- `h-screen` en heroes (usar `min-h-[100dvh]` si hace falta full viewport)

---

## 2. Color

### Brand (archivos oficiales — no cambiar sin PR de marca)

| Nombre | Hex | Rol |
| --- | --- | --- |
| Forest | `#105151` | Variante **O** (sobre claro): cuerpo del mark + wordmark; botones primary |
| Lagoon | `#25cec9` | Círculo del isotipo (ambas variantes) |
| Foam | `#e3fffc` | Variante **C** (sobre oscuro): cuerpo del mark + wordmark |
| Mist | `#f3f7f6` | Fondo de página / superficie clara (UI, no del SVG) |
| Ink | `#0f2926` | Texto body sobre mist |

### UI derivados (app)

| Nombre | Hex / valor | Rol |
| --- | --- | --- |
| Accent | `#105151` | Focus ring, `--accent` |
| Primary hover | `#0c3f3f` | Hover de primary |
| Secondary border | `rgba(16, 81, 81, 0.28)` | Contorno secondary |
| Secondary hover | `#e8f4f3` | Fondo hover secondary |
| Field border | `#d6d3d1` | Inputs |
| Panel | `#ffffff` / `bg-white/80–90` | Superficies elevadas |
| Danger | `#b91c1c` + `bg-red-50` | Errores / conflictos |
| Warning | `#92400e` + `bg-amber-50` | Membresía pausada, avisos |
| Dark CTA | `#1c1917` | `.btn-dark` (uso raro) |

### Tailwind (mapeo práctico)

Preferir escala **teal** alineada a Forest:

- Texto fuerte: `text-teal-950`
- Texto body: `text-teal-900/75` o `/70`
- Bordes suaves: `border-teal-900/10` o `/15`
- Superficie suave: `bg-teal-50`
- Controles activos (chips): `bg-teal-800` / `border-teal-800` (proxy cercano a Forest)

**Lagoon** no es color de botón de texto. Usarlo solo en marca, favicon, o acentos gráficos.

**Prohibido:** mezclar grises cálidos (stone) como sistema de color principal con teal; stone solo en `.btn-dark` y bordes de field.

### CSS variables (`:root`)

```css
--brand-forest: #105151;
--brand-lagoon: #25cec9;
--brand-foam: #e3fffc;
--background: #f3f7f6;
--foreground: #0f2926;
--accent: #105151;
--space-1…8: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px;
--control-h: 44px;
--radius-control: 8px;
--radius-panel: 16px;
```

Fondo de `body`: mist + dos radiales suaves (teal + toque cálido muy bajo) — atmósfera, no hero decorativo.

---

## 3. Tipografía

Familia única: **[Elms Sans](https://fonts.google.com/specimen/Elms+Sans)** (geométrica utilitaria, OFL). Display y body comparten la misma cara; la jerarquía va por peso y tamaño, no por serif.

| Rol | Familia | Variable / uso |
| --- | --- | --- |
| UI / body / display | Elms Sans | `--font-elms-sans` · también `--font-display` / `--font-body` |
| Tabular | Elms Sans + `tabular-nums` | horas, fechas |

**Escala**

| Nivel | Clase típica | Notas |
| --- | --- | --- |
| Hero H1 | `text-4xl sm:text-5xl` + `font-semibold`, `leading-[1.1–1.12]` | Máx. ~3 líneas; roman only |
| Page H1 app | `text-2xl font-semibold text-teal-950` | Misma familia |
| Section H2 | `text-lg font-semibold` o `font-medium` | Una idea por bloque |
| Body | `text-base` o `text-sm`, `leading-relaxed`, `max-w-xl` / `max-w-lg` | ≤ ~65ch |
| Eyebrow | `text-sm uppercase tracking-[0.18em] text-teal-800/70` | Especialidad / contexto |
| Meta | `text-xs text-teal-900/55–60` | Secondary copy |

**Dashboard y marketing:** misma familia. Sin Source Serif / DM Sans.

---

## 4. Logo

Fuente: exports oficiales `IsotipoWaira_O/C.svg` y `LogoWaira_O/C.svg`.

| Archivo en repo | Origen | Uso |
| --- | --- | --- |
| `waira-isotipo.svg` | `IsotipoWaira_O` | Sobre fondo claro (Forest + Lagoon). Nav, footer |
| `waira-isotipo-on-dark.svg` | `IsotipoWaira_C` | Sobre fondo oscuro (Foam `#e3fffc` + Lagoon) |
| `waira-logo.svg` | `LogoWaira_O` | Lockup completo sobre claro |
| `waira-logo-on-dark.svg` | `LogoWaira_C` | Lockup completo sobre oscuro |
| `waira-favicon.svg` | derivado de O | Icono app (padding + Mist) |
| `waira-brandkit-board.png` | Brandkit deck | Referencia de identidad (no runtime UI) |
| `icons/calendar.svg` | sistema | Agenda / slots |
| `icons/busy-block.svg` | sistema | Google busy → bloqueo |
| `icons/anti-overlap.svg` | sistema | Anti-solape |
| `icons/guest-book.svg` | sistema | Reserva sin cuenta |

**Iconografía (Brandkit)**
- Trazo Forest `#105151`, acento Lagoon `#25cec9`, fondo Mist cuando hace falta.
- Geometría simple, 64×64, sin emoji ni gradientes.
- Lockup runtime: isotipo + wordmark tipográfico Elms Sans (`WairaMark`), no raster recolor.

**Convención O / C**
- **O** = oscuro (tint Forest) → fondos claros
- **C** = claro (tint Foam) → fondos oscuros / Forest

**Reglas**
- No recolorear fuera de estas variantes.
- Clear space ≈ altura del círculo Lagoon.
- Mínimo práctico en UI: ~20px de alto el isotipo; logo completo ≥ ~28px de alto.
- En HTML: `alt=""` si hay texto “Waira” al lado; `alt="Waira"` si el asset está solo.

---

## 5. Componentes

### Botones (`.btn`)

Definidos en `globals.css`. **Usar siempre estas clases** en CTAs; no reinventar `bg-teal-800` suelto.

| Clase | Apariencia | Cuándo |
| --- | --- | --- |
| `.btn .btn-primary` | Forest `#105151`, texto blanco; hover `#0c3f3f` | CTA principal (1 por vista) |
| `.btn .btn-secondary` | Blanco, borde Forest/28, texto ink; hover mist teal | Secundario |
| `.btn .btn-dark` | Stone-900 | Excepción rara |
| `:disabled` | `opacity: 0.6`, `cursor: not-allowed` | Loading / inválido |

Specs: `min-height: 44px`, `padding: 0 20px`, `radius: 8px`, `font-size: 0.875rem`, `font-weight: 500`, transition 150ms.

Focus: outline 2px `--accent` + halo `rgba(16, 81, 81, 0.22)`.

Nav: `.nav-link` (misma altura 44px, padding horizontal 12px).

### Campos (`.field`)

- Altura mín. 44px, radius 8px, borde `#d6d3d1`, fondo blanco, padding `10px 12px`.
- Label arriba del input (`flex-col gap-1.5`).
- Error debajo / bloque `role="alert"` con `bg-red-50 text-red-700`.

### Paneles / “cards”

- Solo para widgets interactivos (booking, agenda del día, diálogos).
- `rounded-[var(--radius-panel)]` (16px), `border-teal-900/10`, `bg-white/80–90`, `shadow-sm` leve.
- No cards en hero marketing salvo el preview de agenda (es el ancla visual del producto).

### Banners (`.Banner`)

Tones: `teal` | `amber` | `red` — borde + fondo pastel + texto oscuro del mismo hue.

### Skip link

`.skip-link`: Forest, blanco, visible solo al foco.

---

## 6. Layout

- Contenedor app: `max-w-6xl mx-auto px-4 sm:px-6`.
- Landing pública: grid `lg:grid-cols-[1.1fr_0.9fr]` (copy | booking sticky).
- Home marketing: split `lg:grid-cols-[1.15fr_0.85fr]`.
- Features: 3 columnas en `sm+` con `border-t` divisor — sin fila de 3 cards con sombra.
- Header: `border-b border-teal-900/10 bg-white/80 backdrop-blur`.
- Footer: mismo borde, tipografía `text-sm text-teal-900/70`.

**Espaciado de sección:** `space-y-16` / `py-8 sm:py-12` en marketing; formularios `gap-4` / `space-y-2`.

---

## 7. Motion

- Default: `150ms ease` en color/borde/opacidad.
- Sin scroll-jacking, pinning, marquees ni hover `scale-105` agresivo en v1.
- Feedback de botón: opacity / background; opcional `active:scale-[0.98]` si se agrega después, de forma global en `.btn`.

---

## 8. Estados obligatorios

| Estado | Patrón |
| --- | --- |
| Loading | Skeleton (`bg-teal-900/5–10`) en calendar/landing; texto “Enviando…” en submit |
| Empty | Copy corto + borde suave (conflictos sin items) |
| Error | Inline `role="alert"`, rojo suave |
| Disabled booking | Banner amber (membresía inactiva) |
| Focus | Outline accent + ring (ver globals) |

---

## 9. Superficies por ruta

| Ruta | Tratamiento |
| --- | --- |
| `/` | Brand hero: lockup Elms Sans, 1 H1, 1 párrafo, 2 CTAs, preview agenda + icon system |
| `/l/[slug]` | Editorial split + booking island · Elms Sans |
| `/calendar`, settings, admin | Elms Sans, denso, bordes |
| Auth / onboarding | Formulario simple, `.btn` / `.field` |

---

## 10. Checklist de implementación

- [ ] Colores de marca solo Forest / Lagoon (+ semánticos danger/warning)
- [ ] CTAs con `.btn` / `.btn-primary|secondary`
- [ ] Inputs con `.field` o equivalente visual idéntico
- [ ] Logo desde `/public/brand/…` (no raster recolor ad-hoc)
- [ ] Sin purple/glow/emoji
- [ ] Tipografía: Elms Sans en toda la app (display + body)
- [ ] Un primary CTA por vista
- [ ] Focus visible en interactive controls

Si el código y este archivo divergen, **actualizar el código o este archivo en el mismo PR**.
