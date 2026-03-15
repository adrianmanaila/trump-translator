export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    const r = await fetch('https://ix.cnn.io/data/truth-social/truth_archive.json');
    if (!r.ok) throw new Error('CNN feed returned ' + r.status);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=300');
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
