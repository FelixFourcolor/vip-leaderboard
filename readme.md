# VIP leaderboard

A leaderboard of SponsorBlock VIPs, ranked by amount of moderation work. All data is scraped from the [SponsorBlock Discord server](https://discord.gg/SponsorBlock).

## For users

See <https://felixfourcolor.github.io/vip-leaderboard/#/about>.

## For devs

The entire app is client-side. Clone, `npm install`, `npm run dev`.

One caveat, unless you are a VIP, you cannot tinker with how points are calculated (i.e., anything inside [/loader](https://github.com/FelixFourcolor/vip-leaderboard/tree/main/loader)), because that requires access to the Discord message history. If you are, let me know and I'll give you access.
