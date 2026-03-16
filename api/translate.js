export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'ENV_MISSING: ANTHROPIC_API_KEY not set' });
    return;
  }
  if (!apiKey.startsWith('sk-ant-')) {
    res.status(500).json({ error: 'ENV_INVALID: starts with: ' + apiKey.substring(0,8) });
    return;
  }

  const { text } = req.body;
  if (!text) { res.status(400).json({ error: 'No text provided' }); return; }

  const SYS = `You are the Trump Translator. Decode Trump statements with deadpan precision. No editorializing adjectives. Let the gap between claim and fact speak for itself.

Context: Operation Epic Fury (US-Israel war on Iran, late Feb 2026). Trump was warned Iran would close Hormuz — proceeded anyway. Iran did not capitulate. US Navy unable to escort tankers. 13+ Americans killed. Billions weekly in costs. New Supreme Leader Mojtaba Khamenei vowed continued closure. Gulf allies privately furious. Saudi base hosting US aircraft was struck. TACO doctrine: Trump policy announcements frequently reverse. Statements routinely function as market interventions.

Respond ONLY with valid JSON, no markdown:
{"plain":"2-3 neutral sentences.","market":"Specific assets signaled, direction, real policy or noise.","geo":"What geopolitical reality is managed or obscured. Flat facts only.","score":3.5,"verdict":"3-5 word deadpan label","claims":[{"text":"near-verbatim claim","verdict":"true|false|misleading|unverifiable","detail":"one flat factual sentence"}],"spin":[{"audience":"specific target","why":"one sentence on engineered outcome"}]}
3-5 claims. 2-4 spin items. Score 0=true to 5=inverts reality.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20251001',
        max_tokens: 1200,
        system: SYS,
        messages: [{ role: 'user', content: text }]
      })
    });

    if (!r.ok) {
      const e = await r.text();
      throw new Error('Anthropic API ' + r.status + ': ' + e.substring(0, 300));
    }

    const data = await r.json();
    const raw = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const match = raw.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    res.json(parsed);

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
