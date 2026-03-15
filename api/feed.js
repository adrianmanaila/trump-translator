export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch('https://ix.cnn.io/data/truth-social/truth_archive.json');
    if (!r.ok) throw new Error('upstream ' + r.status);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
