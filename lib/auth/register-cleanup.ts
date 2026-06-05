import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Compensacion tras registro fallido: evita auth.users / profiles huerfanos.
 */
export async function rollbackFailedRegistration(
  userId: string,
  options: { deleteProfile: boolean }
): Promise<void> {
  const admin = createAdminClient();

  if (options.deleteProfile) {
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) {
      console.error("[rollback] profiles delete failed:", profileError.message);
    }
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("[rollback] deleteUser failed:", authError.message);
    throw new Error("No se pudo revertir el registro incompleto.");
  }
}
