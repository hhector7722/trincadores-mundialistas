# OpenFootball WC2026 (vendored)

Copia local de los archivos del torneo desde:

https://github.com/openfootball/worldcup/tree/master/2026--usa

Archivos requeridos:

- `cup.txt`
- `cup_finals.txt`
- `cup_stadiums.csv`

No commitear actualizaciones frecuentes salvo que quieras fijar una versión.

Import:

```bash
ALLOW_IMPORT=1 npm run db:import-wc2026
```

Reimport (si ya hay partidos):

```bash
ALLOW_IMPORT=1 CONFIRM_REIMPORT=1 npm run db:import-wc2026
```
