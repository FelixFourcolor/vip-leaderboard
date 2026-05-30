import { useEffect, useRef, useState } from "react";
import { Toggle } from "@/components/Toggle";
import { getUser, type User } from "@/db/user";
import { setIsZack, useIsZack } from "@/hooks/useIsZack";

export function ZackToggle() {
	const isZack = useIsZack();

	const [zackData, setZackData] = useState<User | undefined>();
	useEffect(() => {
		getUser("zackwb").then(setZackData);
	}, []);

	const zackAvatarUrl = zackData
		? `https://cdn.discordapp.com/${zackData.avatarUrl}?size=16`
		: undefined;

	// prefetch image to avoid delay when toggling
	const fetchedRef = useRef(false);
	useEffect(() => {
		if (zackAvatarUrl && !fetchedRef.current) {
			const img = new Image();
			img.src = zackAvatarUrl;
			fetchedRef.current = true;
		}
	}, [zackAvatarUrl]);

	return (
		<Toggle
			value={isZack}
			onChange={setIsZack}
			customStyles={{
				container: {
					backgroundColor: isZack ? (zackData?.color ?? undefined) : undefined,
				},
				slider: {
					backgroundImage: isZack
						? zackAvatarUrl
							? `url("${zackAvatarUrl}")`
							: undefined
						: `url("${moonSvgUrl}")`,
				},
			}}
		/>
	);
}

const moonSvgUrl = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#21202f"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
)}`;
