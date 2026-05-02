# SolTrace — Goals, Milestones & Primary KPI
**Agentic Engineering Grant | Superteam | Deadline: May 9, 2026**

---

## Goals and Milestones

### Milestone 1 — Public Vercel deploy live
**Target: May 2, 2026 (Day 3)**

The web app is live at a public URL and works end-to-end with no local setup.

Acceptance criteria:
- [ ] Paste Raydium AMM v4 demo sig → account diffs render + AI risk summary streams
- [ ] Paste Jupiter v6 demo sig → account diffs render + AI risk summary streams
- [ ] PnL simulation slider at 0.5x and 2x returns correct x\*y=k output
- [ ] Rate limiting headers present on all API responses
- [ ] Turso cache active — second fetch of same sig returns in <50ms
- [ ] Recent analyses feed visible on home page

Verifiable: Public URL anyone can open and use immediately.

---

### Milestone 2 — Chrome extension submitted + `/copilot` fallback live
**Target: May 5, 2026 (Day 6)**

Pre-signing interception is accessible to users with or without the extension.

Acceptance criteria:
- [ ] Extension packaged via `npm run extension:package` and verified locally on Chrome
- [ ] Chrome Web Store developer account created and extension submitted for review
- [ ] `/copilot` route live at public URL — accepts base64 unsigned tx, shows risk badge + diffs
- [ ] Privacy policy live at `/privacy` (Web Store requirement)

Verifiable: Submission confirmation screenshot + `/copilot` URL working publicly.

Note: Chrome review takes 3–7 days so approval may land after May 9, but submission and the `/copilot` fallback are fully functional on deadline day.

---

### Milestone 3 — Demo video + public launch tweet
**Target: May 8, 2026 (Day 9)**

The tool is announced publicly with a reproducible demo anyone can replicate.

Acceptance criteria:
- [ ] 2-minute screen recording: paste Raydium sig → diffs load → drag slider → PnL flips red to green
- [ ] Tweet/thread published with video + public URL + both demo sig links
- [ ] At least 3 people outside the builder have used it (tracked via Turso `txcache` entries beyond the two known demo sigs)

Verifiable: Tweet link + video link + Turso count screenshot.

---

### Stretch goal — CLMM simulation (if time permits before May 9)

Orca Whirlpool and Raydium CLMM PnL slider. Currently shows "simulation unavailable" — large effort, deprioritized given the 10-day window. Will be the first post-grant improvement if not completed by deadline.

---

## Primary KPI

**50 unique transaction signatures analyzed by May 9, 2026.**

### Why this metric

Every analyzed sig is written to Turso `txcache`. Directly countable:

```sql
SELECT COUNT(DISTINCT sig) FROM txcache;
```

It proves real users are using the tool — not just the two pre-verified demo sigs. Hitting 50 within 10 days of a cold launch (no existing audience) requires the tool to be live, functional, and at least minimally distributed.

### Why 50 (not 250)

The deadline is May 9 — there is no 30-day post-launch window. With a public deploy on May 2 and a launch tweet on May 8, that's roughly 7 days of live traffic. 50 unique analyses in 7 days = ~7/day, achievable with a single tweet to the Solana DeFi community given the two zero-friction demo transaction links.

| Scenario | Daily analyses | 10-day total |
|----------|---------------|-------------|
| Conservative (tweet only) | 3–5 | ~35 |
| **Target** | **7–8** | **50** |
| Upside (RT or community pickup) | 15+ | 100+ |

### Stretch KPI

1 transaction where the Chrome extension surfaced a `riskScore >= 70` before a user signed — proving the pre-signing interception path works in a real wallet session.
