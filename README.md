# Job Search Command Center

A student-first recruiting dashboard for saving, organizing, and acting on jobs found across LinkedIn, Handshake, company career pages, referrals, and other sources.

## Product idea

The product starts after a user finds a job. It is designed to answer one question every time they open it:

**What should I do next?**

The current prototype includes:

- Clickable dashboard metrics for Saved, Applied, Interviewing, and Needs Attention
- Deadline, follow-up, and stale-job alerts
- City and industry breakdowns that update as jobs are added
- A centralized All Jobs view with filters
- Dedicated job detail pages with contacts, timeline, compensation, and next action
- Quick-access links back to recruiting tools and resume files
- An offer comparison concept for translating compensation into real-life take-home and fixed-cost tradeoffs
- Browser-local persistence for jobs added in the prototype

## Current build

The prototype is intentionally lightweight and dependency-free:

- `index.html` — product structure
- `styles.css` — visual system
- `app.js` — interactions and browser-local state

This makes the early product easy to test and iterate before adding accounts, a backend, or browser-extension infrastructure.

## Product direction

The near-term focus is:

**Save → Prioritize → Apply → Network → Interview → Compare**

The first user-testing goal is to understand whether students find the dashboard useful enough to replace spreadsheets, scattered bookmarks, and manual notes during recruiting.

## Build status

V2 visual prototype has been migrated to GitHub. The next passes will focus on turning remaining placeholder actions into full interactions, refining the copy and brand, and preparing the product for real student testing.
