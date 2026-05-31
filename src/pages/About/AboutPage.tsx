import classNames from "classnames/bind";
import { Header } from "../Header";
import styles from "./AboutPage.module.css";
import { DiscordLink } from "./DiscordLink";
import { Section, Subsection } from "./Section";

const cx = classNames.bind(styles);

export function AboutPage() {
	return (
		<>
			<Header />
			<Content />
		</>
	);
}

function Content() {
	return (
		<main className={cx("about-page")}>
			<Section title="What is this?">
				<p>
					A leaderboard of SponsorBlock VIPs, ranked by amount of moderation
					work. All data is scraped from the{" "}
					<a href="https://discord.gg/SponsorBlock">
						SponsorBlock Discord server
					</a>
					.
				</p>
				<p>
					Whoever ranks top each month will get 2x the regular VIP payout.{" "}
					<span className={cx("tangent")}>
						(Which is still $0, but it&apos;s the thought that counts.)
					</span>
				</p>
			</Section>

			<Section title="How &quot;work&quot; is counted">
				<Subsection title="1. Resolved tickets">
					<p>Tracked channels:</p>
					<ul>
						<li>
							<DiscordLink incorrect-submissions />
						</li>
						<li>
							<DiscordLink report-a-user />
						</li>
						<li>
							<DiscordLink warning-log /> before June 14 2024 (back then it
							served both as warning log and user report)
						</li>
					</ul>
					<p>
						Any message with one of these reactions ✅/❌/🔒/🗑️ is considered a
						ticket.
					</p>
					<p>
						Each VIP earns 1 point for each ticket they resolve. If multiple
						VIPs work on the same ticket (e.g. one reacts ✅, another reacts
						🔒), everyone involved earns 1 point.
					</p>
				</Subsection>

				<Subsection title="2. Warnings">
					<p>
						Tracked channel: <DiscordLink warning-log />
					</p>
					<p>
						Each VIP earns 1 point for each warning. Batch warnings count
						multiple times, once for each recipient.
					</p>
				</Subsection>

				<Subsection title="3. Bans">
					<p>Tracked channels:</p>
					<ul>
						<li>
							<DiscordLink bans />
						</li>
						<li>
							<DiscordLink warning-log /> before August 11 2021 (back then it
							served all 3 purposes)
						</li>
					</ul>
					<p>
						Each VIP earns 1 point for each ban. Batch bans count multiple
						times, once for each recipient.
					</p>
					<p>
						Any other VIP who reacts to a ban message with 👍/👎/🔨/✅/❌ also
						earns 1 point, but only 1 even if it&apos;s a batch ban.
					</p>
					<p>Approved and rejected bans are counted the same.</p>
					<p>
						Reacting <img src="./icon.png" width="16" alt="verified" /> to an
						auto ban announcement earns 1 point. Batch autobans count multiple
						times.
					</p>
				</Subsection>

				<Subsection title="Caveats">
					<p>
						All of these scoring methods are based on educated guesses such as:
					</p>
					<ul>
						<li>
							If a message has a ✅/❌/🔒/🗑️ reaction, it&apos;s probably a
							ticket.
						</li>
						<li>
							If a message contains 64 consecutive alphanumeric characters,
							that&apos;s probably a user ID, so it&apos;s probably a
							ban/warning based on the channel.
						</li>
						<li>
							Before the ban/warning channel split, it&apos;s good enough to
							check whether the message contains the word &quot;ban&quot; or
							&quot;warn&quot;.
						</li>
					</ul>
					<p>
						These are reasonable assumptions for a fun project, but don&apos;t
						take the data too seriously.{" "}
						<span className={cx("tangent")}>
							(The payout multiplier is definitely real though.)
						</span>
					</p>
					<p>
						If you are curious, the entire scoring logic is in{" "}
						<a href="https://github.com/FelixFourcolor/vip-leaderboard/blob/main/loader/scoring.ts">
							/loader/scoring.ts
						</a>
						.
					</p>
				</Subsection>
			</Section>

			<Section title="FAQs">
				<Subsection
					title={
						<>
							Why not include other channels such as <DiscordLink genderall />,{" "}
							<DiscordLink questions />, <DiscordLink de-arrow />?
						</>
					}
				>
					<p>
						Mostly for efficiency. These channels are more general-purpose than{" "}
						<DiscordLink incorrect-submissions /> and{" "}
						<DiscordLink report-a-user />. It&apos;s not worth scraping a huge
						amount of data for relatively few points.
					</p>
					<p>
						Also, outside the designated channels, the reactions ✅/❌/🔒/🗑️ are
						more likely to be used for other purposes, so those few points are
						also less accurate. It&apos;s just not worth it.
					</p>
				</Subsection>

				<Subsection title="How did you decide these scoring methods?">
					<p>
						I want to approximate the amount of effort each action takes, with 1
						unit of work = 1 point. For example, it takes the same effort to
						propose a ban whether it&apos;s approved or not, that&apos;s why
						approved and rejected bans are counted the same.
					</p>
				</Subsection>

				<Subsection title="Why only count the last 2 years?">
					<p>
						Mostly to make it more exicting to check back every month, as
						rankings are more likely to change with a rolling window. I think 2
						years is a good balance that acknowledges both old and new VIPs.
					</p>
					<p>
						Also, <DiscordLink report-a-user /> was separated from{" "}
						<DiscordLink warning-log /> in June 2024, coincidentally about 2
						years before the start of this project. So it&apos;s a good cutoff
						to have more reliable data.
					</p>
					<p>
						You will always have the option to see the full data, but the
						canonical ranking is based on the last 2 years (because I say so
						😎).
					</p>
				</Subsection>

				<Subsection title="Can I opt out?">
					<p>Of course, just let me know.</p>
				</Subsection>

				<Subsection title="Is this vibe coded?">
					<p>
						Vibe coding is a shameful thing and <em>if</em> I ever did it, I
						would never admit it and would take all measures to hide all
						evidence of it (e.g. you would never find an <code>agents.md</code>{" "}
						or a bot-authored commit in my repo). Just hypothetically, of
						course, I&apos;m not admitting anything. 🙃
					</p>
				</Subsection>
			</Section>
		</main>
	);
}
