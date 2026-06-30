import { createAdminClient } from './lib/scripts/supabase-admin';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const sb = createAdminClient();
  const quizId = '7af6d100-b844-4e19-b58d-867a847854b9';
  const { data: questions } = await sb.from('quiz_questions_public').select('id, sort_order, prompt, options').eq('quiz_id', quizId).order('sort_order');
  
  if (questions) {
    for (const q of questions) {
      console.log('Question', q.sort_order, q.prompt);
    }
  }
}
main();
