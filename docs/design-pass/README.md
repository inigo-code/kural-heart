# Design pass, 28 November 2026

A pass over the main screens against the Olai look (paper by day, Midnight by night, one clay accent, heart red for
hearts, gold as material, couplets flush left). Nothing new in the palette, no new Tamil ornament.

`before/` and `after/` are screenshots from a web preview of the app (react-native-web at 412 x 900, seeded with six
sample pages), not from a phone. Screens with no change have no after shot.

## What changed

| Screen | Question asked | Change |
|---|---|---|
| Today | Does the eye reach the question and Write before the ways elsewhere? | "Choose a couplet" and "How is your heart?" moved from between the couplet's actions and the question card to under it. The order is now couplet, its actions, today's question with the one filled button, then the links, then the thread. |
| Today, Write | Is Mind / Speech / Action one control in both places? | One `LensChips` in `common.tsx`. On Write the chosen lens was a filled clay chip that competed with Save; it is now the same soft chip as on Today. 40dp tall with 4dp slop (48dp touch); was 36dp on Today. |
| Write | Can the photo's remove button be hit? | 28dp button gets 10dp slop (48dp touch) and the button role. |
| Journey | Does the thread card say each thing once? | The big number was followed by "5 days on your thread", the number again. Now "5" then "days on your thread" (English and Tamil), read aloud as one line. Days not written are open rings, not grey dots that sank into the card at night. |
| Leaf (Today, Kural, Write) | Does the pronunciation line pass AA where the leaf darkens at its foot? | `leafNote` #6A4B22 measured 4.36 to 1 day and 3.62 night at the foot. Now #563B17 (5.2 or better) and #4A3212 on Midnight's dimmed leaf (5.0 or better). |
| Settings, Backup, Feeling, Write dialogs | Does red text pass AA? | Heart red #D63B58 as text was 4.07 to 1 on ivory and 4.14 on Midnight. New `heartInk`: #B32E48 by day (4.6 or better on every surface), #EC6E86 by night (4.6 or better). The heart itself, icons, fills and borders keep #D63B58. |
| Settings | Can a switch that is off be seen? | Off outline from 45% to 60% of the muted ink: 2.45 to 3.05 to 1 by day, 2.63 to 3.31 at night. |

`olai.css` carries the same token changes (`--leafnote`, new `--heartink`). What's new 29 says it in a sentence and
keeps 28's lines, which have not shipped.

## Uizze references

Searched for Android first; every useful result was web or iOS, so they were comparisons only.

- Today hierarchy (quote, prompt, one action): [Ulysses](https://uizze.com/packs/3abf8027-bc1c-439d-a36f-a4111d548988),
  [Ugmonk](https://uizze.com/packs/db1a9358-3f1c-43c5-8e8f-5e035d588836) and
  [Superhuman](https://uizze.com/packs/6a62ccd8-20dc-4b88-aec9-d1cff81e7734) (web). Each keeps one primary action
  directly under the thing it acts on and puts navigation after it, which is the order Today now has.
- Primary action placement: [Spline](https://uizze.com/packs/abc069e3-3264-486f-8544-470507aece7c) and
  [302.sh](https://uizze.com/packs/09946078-da64-4896-907f-8ac1c006b1e6) (web). Marketing pages; no fit.
- Streak and badges: Praktika's streak screen (iOS, a store capture) shows a week as filled and open marks under a
  big count; the Journey week now uses open rings the same way. Its celebration styling is not ours. The other result
  (Google Flights) was unrelated.

## Not verified

- Nothing was run on a phone or emulator: no build was made for this pass. On the web preview the couplet is cut with
  "…" (web has no `adjustsFontSizeToFit`), the link pills don't stack when their labels wrap, and Skia redraws badly
  after a live theme switch; these are web-only and were the same before.
- Large font scale (200%) and Tamil interface not re-checked after the changes.
- Contrast figures are computed from the tokens with the WCAG formula, not measured on a screen.
