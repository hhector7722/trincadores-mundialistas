import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const APP_ICON_BG = "#2a1058";

/** Logo escalado ~114 % sobre fondo sólido para evitar halos blancos al enmascarar en iOS/Android. */
export async function createAppIcon(size: number) {
  const logo = await readFile(join(process.cwd(), "public/icons/logo.png"));
  const logoSize = Math.round(size * 1.14);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: APP_ICON_BG,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          alt=""
          width={logoSize}
          height={logoSize}
          style={{ objectFit: "cover" }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
