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
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-11 w-11 sm:h-12 sm:w-12",
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

  const boxW = config?.width ?? (nativeWidth / 2);
  const boxH = config?.height ?? nativeHeight;
  const boxX = config?.left ?? 0;
  const boxY = config?.top ?? 0;

  // Cuánto hay que escalar la imagen original para que 'boxW' llene el contenedor (100%)
  const scale = 1 / (boxW / nativeWidth);
  
  // Cuánto hay que desplazar en porcentaje relativo a la propia imagen original
  // formula: object-position se comporta raro con object-fit cover.
  // Usaremos absolute con width/height escalado.
  
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full shadow-sm ring-1 ring-black/10",
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 w-full h-full">
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
