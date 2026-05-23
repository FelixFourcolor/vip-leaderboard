import classNames from "classnames/bind";
import styles from "./AboutPage.module.css";
import { DiscordLink } from "./DiscordLink";

const cx = classNames.bind(styles);

export function AboutPage() {
	return (
		<main className={cx("about-page")}>
			<h2>What is this?</h2>
			<p>
				A leaderboard of SponsorBlock VIPs, ranked by amount of moderation work.
				All data is scraped from the{" "}
				<a href="https://discord.gg/SponsorBlock">
					SponsorBlock Discord server
				</a>
				.
			</p>
			<p>
				Whoever ranks top each month will get 2x the regular VIP payout. (Which
				is still $0, but it&apos;s the thought that counts.)
			</p>

			<h2>How work is counted</h2>
			<h3>1. Resolved tickets</h3>
			<p>Tracked channels:</p>
			<ul>
				<li>
					<DiscordLink incorrect-submissions />
				</li>
				<li>
					<DiscordLink report-a-user />
				</li>
				<li>
					<DiscordLink warning-log /> before June 14 2024 (back then it served
					both purposes as warning log and user report)
				</li>
			</ul>
			<p>
				Any message with one of these reactions ✅ ❌ 🔒 🗑️ is considered a
				ticket.
			</p>
			<p>
				Each VIP earns 1 point for each ticket they resolve. If multiple VIPs
				work on the same ticket (e.g. one reacts ✅, another reacts 🔒),
				everyone involved earns 1 point.
			</p>
			<p>
				(⚠️ 🔨 are not counted to avoid double counting with warnings and bans.)
			</p>

			<h3>2. Warnings</h3>
			<p>
				Tracked channel: <DiscordLink warning-log />
			</p>
			<p>
				Warnings are detected by the presence of a user ID in the message
				content. (Oops{" "}
				<img
					src="https://cdn.discordapp.com/emojis/1269432955059568710.png"
					width="16"
					alt="mschae restaurant"
				/>
				)
			</p>
			<p>
				Each VIP earns 1 point for each warning. Batch warnings count multiple
				times, once for each recipient.
			</p>

			<h3>3. Bans</h3>
			<p>Tracked channels:</p>
			<ul>
				<li>
					<DiscordLink bans />
				</li>
				<li>
					<DiscordLink warning-log /> before August 11 2021 (back then it served
					all 3 purposes)
				</li>
			</ul>
			<p>
				Bans are detected by the presence of a user ID in the message content.
			</p>
			<p>
				Each VIP earns 1 point for each ban. Batch bans count multiple times,
				once for each recipient.
			</p>
			<p>
				Any other VIP who reacts to a ban message with 👍 👎 🔨 ✅ ❌ also earns
				1 point, but only 1 even if it&apos;s a batch ban.
			</p>
			<p>Approved and rejected bans are counted the same.</p>
			<p>
				Reacting <img src="./icon.png" width="16" alt="verified" /> to an auto
				ban announcement earns 1 point, but only 1 even if it&apos;s a batch
				ban.
			</p>

			<details>
				<summary>Caveats</summary>
				<p>
					All of these scoring methods are based on educated guesses. For
					instance
				</p>
				<ul>
					<li>
						It&apos;s unlikely that you would react ✅ ❌ to something other
						than a ticket.
					</li>
					<li>
						It&apos;s unlikely that a message would contain 64 consecutive
						alphanumeric characters but it would not be a warning or ban.
					</li>
					<li>
						For <DiscordLink warning-log /> before the ban/warning/report split,
						if the message contains the word &quot;warn&quot; it&apos;s probably
						a warning, likewise for &quot;ban&quot;, and otherwise it&apos;s
						probably a ticket.
					</li>
				</ul>
				<p>
					So don&apos;t take the data too seriously, it&apos;s just for funsies.
					(The VIP payout multiplier is definitely real though.)
				</p>
			</details>

			<h2>FAQs</h2>
			<details>
				<summary>
					Why not include other channels such as <DiscordLink genderall />,{" "}
					<DiscordLink questions />, <DiscordLink de-arrow />?
				</summary>
				<p>
					Mostly for efficiency. These channels are more general-purpose than{" "}
					<DiscordLink incorrect-submissions /> and{" "}
					<DiscordLink report-a-user />. It&apos;s not worth scraping and
					processing a huge amount of data to add a relatively small number of
					points.
				</p>
			</details>

			<details>
				<summary>How did you come up with these scoring methods?</summary>
				<p>
					I want to approximate the amount of effort each action takes, with 1
					unit of work = 1 point. For example, it takes the same effort to
					propose a ban regardless of whether it&apos;s approved, that&apos;s
					why approved and rejected bans are counted the same.
				</p>
				<p>
					If you have other ideas for how to count points, let&apos;s talk about
					it in the server and I&apos;ll follow the majority opinion.{" "}
					<img
						src="https://wiki.sponsor.ajay.app/images/thumb/5/5b/Icon_interaction_reminder.svg/16px-Icon_interaction_reminder.svg.png"
						alt="interaction reminder"
					/>
				</p>
			</details>

			<details>
				<summary>How often is the data updated?</summary>
				<p>
					I scrape the server once at the end of each month. But that also means
					if you resolve a ticket from a previous month, it will not be counted.
				</p>
				<p>Bad, I know. But the data is already unreliable in other ways.</p>
			</details>

			<details>
				<summary>Can I opt out?</summary>
				<p>Of course, just let me know.</p>
			</details>

			<details>
				<summary>Why is it buggy?</summary>
				<p>Incompetence.</p>
			</details>
		</main>
	);
}
