import { keys } from "@/utils/object";
import type { OneOf } from "@/utils/types";

export function DiscordEmoji(emoji: OneOf<Record<EmojiCode, true>>) {
	const emojiCode = keys(emoji)[0]!;
	return <img src={emojiURLs[emojiCode]} width={16} alt={emojiCode} />;
}

const emojiURLs = {
	thumbsup: "https://cdn.discordapp.com/emojis/1031063526275551294.png",
	thumbup: "https://cdn.discordapp.com/emojis/1031065865883500614.png",
	ehh: "https://cdn.discordapp.com/emojis/1031079717828309063.png",
	thumbdown: "https://cdn.discordapp.com/emojis/1031068702864580699.png",
} as const;

type EmojiCode = keyof typeof emojiURLs;
