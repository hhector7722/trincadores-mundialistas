import { createAdminClient } from './lib/scripts/supabase-admin';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const sb = createAdminClient();
  const { data } = await sb.from('quizzes').select('id, quiz_date, pool_id, opens_at, closes_at').eq('quiz_date', '2026-06-30');
  console.log(data);
}
main();
