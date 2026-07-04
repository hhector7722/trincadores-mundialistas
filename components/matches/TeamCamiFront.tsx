import Image from "next/image";
import { cn } from "@/lib/utils";
import { TEAM_CUT_CONFIGS, NORMALIZED_CANVAS } from "@/lib/stickers/teamCutConfig";

interface TeamCamiFrontProps {
  team: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  alt?: string;
}

const sizeClasses = {
  sm: "h-8 w-6",
  md: "h-12 w-9",
  lg: "h-16 w-12 sm:h-[4.5rem] sm:w-[3.375rem]",
};

/**
 * Muestra la parte delantera de la camiseta.
 * Se apoya en la tabla de calibración (teamCutConfig) para calcular el recorte 
 * o asume un corte perfecto al 50% izquierdo por defecto.
 */
const dbTeamsToCamiKey: Record<string, string> = {
  'Argentina': 'argentina',
  'Belgium': 'belgica',
  'Brazil': 'brasil',
  'Canada': 'canada',
  'Colombia': 'colombia',
  'Egypt': 'egipto',
  'Spain': 'españa',
  'France': 'francia',
  'England': 'inglaterra',
  'Morocco': 'marruecos',
  'Mexico': 'mejico',
  'Norway': 'noruega',
  'Paraguay': 'paraguay',
  'Portugal': 'potugal',
  'Switzerland': 'suiza',
  'USA': 'usa',
  'United States': 'usa'
};

export function TeamCamiFront({ team, size = "lg", className, alt }: TeamCamiFrontProps) {
  const internalKey = dbTeamsToCamiKey[team] || team.toLowerCase();
  let camiFileName = `${internalKey}-cami.png`;
  if (internalKey === 'suiza') camiFileName = 'suiza.cami.png';

  const src = `/camis/${camiFileName}`;

  // Fallbacks: assume standard 1536x1024 if not provided, though the image might differ.
  // Ideally, the config should provide full dimensions. If the user fills it out, we use it.
  const config = TEAM_CUT_CONFIGS[internalKey]?.front;
  
  // Since we don't know the image dimensions in CSS unless provided,
  // the CSS trick requires knowing percentages.
  // Wait, if we know the front box, we can calculate percentages:
  // We can't do this purely in CSS without knowing the image width/height.
  // We will assume 1536x1024 as native if not configured.
  const nativeWidth = 1536; 
  const nativeHeight = 1024;

  let boxW = config?.width ?? (nativeWidth / 2);
  let boxH = config?.height ?? nativeHeight;
  let boxX = config?.left ?? 0;
  let boxY = config?.top ?? 0;

  // La caja exacta se usará para el crop original sin expandirlo y revelar la camiseta contigua.
  // El "padding" (8% por cada lado) se simula escalando el contenedor un 84% (100 - 8 - 8).
  const scaleInner = config ? "scale(0.84)" : "scale(1)";

  // Forzar que el bounding box tenga exactamente ratio 3:4 (0.75) para que no se deforme
  // al inyectarlo en el contenedor CSS que hemos ajustado a 3:4
  const targetRatio = 0.75;
  const currentRatio = boxW / boxH;

  if (currentRatio > targetRatio) {
    // Es más ancha de la cuenta: rellenar altura por arriba y abajo
    const newH = boxW / targetRatio;
    boxY = boxY - (newH - boxH) / 2;
    boxH = newH;
  } else if (currentRatio < targetRatio) {
    // Es más alta de la cuenta: rellenar anchura por los lados
    const newW = boxH * targetRatio;
    boxX = boxX - (newW - boxW) / 2;
    boxW = newW;
  }

  // Cuánto hay que escalar la imagen original para que 'boxW' llene el contenedor (100%)
  const scale = 1 / (boxW / nativeWidth);
  
  // Cuánto hay que desplazar en porcentaje relativo a la propia imagen original
  // formula: object-position se comporta raro con object-fit cover.
  // Usaremos absolute con width/height escalado.
  
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center"
        style={{ transform: scaleInner }}
      >
         <Image
            src={src}
            alt={alt ?? `Camiseta de ${team}`}
            fill
            className="object-fill max-w-none"
            style={{
              width: `${scale * 100}%`,
              height: `${(nativeHeight / boxH) * 100}%`,
              left: `-${(boxX / boxW) * 100}%`,
              top: `-${(boxY / boxH) * 100}%`,
            }}
            sizes="96px"
          />
      </div>
    </div>
  );
}

export function TeamCamiFrontButton({
  team,
  onClick,
  size = "lg",
}: Omit<TeamCamiFrontProps, "alt"> & { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="shrink-0 transition-transform active:scale-95"
      aria-label={`Ver plantilla de ${team}`}
    >
      <TeamCamiFront team={team} size={size} />
    </button>
  );
}
