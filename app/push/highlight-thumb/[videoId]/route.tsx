import { ImageResponse } from "next/og";
import { youtubeThumbnailUrl } from "@/lib/youtube/constants";

export const runtime = "edge";

type RouteParams = { params: Promise<{ videoId: string }> };

/** Imagen push: miniatura YouTube + overlay play (480×270). */
export async function GET(_request: Request, { params }: RouteParams) {
  const { videoId } = await params;
  const thumb = youtubeThumbnailUrl(videoId, "hqdefault");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#111",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          width={480}
          height={270}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.12) 45%, transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 9999,
              background: "rgba(82,82,91,0.88)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                marginLeft: 6,
                width: 0,
                height: 0,
                borderTop: "16px solid transparent",
                borderBottom: "16px solid transparent",
                borderLeft: "26px solid white",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: 480, height: 270 },
  );
}
