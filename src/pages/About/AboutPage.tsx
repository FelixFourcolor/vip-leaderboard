import classNames from "classnames/bind";
import styles from "./AboutPage.module.css";
import { DiscordLink } from "./DiscordLink";

const cx = classNames.bind(styles);

export function AboutPage() {
	return (
		<div className={cx("about")}>
			<h2>What is this?</h2>
			<p>
				A leaderboard of SponsorBlock VIPs, ranked by amount of moderation work.
				All data is scraped from the{" "}
				<a href="https://discord.gg/SponsorBlock">
					SponsorBlock Discord server
				</a>
				.
			</p>

			<h2>Purpose</h2>
			<p>
				The VIP who ranks top each month will get 2x the regular pay rate.
				(Which is still $0, but it&apos;s the thought that counts.)
			</p>

			<h2>How work is counted</h2>

			<h3>Resolved tickets</h3>
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
				⚠️ and 🔨, although frequently used to resolve tickets, are not counted
				to avoid double counting warnings and bans.
			</p>

			<h3>Warnings</h3>
			<p>
				Tracked channel: <DiscordLink warning-log />
			</p>
			<p>
				Warnings are detected by the presence of a user ID in the message&apos;s
				content.
			</p>
			<p>
				Each VIP earns 1 point for each warning. Batch warnings count multiple
				times, once for each recipient.
			</p>

			<h3>Bans</h3>
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
				Bans are detected by the presence of a user ID in the message&apos;s
				content.
			</p>
			<p>
				Each VIP earns 1 point for each ban. Batch bans count multiple times,
				once for each recipient.
			</p>
			<p>
				Any other VIP who reacts to a ban message with 👍 👎 🔨 ✅ ❌ (to
				indicate support or opposition) also earns 1 point, but only 1 even if
				it&apos;s a batch ban.
			</p>
			<p>
				Even if a ban proposal is rejected, it&apos;s still counted the same.
			</p>
			<p>
				Reacting <img src="./icon.png" width="16" alt="verified" /> to an auto
				ban announcement earns 1 point, but only 1 even if it&apos;s a batch
				ban.
			</p>

			<h2>Limitations</h2>
			<p>
				The biggest issue is that <DiscordLink warning-log /> used to serve
				multiple purpose. There are ways to guess for each message whether
				it&apos;s a ticket/warning/ban, but all data before August 11 2021 (and
				to a lesser extent, June 14 2024) is less reliable.
			</p>
			<p>
				Actually, all of these scoring methods are guess-based. Many other
				things could go wrong such as:
			</p>
			<ul>
				<li>
					✅ ❌ etc. might be used for purposes other than resolving a ticket.
				</li>
				<li>
					A message might contain a user ID but is neither a ban nor a warning
					(just a discussion about that user)
				</li>
				<li>
					A message might contain what looks like a user ID (64 consecutive
					alphanumeric characters) but isn&apos;t.
				</li>
			</ul>
			<p>
				So <em>all</em> data is inherently unreliable. It&apos;s just for
				funsies.
			</p>

			<h2>FAQs</h2>

			<h3>
				Why not include other channels such as <DiscordLink genderall />,{" "}
				<DiscordLink questions />, <DiscordLink de-arrow />?
			</h3>
			<p>
				Mostly for efficiency. These channels are more general-purpose than{" "}
				<DiscordLink incorrect-submissions /> and <DiscordLink report-a-user />.
				It&apos;s not worth scraping and processing a huge amount of data to add
				a relatively small number of points.
			</p>
			<p>
				But there's also an increased risk of errors. ✅ ❌ 🔒 🗑️ have
				well-defined meanings in the chosen channels, but less so for others.
				Tracking other channels will increase the ratio of false positives.
			</p>

			<h3>Why are reactions to batch bans only counted once?</h3>
			<p>
				The rationale behind all these scoring methods is to approximate the
				amount of effort each action takes: 1 point = 1 unit of work. It&apos;s
				much easier to react 👍 to a ban proposal than to come up with the
				proposed list.
			</p>

			<h3>Can I customize how points are counted?</h3>
			<p>
				Technically yes, but adding such customizations will make the app
				slower, and I also prefer keeping the UI simple. If you want any
				changes, let&apos;s talk about it in the server and I&apos;ll follow the
				consensus opinion.{" "}
				<img
					src="https://wiki.sponsor.ajay.app/images/thumb/5/5b/Icon_interaction_reminder.svg/16px-Icon_interaction_reminder.svg.png"
					alt="interaction reminder"
				/>
			</p>

			<h3>How frequently is the data updated?</h3>
			<p>
				I scrape the server once at the end of each month. That means if you
				change/delete your reactions/messages within the same month, the change
				will be counted; but if you resolve a ticket from a previous month, it
				will not be counted.
			</p>
			<p>
				Bad, I know. But as I said, the data is already unreliable in other
				ways. 😅
			</p>

			<h3>Can I opt out?</h3>
			<p>Of course, let me know.</p>

			<h3>Why is it buggy?</h3>
			<p>Incompetence.</p>
		</div>
	);
}
