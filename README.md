# ReLoom

A mobile-first sustainable fashion community connecting donors, makers and each garment’s story.

Live site: https://reloom-mobile.z1oey12.chatgpt.site/

## Current experience

- **Mei / Donate:** conversational donation with one photo, essential garment details, an optional memory and Public / Only me visibility.
- **Explore:** designer booths, newly donated garments and upcycled pieces, with independent searches/filters, arrow navigation and swipe transitions.
- **My tags:** optional colour and emoji customisation linked to a garment the visitor has participated in. Designs are saved on the server. Physical NFC programming is not implemented.
- **Stories:** participated-in or followed garments, before/after timelines, invitations, photo/text chat and per-visitor unread badges. My includes the featured hoodie example without granting tag eligibility. Swipe left on story cards for Mark unread (red) and Mark read (blue).
- **Claim:** opens an editable request in the garment’s chat. It does not reserve a garment or transfer ownership.

## Architecture

Vinext, React and TypeScript run on the Sites Workers runtime. D1 persists donation records, profiles, tag designs, invitations, messages and read cursors. R2 stores uploaded photos. Deployment bindings are declared in `.openai/hosting.json`; SQL migrations live in `drizzle/`.

UI and domain modules are in `features/reloom/`, API handlers in `app/api/`, and shared server functions in `server/`.

- `swipe-events.js` and `use-swipe-events.js` share native touch handling between story cards and Explore. Non-passive move/end listeners prevent iOS compatibility clicks after swiping. Vertical scrolling, keyboard controls and ordinary taps remain available.
- `chat-timeline.js` serializes polling, writes, read receipts and history paging. It fills missing pages before publishing a refresh, preserves the last complete snapshot on failure, and ignores responses after unmounting.
- `server/chat-summary.ts` supplies room-wide counts and latest messages separately from personal posts. Other people’s messages never create participation, rewards or tag permissions for the viewer. Private legacy notes stay private.

## Local development and checks

Use Node.js 22.13 or later and install the locked dependencies with `pnpm install --frozen-lockfile`. Start the local preview with `pnpm dev`.

```sh
node scripts/test.mjs
node node_modules/typescript/bin/tsc --noEmit
RELOOM_TEST_URL=http://localhost:3000 node --test tests/storage.integration.mjs
```

The integration suite refuses non-local URLs and creates isolated local visitor records. It checks cross-visitor messages, photo access, private donations, invitations, ownership, unread cursors and room summaries. Do not run mutation tests against production.

If the local database needs migrations, build first and apply each pending SQL file once using:

```sh
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file <migration.sql>
```

Keep applied migrations immutable. Sites handles production migration deployment separately. Generated builds, local data, credentials and test output are ignored by Git.

## Identity, privacy and prototype limits

Identity is an unguessable HttpOnly visitor cookie, not a password-protected account. Renaming a profile does not sign into another visitor’s records. Different devices or browser profiles have separate identities. Only me donations and their photos/chat require the owning visitor cookie. Public donations are shared in Explore without granting others ownership.

Chats poll every 2.5 seconds while visible. Read receipts acknowledge the displayed cursor; messages arriving later remain unread. Seeded introductory messages have their own read state; private legacy notes do not add unread badges. Basic rate limiting is present; staffed moderation is not.

Photos are resized and re-encoded before upload. Optional server-only `OPENAI_API_KEY` and `OPENAI_VISION_MODEL` enable image suggestions (default model: `gpt-4.1-mini`). Without a configured key or when recognition fails, the interface uses editable manual details. Do not commit secrets or claim AI recognition has been verified without a configured successful call.

Catalogue imagery and garment transformations labelled as concepts or illustrations are prototype artwork. The hoodie-to-tote image is an AI-generated concept, not proof of a completed physical transformation. Sample drop-off locations, impact figures and purchase controls do not represent verified services, environmental measurements or real payments.

Automated touch-event tests and desktop browser dragging do not replace testing on a physical iPhone in Safari.
