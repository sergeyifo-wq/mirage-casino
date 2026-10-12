# Midnight Mirage

A glamorous, playable anime casino night. Five tables are staffed by adult hosts, the bar remembers what you said, and a hotel suite upstairs is for conversation — never a prize for a big stack.

Everyone in the building is 21 or older. Chips are fictional. Romance is optional, tasteful, and easy to decline.

## Play

Play online at [Mirage Casino on GitHub Pages](https://sergeyifo-wq.github.io/mirage-casino/).

```bash
npm install
npm run dev
```

Open the local URL Next prints (the project is happiest on an uncommon port, for example `npm run dev -- -p 47231`).

Your progress is saved in this browser under `midnight-mirage-v1`. The suite can export or import that save as JSON.

## GitHub Pages

The Pages workflow checks pull requests and publishes the static website when changes reach `main`. GitHub Pages uses **GitHub Actions** as its publishing source.

To build the same static website locally (PowerShell):

```powershell
$env:GITHUB_PAGES = "true"
$env:NEXT_PUBLIC_BASE_PATH = "/mirage-casino"
npm run build
```

The website is exported to `out/`. Public image paths, scripts, styles, and fonts include the repository prefix. Normal development and Vercel builds use the domain root when these variables are unset.

Saves are stored per website in your browser. To bring progress from the Vercel or local game, export the save in your suite and import it on GitHub Pages.

## The night

- **Floor map** — blackjack, poker, roulette, slots, baccarat, the bar, and your suite. Let the hour pass from early evening to after hours. Who is seated changes.
- **Tables** — real rules, bet controls, practice mode, and a short tutorial the first time you sit down.
- **Mirage Reels** — illustrated symbols, staggered reel stops, five selectable payline previews, and a paytable that shows chip payouts at your chosen stake. One stake covers all five lines. Accepted spins are saved and settle once even if you leave or reload. After hours is practice only.
- **People** — hosts and regulars have their own voices. Reply between hands, or sit at the bar for a longer talk. They remember the tone you use.
- **Invitations** — chemistry, conversation, and time of night. A full rack does not open a door.
- **Suite** — nightly allowance of 500 chips, table themes, off-duty portraits, and the relationship journal.

Jazz is synthesized in the browser. No account and no remote API.

## Rules check

```bash
npm run test:rules
```
