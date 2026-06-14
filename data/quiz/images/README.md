# Momentos históricos — banco de imágenes (quiz)

Catálogo: `world-cup-moments.json`

Imágenes locales: `public/images/quiz/historic/{año}/{id}.jpg`

## Reglas del banco

- Año mínimo **1970**
- Debe verse al menos un **jugador** (no estadios vacíos, no solo afición)
- Guardar copia local en `public/` (no hotlink a Marca/FIFA)
- Anotar `source_url` y `source_label` por trazabilidad

## Añadir un momento

1. Copia un bloque en `world-cup-moments.json` o edita uno `pending`
2. **Autodescubre la URL** (DuckDuckGo + Commons; opcional Google CSE con env vars)
3. Descarga la imagen a `public/`

```bash
# Buscar URL automáticamente para todos los pending (solo guarda source_url)
npm run quiz:discover-moment-images

# Ver candidatos sin escribir
npm run quiz:discover-moment-images -- --preview --id=wc2022-messi-cup

# Buscar URL y descargar imagen local
npm run quiz:discover-moment-images -- --download --limit=3

# Solo descargar si ya hay source_url
npm run quiz:import-moment-image -- --id=wc2022-messi-cup
```

### Google Custom Search (opcional, más parecido a “Google Imágenes”)

En `.env.local`:

```
GOOGLE_CSE_API_KEY=...
GOOGLE_CSE_CX=...
```

El descubridor los usará como fuente extra si existen.

## Validación

```bash
npm run quiz:validate-moments
```

- Comprueba el esquema JSON
- Marca `ready` si existe el archivo en `public/images/quiz/historic/...`
- Marca `pending` si falta la imagen
- Con `--write` actualiza `status` en el JSON

## Uso en el laboratorio de quiz

Cuando hay al menos un momento `ready`, el borrador por defecto de **Adivina la imagen** usa el primero disponible del catálogo.

Conversión programática:

```ts
import { loadWorldCupMomentsCatalog, pickMomentById } from "@/lib/quiz/world-cup-moments";
import { momentToGuessImageQuestion } from "@/lib/quiz/lab/from-moment";

const catalog = loadWorldCupMomentsCatalog();
const moment = pickMomentById(catalog, "wc2022-messi-cup", { readyOnly: true });
const question = moment ? momentToGuessImageQuestion(moment) : null;
```

## Assets del laboratorio (peinado / ojos / silueta)

Tras añadir o cambiar un momento `player`:

```bash
npm run quiz:annotate-lab-catalog
npm run quiz:materialize-lab-assets
npm run quiz:validate-moments
```

- `annotate-lab-catalog` rellena `lab_suitability` y `face_focus` en el JSON
- `materialize-lab-assets` genera JPG en `public/images/quiz/lab/generated/` (siluetas con OpenAI si hay `OPENAI_API_KEY`)
- Commitea los JPG generados antes de desplegar

## Formato `quiz` por momento

Cada entrada incluye `prompt`, `correct_option`, 4 `options`, `blur_start_px` y `reveal_seconds` para el formato `guess_image` del laboratorio.
