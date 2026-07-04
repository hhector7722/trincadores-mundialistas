import { createAdminClient } from '../lib/supabase/admin';
import { generateSticker } from '../lib/stickers/generate';
import crypto from 'crypto';

async function runBatch() {
  const supabase = createAdminClient();

  console.log("Fetching team_squad_players...");
  const dbTeamsToCamiKey: Record<string, string> = {
    'Argentina': 'argentina',
    'Belgium': 'belgica',
    'Brazil': 'brasil',
    'Canada': 'canada',
    'Colombia': 'colombia',
    'Egypt': 'egipto',
    'Spain': 'españa',
    'France': 'francia',
    'England': 'inglaterra',
    'Morocco': 'marruecos',
    'Mexico': 'mejico',
    'Norway': 'noruega',
    'Paraguay': 'paraguay',
    'Portugal': 'potugal',
    'Switzerland': 'suiza',
    'USA': 'usa',
    'United States': 'usa'
  };

  const dbTeams = Object.keys(dbTeamsToCamiKey);

  console.log("Fetching team_squad_players...");
  let allPlayers: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: players, error } = await supabase
      .from('team_squad_players')
      .select(`
        id,
        player_name,
        shirt_number,
        sticker_hash,
        team_squads!inner (
          team_name,
          year
        )
      `)
      .in('team_squads.team_name', dbTeams)
      .eq('team_squads.year', 2026)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Error fetching players:", error);
      process.exit(1);
    }

    if (players && players.length > 0) {
      allPlayers = allPlayers.concat(players);
      from += pageSize;
      if (players.length < pageSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${allPlayers.length} players in total.`);
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const player of allPlayers) {
    if (!player.shirt_number) {
      skipped++;
      continue;
    }

    const dbTeamName = (player.team_squads as any).team_name as string;
    const teamKey = dbTeamsToCamiKey[dbTeamName];
    if (!teamKey) {
      skipped++;
      continue;
    }

    const squadNumber = player.shirt_number;
    
    // Calculate expected hash
    const hash = crypto.createHash("sha256").update(`${teamKey}-${squadNumber}-v2`).digest("hex");

    if (player.sticker_hash === hash) {
      skipped++;
      continue;
    }

    try {
      console.log(`Generating sticker for ${player.player_name} (${dbTeamName} #${squadNumber})...`);
      const buffer = await generateSticker(teamKey, squadNumber);
      
      const storageTeamKey = teamKey === 'españa' ? 'espana' : teamKey;
      const path = `${storageTeamKey}/${squadNumber}.png`;

      const { error: uploadError } = await supabase.storage
        .from("stickers")
        .upload(path, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("stickers")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("team_squad_players")
        .update({
          sticker_url: `${publicUrl}?v=2`,
          sticker_hash: hash,
        })
        .eq("id", player.id);

      if (updateError) {
        throw updateError;
      }

      generated++;
    } catch (err) {
      console.error(`Error generating for ${player.player_name}:`, err);
      errors++;
    }
  }

  console.log(`\nBatch complete! Generated: ${generated}, Skipped: ${skipped}, Errors: ${errors}`);
}

runBatch().catch(console.error);
