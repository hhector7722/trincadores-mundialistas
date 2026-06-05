"use server";

import { redirect } from "next/navigation";
import { toAuthEmail } from "@/lib/auth/credentials";
import { rollbackFailedRegistration } from "@/lib/auth/register-cleanup";
import {
  clearActivePoolCookie,
  resolvePoolMemberships,
  setActivePoolCookie,
} from "@/lib/auth/session";
import {
  normalizeUsername,
  validateInviteCode,
  validatePassword,
  validateUsername,
} from "@/lib/auth/validation";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = { ok: true } | { ok: false; error: string };

function mapInviteRpcError(message: string): string {
  if (message.includes("invalid_invite_code")) {
    return "Codigo de invitacion no valido.";
  }
  if (message.includes("invite_expired")) {
    return "Codigo de invitacion expirado.";
  }
  if (message.includes("invite_exhausted")) {
    return "Codigo de invitacion agotado.";
  }
  if (message.includes("already_member")) {
    return "Ya perteneces a esta porra.";
  }
  return "No se pudo completar el registro con ese codigo.";
}

async function applyPoolCookieForUser(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("pool_members")
    .select("pool_id")
    .eq("profile_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const resolution = resolvePoolMemberships(memberships);
  if (resolution.status === "single") {
    await setActivePoolCookie(resolution.poolId);
  }
}

export async function signIn(
  usernameRaw: string,
  password: string
): Promise<AuthActionResult> {
  const username = normalizeUsername(usernameRaw);
  const userError = validateUsername(username);
  const passError = validatePassword(password);
  if (userError) return { ok: false, error: userError };
  if (passError) return { ok: false, error: passError };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(username),
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: "Usuario o contrasena incorrectos." };
  }

  try {
    await applyPoolCookieForUser(data.user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al resolver la porra.";
    return { ok: false, error: msg };
  }

  return { ok: true };
}

export async function signUpAndJoin(formData: FormData): Promise<AuthActionResult> {
  const inviteCode = String(formData.get("inviteCode") ?? "");
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const displayNameRaw = String(formData.get("displayName") ?? "").trim();
  const displayName = displayNameRaw.length > 0 ? displayNameRaw : null;

  const inviteError = validateInviteCode(inviteCode);
  const userError = validateUsername(username);
  const passError = validatePassword(password);
  if (inviteError) return { ok: false, error: inviteError };
  if (userError) return { ok: false, error: userError };
  if (passError) return { ok: false, error: passError };

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: toAuthEmail(username),
    password,
    options: { data: { username } },
  });

  if (signUpError || !signUpData.user) {
    const msg = signUpError?.message ?? "";
    if (msg.toLowerCase().includes("already registered")) {
      return { ok: false, error: "Ese usuario ya existe." };
    }
    return { ok: false, error: "No se pudo crear la cuenta." };
  }

  const userId = signUpData.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    username,
    display_name: displayName,
  });

  if (profileError) {
    try {
      await rollbackFailedRegistration(userId, { deleteProfile: false });
    } catch {
      return {
        ok: false,
        error:
          "Registro incompleto y no se pudo limpiar. Contacta al administrador.",
      };
    }
    if (profileError.code === "23505") {
      return { ok: false, error: "Ese usuario ya existe." };
    }
    return { ok: false, error: "No se pudo crear el perfil." };
  }

  const { data: poolId, error: joinError } = await supabase.rpc(
    "consume_invite_and_join",
    { p_code: inviteCode.trim() }
  );

  if (joinError || !poolId) {
    try {
      await rollbackFailedRegistration(userId, { deleteProfile: true });
      await supabase.auth.signOut();
    } catch {
      return {
        ok: false,
        error:
          "Registro incompleto y no se pudo limpiar. Contacta al administrador.",
      };
    }
    return {
      ok: false,
      error: mapInviteRpcError(joinError?.message ?? ""),
    };
  }

  await setActivePoolCookie(poolId as string);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearActivePoolCookie();
  redirect("/login");
}

export async function requestPasswordReset(
  usernameRaw: string
): Promise<AuthActionResult> {
  const username = normalizeUsername(usernameRaw);
  const userError = validateUsername(username);
  if (userError) return { ok: false, error: userError };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(
    toAuthEmail(username),
    { redirectTo: `${siteUrl}/login` }
  );

  if (error) {
    console.error("[recovery]", error.message);
  }

  return {
    ok: true,
  };
}

export async function setActivePool(poolId: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesion no valida." };
  }

  
  const allowed = await assertPoolMembership(user.id, poolId);
  if (!allowed) {
    return { ok: false, error: "No perteneces a esa porra." };
  }

  await setActivePoolCookie(poolId);
  return { ok: true };
}
