import Image from "next/image";

export function BackgroundPlayerLayer() {
  return (
    <div className="background-player-layer" aria-hidden="true">
      <div className="background-player-glow" />
      <div className="background-player-img-wrap">
        <Image
          src="/icons/ronaldo.png"
          alt=""
          width={482}
          height={829}
          priority
          sizes="(max-width: 640px) 40vw, 184px"
          className="background-player-img size-full"
        />
      </div>
    </div>
  );
}
