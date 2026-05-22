# VIP leaderboard

A leaderboard of SponsorBlock VIPs, ranked by amount of moderation work. All data is scraped from the [SponsorBlock Discord server](https://discord.gg/SponsorBlock).

## Purpose

The VIP who ranks top each month will get 2x the regular pay rate. (Which is still $0, but it's the thought that counts.)

## How work is counted

### Resolved tickets

Tracked channels:

- [#incorrect-submissions](https://discord.com/channels/603643120093233162/655247785561554945)
- [#report-a-user](https://discord.com/channels/603643120093233162/1251265309617291274)
- [#warning-log](https://discord.com/channels/603643120093233162/614936519710605408) before June 14 2024 (back then it served both purposes as warning log and user report)

Any message with one of these reactions ✅ ❌ 🔒 🗑️ is considered a ticket.

Each VIP earns 1 point for each ticket they resolve. If multiple VIPs work on the same ticket (e.g. one reacts ✅, another reacts 🔒), everyone involved earns 1 point.

⚠️ and 🔨, although frequently used to resolve tickets, are not counted to avoid double counting warnings and bans.

### Warnings

Tracked channel: [#warning-log](https://discord.com/channels/603643120093233162/614936519710605408)

Warnings are detected by the presence of a user ID in the message's content.

Each VIP earns 1 point for each warning. Batch warnings count multiple times, once for each recipient.

### Bans

Tracked channels:

- [#bans](https://discord.com/channels/603643120093233162/875213677530320897)
- [#warning-log](https://discord.com/channels/603643120093233162/614936519710605408)
 before August 11 2021 (back then it served all 3 purposes)

Bans are detected by the presence of a user ID in the message's content.

Each VIP earns 1 point for each ban. Batch bans count multiple times, once for each recipient.

Any other VIP who reacts to a ban message with 👍 👎 🔨 ✅ ❌ (to indicate support or opposition) also earns 1 point, but only 1 even if it's a batch ban.

Even if a ban proposal is rejected, it's still counted the same.

Reacting <img src="public/icon.png" width="16" alt="verified" style="vertical-align: middle"/> to an auto ban announcement earns 1 point, but only 1 even if it's a batch ban.

## Limitations

The biggest issue is that [#warning-log](https://discord.com/channels/603643120093233162/614936519710605408) used to serve multiple purpose. There are ways to guess for each message whether it's a ticket/warning/ban, but all data before August 11 2021 (and to a lesser extent, June 14 2024) is less reliable.

Actually, all of these scoring methods are guess-based. Many other things could go wrong such as:

- ✅ ❌ etc. might be used for purposes other than resolving a ticket.
- A message might contain a user ID but is neither a ban nor a warning (just a discussion about that user)
- A message might contain what looks like a user ID (64 consecutive alphanumeric characters) but isn't.

So *all* data is inherently unreliable. It's just for funsies.

## FAQs

### Why not include other channels such as [#genderall](https://discord.com/channels/603643120093233162/603643299961503761), [#questions](https://discord.com/channels/603643120093233162/603643180663177220), [#de-arrow](https://discord.com/channels/603643120093233162/897699762738966558)?

**Efficiency**: These channels are more general-purpose than [#incorrect-submissions](https://discord.com/channels/603643120093233162/655247785561554945) and [#report-a-user](https://discord.com/channels/603643120093233162/1251265309617291274). It's not worth scraping and parsing a huge amount of data to add a relatively small number of points.

**Risk of error**: ✅ ❌ 🔒 🗑️ have well-defined meanings in the chosen channels, but less so for others. Tracking other channels will increase the ratio of false positives.

### Why are reactions to batch bans only counted once?

The rationale behind all these scoring methods is to approximate the amount of effort each action takes: 1 point = 1 unit of work. It's much easier to react 👍 to a ban proposal than to come up with the proposed list.

### Can I customize how points are counted?

Technically yes, but adding such customizations will make the app slower, and I also prefer keeping the UI simple. If you want any changes, let's talk about it in the server and I'll follow the consensus opinion. <img src="https://wiki.sponsor.ajay.app//images/thumb/5/5b/Icon_interaction_reminder.svg/16px-Icon_interaction_reminder.svg.png" alt="interaction reminder">

### How frequently is the data updated?

I scrape the server once at the end of each month. That means if you change/delete your reactions/messages within the same month, the change will be counted; but if you resolve a ticket from a previous month, it will not be counted.

Bad, I know. But as I said, the data is already unreliable in other ways. 😅

### Can I opt out?

Of course, let me know.

### Why is it buggy?

Incompetence.
