import { createAppIcon } from "@/lib/app-icon-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  return createAppIcon(32);
}
