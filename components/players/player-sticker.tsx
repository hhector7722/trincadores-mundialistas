import Image from "next/image";
import { cn } from "@/lib/utils";

interface PlayerStickerProps extends React.HTMLAttributes<HTMLDivElement> {
  player: {
    sticker_url?: string | null;
    player_name?: string;
  };
  width?: number;
  height?: number;
}

export function PlayerSticker({ 
  player, 
  width, 
  height, 
  className,
  ...props 
}: PlayerStickerProps) {
  if (!player.sticker_url) {
    return null; // Or return a fallback UI if needed
  }

  return (
    <div 
      className={cn("relative overflow-hidden flex items-center justify-center", className)}
      style={{ ...(width ? { width } : {}), ...(height ? { height } : {}) }}
      {...props}
    >
      <Image
        src={player.sticker_url}
        alt={`Sticker dorsal de ${player.player_name || "jugador"}`}
        fill
        className="object-contain"
        sizes={width ? `${width}px` : "120px"}
      />
    </div>
  );
}
