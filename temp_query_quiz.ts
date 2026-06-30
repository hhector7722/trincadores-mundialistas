import { createAdminClient } from './lib/scripts/supabase-admin';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const sb = createAdminClient();
  const { data } = await sb.from('quiz_jersey_pick_bank').select('*').eq('target_date', '2026-06-30');
  console.log('Jersey bank for 2026-06-30:', data);
}
main();
