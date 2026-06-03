import { ZACK } from "virtual:db";
import { useRef } from "react";
import { Toggle } from "@/components/Toggle";
import { setIsZack, useIsZack } from "@/hooks/useIsZack";

export function ZackToggle() {
	const isZack = useIsZack();

	const fetchedRef = useRef(isZack);
	const prefetch = () => {
		if (!fetchedRef.current) {
			const img = new Image();
			img.src = zackAvatarUrl;
			fetchedRef.current = true;
		}
	};

	return (
		<Toggle
			value={isZack}
			onChange={setIsZack}
			customStyles={{
				container: {
					backgroundColor: isZack ? ZACK.color : undefined,
				},
				slider: {
					backgroundImage: isZack
						? `url("${zackAvatarUrl}")`
						: `url("${moonIconUrl}")`,
				},
			}}
			onMouseEnter={prefetch}
			onFocus={prefetch}
		/>
	);
}

// The toggle is only 15px, but fetch the 24px version because
// it's likely already fetched elsewhere, reusing the cache
const zackAvatarUrl = `https://cdn.discordapp.com/${ZACK.avatarUrl}?size=24`;

const moonIconUrl = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#21202f"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
)}`;
