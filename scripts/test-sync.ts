import { syncKnockoutBracket } from "../lib/predictions/sync-knockout";

async function run() {
  console.log("Starting sync...");
  const result = await syncKnockoutBracket();
  console.log("Sync complete:", result);
}

run().catch(console.error);
