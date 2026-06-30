import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { generateNextJerseyPickQuestion } from './lib/quiz/lab/generate-jersey-pick-question';

async function main() {
  const targetDate = process.env.QUIZ_DATE || '2026-06-30';
  console.log('Generating jersey pick for', targetDate);
  await generateNextJerseyPickQuestion(targetDate);
  console.log('Done');
}
main().catch(console.error);
