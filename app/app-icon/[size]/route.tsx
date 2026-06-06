import { createAppIcon } from "@/lib/app-icon-image";

const ALLOWED_SIZES = new Set([120, 192, 512]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await context.params;
  const size = Number(sizeParam);

  if (!ALLOWED_SIZES.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  return createAppIcon(size);
}
