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
- **House deck & design** — crisp vector suits, traditional pip arrangements, mirrored court illustrations, ivory card stock, and a custom burgundy-and-gold card back. The portrait-led floor, gilt header, textured felt and framed seats share one house style, with responsive layouts and reduced-motion support.
- **Chip betting** — striped house chips, visible stacks on the felt, tap/drag placement, and undo/clear controls. Blackjack, baccarat and poker buy-ins use a chip tray; slots use chip stakes.
- **European roulette** — a lit 3D walnut-and-brass wheel with 37 numbered pockets, raised separators, a counter-rotating ball, and table/overhead views. The ball settles in the pocket that pays the saved spin. Undo, rebet, recent results, and a full payout receipt keep the layout clear; accepted spins finish across navigation or reload. A classic wheel is available when 3D rendering is unavailable.
- **Mirage Reels** — illustrated symbols, staggered reel stops, five selectable payline previews, and a paytable that shows chip payouts at your chosen stake. One stake covers all five lines. Accepted spins are saved and settle once even if you leave or reload. After hours is practice only.
- **People** — hosts and regulars have their own voices. Reply between hands, or sit at the bar for a longer talk. They remember the tone you use.
- **Invitations** — chemistry, conversation, and time of night. A full rack does not open a door.
- **Suite** — nightly allowance of 500 chips, table themes, off-duty portraits, and the relationship journal.

Jazz is synthesized in the browser. No account and no remote API.

Live blackjack hands must finish before leaving. Poker stacks must be cashed out or folded out through the table controls so ordinary navigation cannot discard chips. Interactive card hands are not saved mid-hand; finish or cash out before reloading the browser.

## Rules check

```bash
npm run test:rules
```
