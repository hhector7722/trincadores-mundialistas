import Image from "next/image";
import { cn } from "@/lib/utils";

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
  
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 w-full h-full">
         <Image
            src={src}
            alt={alt ?? `Camiseta de ${team}`}
            fill
            className="object-contain"
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
