import Image from "next/image";
import { cn } from "@/lib/utils";
import { TEAM_CUT_CONFIGS } from "@/lib/stickers/teamCutConfig";
import { toSlug } from "@/lib/openfootball/slug";

export type TeamCamiBackProps = {
  team: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
};

const sizeClasses = {
  sm: "h-[3.75rem] w-[2.8125rem]", // 60x45 (ratio 0.75)
  md: "h-[4.5rem] w-[3.375rem]",   // 72x54 (ratio 0.75)
  lg: "h-[5rem] w-[3.75rem]",      // 80x60 (ratio 0.75)
  xl: "h-[7rem] w-[5.25rem]",
};

export function TeamCamiBack({ team, size = "lg", className, alt }: TeamCamiBackProps) {
  let camiFileName = `${team}-cami.png`;
  
  // Convert DB team name ("Spain") to internal key ("españa")
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
    'USA': 'usa'
  };

  const internalKey = dbTeamsToCamiKey[team] || toSlug(team);
  
  // Custom fallback to handle special characters if not found in dictionary
  if (internalKey === 'españa') camiFileName = 'españa-cami.png';
  if (internalKey === 'potugal') camiFileName = 'potugal-cami.png';
  if (internalKey === 'belgica') camiFileName = 'belgica-cami.png';
  if (internalKey === 'mejico') camiFileName = 'mejico-cami.png';
  if (internalKey === 'suiza') camiFileName = 'suiza.cami.png';

  const config = TEAM_CUT_CONFIGS[internalKey]?.back;

  const nativeWidth = 1536; 
  const nativeHeight = 1024;

  let boxW = config?.width ?? (nativeWidth / 2);
  let boxH = config?.height ?? nativeHeight;
  let boxX = config?.left ?? (nativeWidth / 2); // Default to right half
  let boxY = config?.top ?? 0;

  const scaleInner = config ? "scale(0.84)" : "scale(1)";

  // Enforce exactly 3:4 (0.75) ratio
  const targetRatio = 0.75;
  const currentRatio = boxW / boxH;

  if (currentRatio > targetRatio) {
    const newH = boxW / targetRatio;
    boxY = boxY - (newH - boxH) / 2;
    boxH = newH;
  } else if (currentRatio < targetRatio) {
    const newW = boxH * targetRatio;
    boxX = boxX - (newW - boxW) / 2;
    boxW = newW;
  }

  const scale = 1 / (boxW / nativeWidth);

  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center", sizeClasses[size], className)} title={alt}>
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center"
        style={{ transform: scaleInner }}
      >
         <Image
            src={`/camis/${camiFileName}`}
            alt={alt || team}
            fill
            className="object-fill max-w-none"
            style={{
              width: `${scale * 100}%`,
              height: `${(nativeHeight / boxH) * 100}%`,
              left: `-${(boxX / boxW) * 100}%`,
              top: `-${(boxY / boxH) * 100}%`,
            }}
         />
      </div>
    </div>
  );
}
