import { createAdminClient } from './lib/scripts/supabase-admin';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const sb = createAdminClient();
  const quizId = '7af6d100-b844-4e19-b58d-867a847854b9';
  
  const { data: profiles } = await sb.from('profiles').select('id, username').ilike('username', '%hector%');
  console.log('Profiles:', profiles);
  
  for (const p of profiles || []) {
    console.log('Deleting attempts for', p.username);
    await sb.from('quiz_leaderboard').delete().eq('quiz_id', quizId).eq('profile_id', p.id);
    await sb.from('quiz_attempts').delete().eq('quiz_id', quizId).eq('profile_id', p.id);
  }
}
main();
