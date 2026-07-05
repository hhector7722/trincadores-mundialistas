# Tactical Layout Engine

El **Tactical Layout Engine** es una librería pura, determinista y matemáticamente rigurosa para el cálculo de distribuciones (layouts) de jugadores sobre un campo de fútbol.

Está completamente desacoplado de React, HTML, SVG o cualquier proveedor de datos específico. Su única responsabilidad es resolver un problema geométrico de optimización con restricciones.

## Objetivo
Dada una lista de posiciones teóricas de jugadores (ej. `referenceX`, `referenceY`) y unas restricciones físicas (tamaño de la camiseta, márgenes, límites del campo), el motor encuentra la distribución visual óptima que:
1. **Maximice el tamaño de los elementos (escala).**
2. **Evite absolutamente cualquier colisión.**
3. **Mantenga el equipo dentro de sus límites estipulados (sin invadir medio campo).**
4. **Respete y preserve la estructura táctica (bandas y simetría).**

## API Pública

Toda interacción externa debe realizarse exclusivamente a través del punto de entrada `LayoutEngine.calculate`.
No se debe importar funciones internas del motor en componentes UI.

### `LayoutEngine.calculate(inputs, constraints)`

**Parámetros:**
- `inputs: LayoutElementInput[]`: Lista abstracta de jugadores a posicionar.
  ```typescript
  type LayoutElementInput = {
    id: string;
    role: string;
    referenceX: number; // Porcentaje relativo X (0-100)
    referenceY: number; // Porcentaje relativo Y (0-100)
  };
  ```
- `constraints: LayoutConstraints`: Reglas absolutas que el motor debe respetar.
  - `chipSize`: Dimensiones base para el escalado.
  - `margins` / `spacing`: Distancias mínimas a bordes y entre jugadores.
  - `fieldBounds`: Define la caja física de cálculo (ej. `yMin: 50, yMax: 100` acota la renderización a la mitad inferior del campo).

**Retorno:**
- `LayoutResult`: Estructura final resuelta.
  - `positions`: Coordenadas finales `x` e `y` garantizadas libres de colisión.
  - `chipScale`: El multiplicador óptimo logrado sin romper constraints.
  - `metrics`: Resumen analítico del rendimiento espacial (desviaciones, iteraciones, simetría lograda).

## Ejemplos de uso

```typescript
import { LayoutEngine } from "@/lib/lineup/tactical-layout-engine";

const result = LayoutEngine.calculate(
  [
    { id: "p1", role: "GK", referenceX: 50, referenceY: 90 },
    { id: "p2", role: "CB", referenceX: 50, referenceY: 70 }
  ], 
  {
    margins: { side: 6, vertical: 4 },
    spacing: { minHorizontal: 8, minVertical: 8 },
    chipSize: { minScale: 0.6, maxScale: 1.2, baseWidth: 10, baseHeight: 12 },
    nameAreaBounds: { width: 14, height: 4 },
    optimization: { mode: "balanced", maxIterations: 40, tolerance: 0.02 },
    fieldBounds: { xMin: 0, xMax: 100, yMin: 50, yMax: 100, isAwayHalf: false }
  }
);

console.log(result.positions); // Array con x e y absolutos calculados
console.log(result.chipScale); // Escala segura máxima
```

## Puntos de Extensión Previstos
La arquitectura en pipeline permite extender las lógicas en el futuro sin modificar la API expuesta:
- **Nuevas Fuerzas**: Se pueden añadir restricciones como elipses exclusivas (prohibir pisar el círculo central en el saque) agregando simples fuerzas repulsivas en el optimizador interno.
- **Detección Táctica Avanzada**: El módulo de estructura puede evolucionar para reconocer pasillos interiores vs exteriores, pasando directrices más complejas a las fuerzas sin cambiar el contrato de entrada/salida.

> **Regla estricta:** Ningún componente de la interfaz gráfica debe calcular posiciones o "empujar" offsets de CSS. La geometría debe provenir 100% de los resultados de este motor.
