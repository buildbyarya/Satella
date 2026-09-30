# Watch Chat Calendar Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans (task-by-task). Steps use checkbox syntax.

**Goal:** Add the approved Watch Together, Chat, playlist, notification, and Calendar background polish without breaking existing Satella behavior.

**Architecture:** Reuse the existing WatchRoom, LibraryVideo, Playlist, ChatRead, ChatSetting, and CalendarEvent models. Add route-aware client components through AppShell for UI that is safer to isolate from the large Watch Together page, and extend existing APIs for playlist saves, notification derivation, seen timestamps, and independent calendar background storage.

**Tech Stack:** Next.js 16, React 19, Prisma 6, PostgreSQL/Neon, Tailwind CSS.

**Spec:** User-approved requirements from 2026-09-30.

## Global Constraints
- Watch chat auto-scrolls only when already near bottom; otherwise show a down/unread control.
- Current video supports Like, Watch Later, Personal Playlist, Common Playlist.
- Personal/Common are fixed collections for now; Liked/Watch Later remain system collections.
- Partner-left chat toast lasts 8–10 seconds maximum and does not navigate; notification-panel item opens Chat.
- Seen status shows time without seconds.
- Chat and Calendar backgrounds are independent shared settings.
- Calendar supports presets and uploaded backgrounds.
- Use one consolidated deployment and repair build failures before declaring success.

### Task 1: Playlist API
- Create `app/api/youtube/playlists/route.ts` with GET fixed Personal/Common playlists and POST idempotent add-video.
- Modify Watch Together sources to expose the fixed playlists.

### Task 2: Watch Together UI
- Create `components/watch/WatchTogetherEnhancements.tsx` and mount it only on Watch Together through AppShell.
- Add Like, Watch Later, Personal/Common playlist chooser.
- Observe existing chat and provide near-bottom auto-scroll plus down/unread control.

### Task 3: Partner-left notifications
- Extend `/api/notifications` to derive recent Chat-after-leave events.
- Extend NotificationsBell with an 8–10 second non-navigating toast and a notification-panel action that opens Chat.

### Task 4: Chat
- Return `seenAt` from `/api/chat` based on partner ChatRead timestamp.
- Display `Seen HH:MM` and keep wallpaper fixed while messages scroll.

### Task 5: Calendar background
- Extend `/api/calendar` with independent shared background storage using backward-compatible existing settings storage.
- Create `CalendarBackground` with presets/upload and mount it on Calendar only.

### Task 6: Verification
- Deploy once after the consolidated changes, inspect Vercel build logs, fix any build failure, and redeploy only if required. Verify READY before reporting completion.
