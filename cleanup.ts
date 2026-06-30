import { createAdminClient } from './lib/scripts/supabase-admin';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const sb = createAdminClient();
  const quizId = '6e24867c-a2a7-4fd7-8cfb-30a0201bf590';
  
  console.log('1. Deleting from quiz_leaderboard...');
  await sb.from('quiz_leaderboard').delete().eq('quiz_id', quizId);
  
  console.log('2. Deleting quiz_attempts...');
  await sb.from('quiz_attempts').delete().eq('quiz_id', quizId);

  console.log('3. Deleting quiz_questions_public...');
  await sb.from('quiz_questions_public').delete().eq('quiz_id', quizId);

  console.log('4. Deleting quiz...');
  await sb.from('quizzes').delete().eq('id', quizId);

  console.log('5. Resetting jersey pick status...');
  await sb.from('quiz_jersey_pick_bank').update({ status: 'ready' }).eq('target_date', '2026-06-30');
  
  console.log('Cleanup finished.');
}
main();
