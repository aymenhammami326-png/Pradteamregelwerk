export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Keine User-ID angegeben' });

  const BOT_TOKEN   = process.env.DISCORD_BOT_TOKEN;
  const GUILD_ID    = '1477025465951588352';
  const ROLE_ID     = '1495441979109277899';
  const ADMIN_ID    = '1477023843489939487';

  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot-Token nicht konfiguriert' });

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (response.status === 404) {
      return res.status(200).json({ allowed: false, reason: 'not_in_server' });
    }
    if (!response.ok) {
      const err = await response.text();
      console.error('Discord API Fehler:', response.status, err);
      return res.status(500).json({ error: 'Discord API Fehler' });
    }

    const member = await response.json();
    const hasRole = member.roles.includes(ROLE_ID);
    const isAdmin = userId === ADMIN_ID;

    return res.status(200).json({
      allowed: hasRole || isAdmin,
      isAdmin,
      reason: hasRole ? 'has_role' : isAdmin ? 'is_admin' : 'no_role',
      username: member.user?.global_name || member.user?.username || null,
      avatar: member.user?.avatar || null,
    });
  } catch (err) {
    console.error('Check-role Fehler:', err);
    return res.status(500).json({ error: 'Interner Fehler' });
  }
}
