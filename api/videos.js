// Returns the latest MythVerse Kids uploads as JSON, sourced from the
// channel's public RSS feed (no API key needed; feed carries ~15 newest videos).
const CHANNEL_ID = 'UC2ufVUMUUcEwaMsmsmiHmFw';

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

module.exports = async (req, res) => {
  try {
    const feedRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`
    );
    if (!feedRes.ok) throw new Error(`Feed responded ${feedRes.status}`);
    const xml = await feedRes.text();

    const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
      .map((m) => {
        const entry = m[1];
        const pick = (re) => {
          const hit = entry.match(re);
          return hit ? hit[1].trim() : '';
        };
        return {
          id: pick(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/),
          title: decodeEntities(pick(/<title>([\s\S]*?)<\/title>/)),
          published: pick(/<published>([\s\S]*?)<\/published>/),
        };
      })
      .filter((v) => v.id);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ videos });
  } catch (err) {
    res.status(502).json({ error: 'Could not load videos' });
  }
};
