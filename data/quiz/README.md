# Quiz diario — flujo operativo

## 1. Banco de hechos

Los hechos verificables viven en:

`data/quiz/facts/world-cup-facts.json`

Cada hecho incluye `source_url`, `source_label`, `category`, `fact_type` y campos para plantillas deterministas.

Campo opcional `image_url`: ruta publica (`/images/quiz/...`) o URL `https`. Debe ser tematica (estadio, seleccion, era del futbol) y **no delatar** la respuesta correcta.

## 2. Generar el día (automático)

```bash
QUIZ_DATE=2026-06-07 npm run quiz:generate-day
```

Escribe `data/quiz/generated/YYYY-MM-DD.json` con 3 preguntas MCQ, metadata de fuentes y selección variada por categoría.

La selección es determinista por fecha y evita repetir `fact_id` de los últimos 14 días generados.

## 3. Sembrar en Supabase

```bash
ALLOW_QUIZ_SEED=1 QUIZ_DATE=2026-06-07 npm run db:seed-quiz-day
```

Orden de resolución del archivo:

1. `QUIZ_DAY_FILE` (si se define)
2. `data/quiz/generated/{QUIZ_DATE}.json`
3. `data/quiz/{QUIZ_DATE}.json`
4. `data/quiz/example-day.json` (fallback manual)

Reemplazar un día ya publicado:

```bash
ALLOW_QUIZ_SEED=1 CONFIRM_RESEED=1 QUIZ_DATE=2026-06-07 npm run db:seed-quiz-day
```

## 4. Modos de juego

- **Training**: no puntúa; el usuario puede **volver a jugar** tras completar.
- **Competitive**: un intento enviado bloquea nuevo juego; puntúa en ranking.
- **Owner del pool**: puede relanzar rondas ilimitadas (incluso en competitive) para pruebas.

El modo se detecta según el calendario del pool al sembrar.

## 4b. Gameplay play

- 10 segundos por pregunta con cuenta atras visible.
- Feedback verde/rojo al responder; avance automatico (~1 s).
- Sin navegacion manual ni confirmacion final; submit automatico al terminar.
- Resultado: resumen corto (puntuacion/estado), sin desglose pregunta a pregunta.

## 5. Formato seed (manual o generado)

- `quiz_date`: `YYYY-MM-DD`
- `official.questions`: exactamente **3** preguntas (`sort_order` 1–3)
- `options`: 4 respuestas (`a`–`d`)
- Campos opcionales de trazabilidad: `fact_id`, `source_url`, `source_label`, `template_id`

El bloque `bonus` está **deprecado** y se ignora.

## 6. Tests

```bash
npm run test:quiz
```
