# Kural Heart

A private Android journal with Thiruvalluvar. Each day brings one couplet of the Thirukkural on its palm leaf and a
quiet question to write about. Free, with no account, no ads and no tracking.

Site and download: https://inigo-code.github.io/kural-heart-site/

## What it does

- A couplet a day from all 1,330, on a palm leaf, always flush left, with a pronunciation line (simple, or scholarly
  ISO 15919) for readers who don't read Tamil.
- Listen: every couplet recorded once in a natural Tamil voice that works offline; English read by the phone's voice.
- English by V. V. S. Aiyar (1916) and G. U. Pope (1886); with Tamil first, Mu. Varadarasanar's Tamil explanation.
- A journal: pages with feelings, photos, voice notes, short videos, place and weather, a calendar and a map.
- Journey and Insights: a writing thread with rest days, nine seals, and charts of your words, times and chapters.
- Share images of any couplet in seven looks; a Today widget; reminders at the Tamil times of day.
- Backups sealed with a passphrase, to a folder or to Google Drive's private app folder.

## Built with

Expo (SDK 58), React Native, Expo Router, Skia for Valluvar and the patterns, EAS builds and updates. Read
`PRODUCT.md` and `PLAN.md` before changing anything; `CLAUDE.md` lists the layout and the commands.

```bash
npm ci
npm run typecheck && npm run lint
```

## Sources

- The Tamil couplets: Project Madurai's e-text 0001, checked line by line against e-text 0017 and a third copy
  (`tools/content/build_pack.py`, report in `tools/content/report.md`).
- English: V. V. S. Aiyar (Standard Ebooks, public domain) and G. U. Pope (Project Madurai e-text 0153).
- Tamil explanation: Mu. Varadarasanar's Thirukkural Thelivurai (1969), nationalised by the Government of Tamil
  Nadu (CC0), from Tamil Wikisource.
- The recorded voice: Piper's "ta_IN rasa female" (huggingface.co/tinisoft), trained on AI4Bharat's Rasa dataset,
  CC BY 4.0.
- Fonts: Anek Tamil, Noto Serif Tamil and Literata, SIL Open Font License.
- Maps: © OpenStreetMap contributors.

## Contact

Inigo, inigo@tosstheworld.org. Part of [Heart Apps](https://inigo-code.github.io/).
