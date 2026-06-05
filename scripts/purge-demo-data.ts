import { createClient } from "@supabase/supabase-js";
import {
  assertPurgeConfirmed,
  assertServiceEnv,
} from "../lib/scripts/env-guard";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

async function deleteAll(
  admin: ReturnType<typeof createClient>,
  table: string,
  column: string
): Promise<void> {
  const { error } = await admin.from(table).delete().neq(column, ZERO_UUID);
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  console.log(`${table}: limpiada`);
}

async function purgeAuthUsers(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;
      console.log(`auth.users eliminado: ${user.id}`);
    }

    if (users.length < perPage) break;
    page += 1;
  }
}

async function main() {
  assertServiceEnv();
  assertPurgeConfirmed();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  await deleteAll(admin, "quiz_responses", "id");
  await deleteAll(admin, "quiz_attempts", "id");
  await deleteAll(admin, "quiz_question_keys", "question_id");
  await deleteAll(admin, "quiz_questions", "id");
  await deleteAll(admin, "quizzes", "id");
  await deleteAll(admin, "predictions", "id");
  await deleteAll(admin, "pool_member_scores", "pool_id");
  await deleteAll(admin, "match_results", "match_id");
  await deleteAll(admin, "matches", "id");
  await deleteAll(admin, "matchdays", "id");
  await deleteAll(admin, "activity_events", "id");
  await deleteAll(admin, "news_items", "id");
  await deleteAll(admin, "notifications", "id");
  await deleteAll(admin, "admin_audit_log", "id");
  await deleteAll(admin, "push_subscriptions", "id");
  await deleteAll(admin, "profile_achievements", "profile_id");
  await deleteAll(admin, "invite_codes", "id");
  await deleteAll(admin, "pool_members", "pool_id");
  await deleteAll(admin, "pools", "id");
  await deleteAll(admin, "profiles", "id");

  await purgeAuthUsers();
  console.log("Purga demo completada.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
