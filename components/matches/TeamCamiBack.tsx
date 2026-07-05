import Image from "next/image";
import { cn } from "@/lib/utils";
import { toSlug } from "@/lib/openfootball/slug";

export type TeamCamiBackProps = {
  team: string;
  size?: "sm" | "md" | "lg" | "xl" | "custom";
  className?: string;
  alt?: string;
};

const sizeClasses = {
  sm: "h-[3.75rem] w-[2.8125rem]", // 60x45 (ratio 0.75)
  md: "h-[4.5rem] w-[3.375rem]",   // 72x54 (ratio 0.75)
  lg: "h-[5rem] w-[3.75rem]",      // 80x60 (ratio 0.75)
  xl: "h-[7rem] w-[5.25rem]",
  custom: "", // Allows LineupPlayerChip to safely override sizes via className
};

export function TeamCamiBack({ team, size = "lg", className, alt }: TeamCamiBackProps) {
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
  let camiFileName = `${internalKey}-cami2.png`;
  
  // Custom fallback to handle special characters if not found in dictionary
  if (internalKey === 'suiza') camiFileName = 'suiza.cami2.png';

  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center shrink-0", sizeClasses[size], className)} title={alt}>
      <div className="absolute inset-0 w-full h-full">
         <Image
            src={`/camis/${camiFileName}`}
            alt={alt || team}
            fill
            className="object-contain"
            unoptimized={true}
         />
      </div>
    </div>
  );
}
