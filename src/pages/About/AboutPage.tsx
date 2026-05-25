import classNames from "classnames/bind";
import styles from "./AboutPage.module.css";
import { DiscordLink } from "./DiscordLink";
import { Section, Subsection } from "./Section";

const cx = classNames.bind(styles);

export function AboutPage() {
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
						Warnings are detected by the presence of a user ID in the message
						content.{" "}
						<span className={cx("tangent")}>
							(Oops{" "}
							<img
								src="https://cdn.discordapp.com/emojis/1269432955059568710.png"
								width="16"
								alt="mschae restaurant"
							/>
							)
						</span>
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
						Bans are detected by the presence of a user ID in the message
						content.
					</p>
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
							If a message has a ✅/❌ reaction, it&apos;s probably a ticket.
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
						<DiscordLink report-a-user />. It&apos;s not worth scraping and
						processing a huge amount of data to add a relatively small number of
						points.
					</p>
				</Subsection>

				<Subsection title="How did you decide these scoring methods?">
					<p>
						I want to approximate the amount of effort each action takes, with 1
						unit of work = 1 point. For example, it takes the same effort to
						propose a ban whether it&apos;s approved or not, that&apos;s why
						approved and rejected bans are counted the same.
					</p>
					<p>
						<img
							src="https://wiki.sponsor.ajay.app/images/thumb/5/5b/Icon_interaction_reminder.svg/16px-Icon_interaction_reminder.svg.png"
							alt="interaction reminder"
						/>{" "}
						If you have other ideas for how to count points, let&apos;s talk
						about it in the server and I&apos;ll follow the consensus opinion.{" "}
						<img
							src="https://wiki.sponsor.ajay.app/images/thumb/5/5b/Icon_interaction_reminder.svg/16px-Icon_interaction_reminder.svg.png"
							alt="interaction reminder"
						/>
					</p>
				</Subsection>

				<Subsection title="Can I opt out?">
					<p>Of course, just let me know.</p>
				</Subsection>

				<Subsection title="How often is the data updated?">
					<p>
						I scrape the server once at the end of each month. That also means
						if you resolve a ticket from a previous month, it will not be
						counted.
					</p>
					<p>Bad, I know. But the data is already unreliable in other ways.</p>
				</Subsection>

				<Subsection title="Why only count the last 2 years?">
					<p>
						I think 2 years is a good balance that gives a nod to the old
						generation while also giving new VIPs a chance to compete. And it's
						more exciting to check back every month, because the rankings are
						more likely to change.
					</p>
					<p>
						Also, <DiscordLink report-a-user /> was separated from{" "}
						<DiscordLink warning-log /> in June 2024, coincidentally about 2
						years before the start of this project. So it&apos;s a good cutoff
						to have more reliable data.
					</p>
					<p>
						You can drag the time slider to the beginning if you want, but the
						canonical ranking is based on the last 2 years (because I say so
						😎).
					</p>
				</Subsection>

				<Subsection
					title={
						<>
							Does this leak <DiscordLink bans />?
						</>
					}
				>
					<p>
						I don&apos;t think so, not in spirit. My database (
						<a href="./db.sqlite">db.sqlite</a>) only tracks <em>who</em> did a
						ban <em>when</em>, not the message content or whom got banned. You
						cannot recover any sensitive information from this.
					</p>
					<p>
						But let me know if you still have concerns, I&apos;ll stop tracking
						bans if necessary.
					</p>
				</Subsection>

				<Subsection title="Why is it buggy?">
					<p>Incompetence.</p>
				</Subsection>
			</Section>
		</main>
	);
}
