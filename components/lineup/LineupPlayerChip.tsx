import { SubstitutionMarkerIcon } from "@/components/live/SubstitutionMarkerIcon";
import { getTeamKitColors } from "@/lib/lineup/team-kit-colors";
import {
  displayNameInSquad,
  mvpFieldDisplayName,
  shirtPlayerName,
} from "@/lib/lineup/short-player-name";
import type { LineupSlot } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";
import { PlayerSticker } from "@/components/players/player-sticker";

type LineupPlayerChipProps = {
  slot: LineupSlot;
  teamName: string;
  onClick?: () => void;
  variant?: "default" | "modal" | "match";
  selected?: boolean;
  disabled?: boolean;
  /** Borde grueso en la camiseta (visitante con color titular coincidente). */
  awayKitClashBorder?: boolean;
  /** Nombres completos de la plantilla para desambiguar apellidos repetidos. */
  squadPlayerNames?: string[];
  substitutionMarker?: "in" | "out" | null;
  /** URL de la imagen generada de la camiseta trasera con el dorsal */
  stickerUrl?: string | null;
};

import { TeamCamiFront } from "@/components/matches/TeamCamiFront";
import { TeamCamiBack } from "@/components/matches/TeamCamiBack";

export function LineupPlayerChip({
  slot,
  teamName,
  onClick,
  variant = "default",
  selected = false,
  disabled = false,
  awayKitClashBorder = false,
  squadPlayerNames,
  substitutionMarker = null,
  stickerUrl = null,
}: LineupPlayerChipProps) {
  const isModal = variant === "modal";
  const isMatch = variant === "match";
  const kit = getTeamKitColors(teamName);
  const dorsal = slot.shirtNumber != null && slot.shirtNumber > 0 ? String(slot.shirtNumber) : "?";
  const interactive = Boolean(onClick) && !slot.isPlaceholder && !disabled;
  const useKitColors = !slot.isPlaceholder;
  const jerseyFill = useKitColors ? kit.kit : "rgba(0,0,0,0.3)";
  const clashOutline = awayKitClashBorder && isMatch;
  const jerseyStroke = clashOutline
    ? "var(--tm-accent)"
    : useKitColors
      ? kit.border
      : "rgba(255,255,255,0.25)";
  const jerseyStrokeWidth = clashOutline ? 2 : 1.2;
  const dorsalColor = useKitColors ? kit.dorsal : "var(--tm-accent)";

  const displayName = isMatch
    ? mvpFieldDisplayName(slot.name, squadPlayerNames)
    : squadPlayerNames?.length
      ? displayNameInSquad(slot.name, squadPlayerNames)
      : shirtPlayerName(slot.name);

  // Determinar si tenemos cami real
  const dbTeamsToCamiKey: Record<string, string> = {
    'Argentina': 'argentina', 'Belgium': 'belgica', 'Brazil': 'brasil', 'Canada': 'canada',
    'Colombia': 'colombia', 'Egypt': 'egipto', 'Spain': 'españa', 'France': 'francia',
    'England': 'inglaterra', 'Morocco': 'marruecos', 'Mexico': 'mejico', 'Norway': 'noruega',
    'Paraguay': 'paraguay', 'Portugal': 'potugal', 'Switzerland': 'suiza', 'USA': 'usa'
  };
  const hasCami = !!dbTeamsToCamiKey[teamName];

  const CamiComponent = isModal ? TeamCamiFront : TeamCamiBack;

  const content = (
    <>
      {hasCami && !slot.isPlaceholder ? (
        <div className="relative">
          <CamiComponent
            team={teamName}
            className={cn(
              "block shrink-0 drop-shadow-md",
              isMatch
                ? "h-[2.8rem] w-[2.1rem] sm:h-[3rem] sm:w-[2.25rem]"
                : isModal
                  ? "h-[2.2rem] w-[1.65rem]"
                  : "h-[4.4rem] w-[3.3rem] sm:h-[4.8rem] sm:w-[3.6rem]",
              interactive && "transition-transform active:scale-95"
            )}
          />
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ paddingTop: "10%" }} // Ajuste vertical para centrar el dorsal
          >
            <span
              className="font-bold text-center leading-none"
              // Ajustar tamaño del texto según el contenedor
              style={{
                color: dorsalColor,
                fontSize: isMatch ? "0.85rem" : isModal ? "0.7rem" : "1.1rem",
                textShadow: "0px 1px 2px rgba(0,0,0,0.4)"
              }}
            >
              {dorsal}
            </span>
          </div>
        </div>
      ) : (
        <svg
          viewBox="0 3 48 45"
          aria-hidden
          className={cn(
            "block shrink-0",
            isMatch
              ? "h-[2.8rem] w-[2.1rem] sm:h-[3rem] sm:w-[2.25rem]"
              : isModal
                ? "h-[2.2rem] w-[1.65rem]"
                : "h-[4.4rem] w-[3.3rem] sm:h-[4.8rem] sm:w-[3.6rem]",
            interactive && "transition-transform active:scale-95"
          )}
        >
          {clashOutline ? (
            <path
              d="M24 4.5C18.8 4.5 15 7 13.4 10.6L6.8 13.2 3 21.8 8.4 23.4V47.5H39.6V23.4L45 21.8 41.2 13.2 34.6 10.6C33 7 29.2 4.5 24 4.5Zm0 3.2c2.6 0 4.7 1 5.9 2.7-1.4-.8-3-1.2-5.9-1.2s-4.5.4-5.9 1.2c1.2-1.7 3.3-2.7 5.9-2.7Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={3.2}
              strokeLinejoin="round"
              opacity={0.92}
            />
          ) : null}
          <path
            d="M24 4.5C18.8 4.5 15 7 13.4 10.6L6.8 13.2 3 21.8 8.4 23.4V47.5H39.6V23.4L45 21.8 41.2 13.2 34.6 10.6C33 7 29.2 4.5 24 4.5Zm0 3.2c2.6 0 4.7 1 5.9 2.7-1.4-.8-3-1.2-5.9-1.2s-4.5.4-5.9 1.2c1.2-1.7 3.3-2.7 5.9-2.7Z"
            fill={jerseyFill}
            stroke={jerseyStroke}
            strokeWidth={jerseyStrokeWidth}
            strokeLinejoin="round"
            strokeDasharray={slot.isPlaceholder ? "2.5 2" : undefined}
          />
          <text
            x="24"
            y="29"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={dorsalColor}
            fontSize={isMatch ? "15.5" : isModal ? "12" : "20"}
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {dorsal}
          </text>
        </svg>
      )}
      <div
        className={cn(
          "w-full rounded border text-center",
          isMatch && selected
            ? "border-[var(--tm-accent)] bg-[var(--tm-accent)] px-0 py-0 leading-none"
            : cn(
                "backdrop-blur-sm",
                isMatch ? "max-w-[2.85rem] bg-black/60 px-0 py-0 leading-none" : "bg-black/60 px-1 py-0.5",
                selected ? "border-[var(--tm-accent)]" : isMatch ? "border-white/25" : "border-white/10"
              )
        )}
      >
        <p
          className={cn(
            "flex items-center justify-center gap-0.5 whitespace-normal text-center",
            isMatch && selected
              ? "text-[9.5px] font-bold leading-none tracking-tight text-[var(--tm-primary-fg)]"
              : cn(
                  "text-white",
                  isMatch
                    ? "text-[9.5px] font-bold leading-none tracking-tight"
                    : isModal
                      ? "text-[8px] font-semibold leading-none"
                      : "text-[9px] font-semibold leading-tight sm:text-[10px]"
                )
          )}
        >
          <span>{displayName}</span>
          {substitutionMarker ? <SubstitutionMarkerIcon kind={substitutionMarker} /> : null}
        </p>
        {!isModal && !isMatch ? (
          <p className="text-[8px] font-medium uppercase tracking-wide text-white/55 sm:text-[9px]">
            {slot.positionLabel}
          </p>
        ) : null}
      </div>
    </>
  );

  const shellClass = cn(
    "flex shrink-0 flex-col items-center gap-0",
    isMatch
      ? "min-h-[3.4rem] w-[3.05rem] touch-manipulation"
      : isModal
        ? "w-[3rem] min-h-10"
        : "w-[4.75rem] min-h-12 sm:w-[5.5rem]",
    slot.isPlaceholder && "opacity-70",
    disabled && "opacity-60"
  );

  if (!interactive) {
    return <div className={shellClass}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={shellClass}>
      {content}
    </button>
  );
}
