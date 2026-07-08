import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: pools } = await s.from('pools').select('id, name').limit(1)
  const pool = pools?.[0]
  if (!pool) { console.log('no pool'); return }
  console.log('Pool:', pool.name, pool.id)

  const PAGE = 500
  const allPreds: any[] = [], allMvps: any[] = []
  for (let i = 0; ; i++) {
    const f = i * PAGE, t = f + PAGE - 1
    const [{ data: pr }, { data: mv }] = await Promise.all([
      s.from('predictions').select('profile_id, points_awarded, matches!inner(group_code)').eq('pool_id', pool.id).not('points_awarded', 'is', null).range(f, t),
      s.from('match_mvp_predictions').select('profile_id, points_awarded').eq('pool_id', pool.id).gt('points_awarded', 0).range(f, t)
    ])
    if (!pr?.length) break
    allPreds.push(...pr)
    allMvps.push(...(mv ?? []))
    if (pr.length < PAGE) break
  }

  const matchScores: Record<string, any> = {}
  for (const p of allPreds) {
    const id = p.profile_id
    if (!matchScores[id]) matchScores[id] = { matchPts: 0, mvpPts: 0 }
    matchScores[id].matchPts += p.points_awarded ?? 0
  }
  for (const m of allMvps) {
    const id = m.profile_id
    if (!matchScores[id]) matchScores[id] = { matchPts: 0, mvpPts: 0 }
    matchScores[id].mvpPts += m.points_awarded ?? 0
  }

  // 2. General predictions
  const { data: general } = await s.from('tournament_general_prediction_scores').select('*').eq('pool_id', pool.id)
  const genPts: Record<string, number> = {}
  for (const g of general || []) genPts[g.profile_id] = g.total_points ?? 0

  // 3. Quiz final bonus
  const { data: bonus } = await s.from('quiz_final_ranking_scores').select('*').eq('pool_id', pool.id)
  const qBonus: Record<string, number> = {}
  if (bonus?.length) {
    for (const b of bonus) qBonus[b.profile_id] = b.bonus_points ?? 0
    console.log('Quiz bonus table has', bonus.length, 'rows')
  } else {
    console.log('Quiz bonus table empty, computing fallback')
    const { data: qlb } = await s.from('quiz_leaderboard').select('profile_id, best_score').eq('pool_id', pool.id).eq('competitive', true).eq('official', true)
    const qScores: Record<string, number> = {}
    for (const q of qlb || []) qScores[q.profile_id] = (qScores[q.profile_id] ?? 0) + (q.best_score ?? 0)
    const sorted = Object.entries(qScores).sort(([, a], [, b]) => b - a)
    sorted.slice(0, 4).forEach(([id], i) => { qBonus[id] = [5, 3, 2, 1][i] })
  }

  // 4. Profiles
  const profileIds = new Set([...Object.keys(matchScores), ...Object.keys(genPts), ...Object.keys(qBonus)])
  const { data: profiles } = await s.from('profiles').select('id, display_name, username').in('id', [...profileIds])
  const names: Record<string, string> = {}
  for (const p of profiles || []) names[p.id] = p.display_name || p.username

  // verify pool membership
  const { data: members } = await s.from('pool_members').select('profile_id').eq('pool_id', pool.id)
  const memberSet = new Set((members || []).map((m: any) => m.profile_id))

  const rows = Object.entries(matchScores)
    .filter(([id]) => memberSet.has(id))
    .map(([id, m]) => {
      const gen = genPts[id] ?? 0
      const qb = qBonus[id] ?? 0
      const matchCumulative = m.matchPts + m.mvpPts
      const total = matchCumulative + gen + qb
      return { id, name: names[id] || id.slice(0, 8), matchPts: m.matchPts, mvpPts: m.mvpPts, matchCumulative, gen, qb, total }
    })
    .sort((a, b) => b.total - a.total)

  console.log('\n #  Nombre         Match  +MVP   =Cum   +Gen  +QB   =Total')
  console.log('-'.repeat(65))
  for (const [i, r] of rows.entries()) {
    const line = (i + 1).toString().padStart(2) + '. ' +
      r.name.padEnd(14) + ' ' +
      r.matchPts.toString().padStart(5) + ' ' +
      r.mvpPts.toString().padStart(4) + ' ' +
      r.matchCumulative.toString().padStart(5) + ' ' +
      r.gen.toString().padStart(5) + ' ' +
      r.qb.toString().padStart(4) + ' ' +
      r.total.toString().padStart(5)
    console.log(line)
  }

  const hec = rows.find(r => r.id === '29231466-19ad-4d4f-9402-1349a3dbec47')
  if (hec) console.log('\nHECTOR:', JSON.stringify(hec, null, 2))

  // Also check quiz individual scores
  const { data: quizLB } = await s.from('quiz_leaderboard').select('profile_id, best_score').eq('pool_id', pool.id).eq('competitive', true).eq('official', true)
  const qIndiv: Record<string, number> = {}
  for (const q of quizLB || []) qIndiv[q.profile_id] = (qIndiv[q.profile_id] ?? 0) + (q.best_score ?? 0)
  console.log('\nQuiz individual scores (not included in Total, for reference):')
  for (const r of rows) {
    if (qIndiv[r.id]) console.log('  ' + r.name + ': ' + qIndiv[r.id])
  }
}
main().catch(console.error)
