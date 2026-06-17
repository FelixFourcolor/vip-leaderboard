import classNames from "classnames/bind";
import { keys } from "@/utils/object";
import type { OneOf } from "@/utils/types";
import styles from "./AboutPage.module.css";

const cx = classNames.bind(styles);

export function DiscordLink(channel: OneOf<Record<ChannelName, true>>) {
	const channelName = keys(channel)[0]!;
	return (
		<a
			className={cx("discord-link")}
			href={channelURLs[channelName]}
			target="_blank"
			rel="noopener noreferrer"
		>
			{channelName}
		</a>
	);
}

const channelURLs = {
	"incorrect-submissions":
		"https://discord.com/channels/603643120093233162/655247785561554945",
	"report-a-user":
		"https://discord.com/channels/603643120093233162/1251265309617291274",
	"warning-log":
		"https://discord.com/channels/603643120093233162/614936519710605408",
	bans: "https://discord.com/channels/603643120093233162/875213677530320897",
	genderall:
		"https://discord.com/channels/603643120093233162/603643299961503761",
	questions:
		"https://discord.com/channels/603643120093233162/603643180663177220",
	"de-arrow":
		"https://discord.com/channels/603643120093233162/897699762738966558",
} as const;

type ChannelName = keyof typeof channelURLs;
