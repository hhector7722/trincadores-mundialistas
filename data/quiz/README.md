# Quiz diario — formato de seed

Publicar un día:

```bash
ALLOW_QUIZ_SEED=1 npm run db:seed-quiz-day
```

Por defecto lee `data/quiz/example-day.json`. También puedes usar:

```bash
ALLOW_QUIZ_SEED=1 QUIZ_DATE=2026-06-07 npm run db:seed-quiz-day
# busca data/quiz/2026-06-07.json si existe

ALLOW_QUIZ_SEED=1 QUIZ_DAY_FILE=data/quiz/mi-dia.json npm run db:seed-quiz-day
```

Reemplazar un día ya publicado:

```bash
ALLOW_QUIZ_SEED=1 CONFIRM_RESEED=1 npm run db:seed-quiz-day
```

## Reglas del JSON

- `quiz_date`: `YYYY-MM-DD` (Europe/Madrid, asignado explícitamente)
- `official.questions`: exactamente **3** preguntas con `sort_order` 1, 2, 3
- `options`: siempre 4 (`a`, `b`, `c`, `d`)
- `bonus` (opcional): 1 pregunta, no puntúa
- `image_url`: ruta pública (`/quiz/fecha-q1.jpg`) o `null`

El script detecta `training` vs `competitive` según el calendario del pool.
