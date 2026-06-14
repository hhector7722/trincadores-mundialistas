import { isStaticLabGeneratedAssetUrl } from "@/lib/quiz/lab/lab-asset-url";

export async function verifyStaticLabAssetExists(imageUrl: string): Promise<boolean> {
  if (!isStaticLabGeneratedAssetUrl(imageUrl)) return true;
  try {
    const response = await fetch(imageUrl, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}
