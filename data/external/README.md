# Datos externos (copia bruta)

Los CSV vendoreados viven aquí. La DB sólo guarda tablas normalizadas.

## Fjelstul (histórico)

```bash
ALLOW_IMPORT=1 npm run db:import-wc-historic -- --download
```

Descarga a `data/external/fjelstul-worldcup/` desde
[jfjelstul/worldcup/data-csv](https://github.com/jfjelstul/worldcup/tree/master/data-csv).

Atribución: Joshua C. Fjelstul, Ph.D. — CC-BY-SA 4.0.

**Filtro de género (intencional):** el dataset Fjelstul incluye Mundiales masculinos y femeninos.
En esta fase solo importamos torneos masculinos (`isMenTournament` en `lib/fjelstul-worldcup/normalize.ts`):
IDs femeninos excluidos (`WC-1991` … `WC-2019`) o nombre con "Women"/"Femenin".
Partidos, goles, plantillas, awards y quiz facts derivan solo de esos torneos.

## worldcup2026 (feed 2026)

Copia manual o clone los CSV del repo
[rezarahiminia/worldcup2026](https://github.com/rezarahiminia/worldcup2026):

- `worldcup2026.teams.csv`
- `worldcup2026.groups.csv`
- `worldcup2026.stadia.csv`
- `worldcup2026.games.csv`
- `worldcup2026.squads.csv` (convocatorias oficiales FIFA 2026)

```bash
ALLOW_IMPORT=1 npm run db:import-wc2026-feed
```

Este script **no** reimporta el catálogo OpenFootball; sólo `external_id_map` y `match_live_state`.

### Plantillas oficiales 2026

Descarga convocatorias desde la API FIFA (listas publicadas jun 2026) y versiona el CSV:

```bash
npm run db:fetch-wc2026-squads
ALLOW_IMPORT=1 npm run db:import-wc2026-squads -- --truncate-first
```

Alternativa directa sin CSV intermedio:

```bash
ALLOW_IMPORT=1 npm run db:import-wc2026-squads -- --from-api --truncate-first
```

Las plantillas se guardan en `team_squads` con `source_code=worldcup2026` y `year=2026`.
La app prioriza esta fuente frente al histórico Fjelstul.
