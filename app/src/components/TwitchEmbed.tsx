// Twitch's official embeds (player + chat) — real, live video and real,
// live chat. No API key needed for this; Twitch just requires the exact
// embedding domain(s) via `parent`, which we read from the browser at
// render time so this works unmodified on localhost, Vercel previews, and
// the production domain alike.
//
// CHANNEL is a placeholder — swap it for the real Twitch channel name
// before this goes anywhere beyond a private/internal demo. Attaching
// betting-style odds UI to a real person's stream without their say-so is
// a real person's likeness/identity being used for something they haven't
// agreed to, not just a technical embed — worth a deliberate decision, not
// a default left in in someone's original demo code.
export const TWITCH_CHANNEL = "twitch";

function getParentDomain(): string {
  return typeof window !== "undefined" ? window.location.hostname : "localhost";
}

export function TwitchPlayer({ channel = TWITCH_CHANNEL, className }: { channel?: string; className?: string }) {
  const parent = getParentDomain();
  const src = `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${parent}&muted=true`;

  return (
    <iframe
      src={src}
      title={`${channel} — live on Twitch`}
      allowFullScreen
      className={className}
      style={{ border: "none" }}
    />
  );
}

export function TwitchChat({ channel = TWITCH_CHANNEL, className }: { channel?: string; className?: string }) {
  const parent = getParentDomain();
  // darkpopout matches this app's dark theme instead of Twitch's default light chat.
  const src = `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?parent=${parent}&darkpopout`;

  return <iframe src={src} title={`${channel} — chat`} className={className} style={{ border: "none" }} />;
}
