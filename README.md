# Applyfolio

**An application-tracking workspace designed to make the job search easier to manage.**

[Visit Applyfolio](https://applyfolio.online/) · [Read the product case study](https://applyfolio.online/case-study/) · [Explore the analytics dashboard](https://applyfolio.online/analytics/)

Applyfolio brings saved roles, application progress, recruiter contacts, deadlines, and next actions into one place. It was designed around a recurring job-search problem: information and follow-ups get scattered across job boards, notes, spreadsheets, and inboxes.

## Product experience

- **Overview:** Interactive breakdowns by city and role type, with shortcuts into matching applications.
- **Application folders:** Saved Jobs, In the Works, Interviewing, and Applied, plus a Projects & Portfolio area.
- **Job details:** Track application status, role links, contacts, timeline events, notes, priority, next actions, and compensation.
- **Deadlines and tasks:** Surface upcoming requirements and keep follow-ups attached to the relevant application.
- **Customizable workspace:** Personalize folder colors and organize opportunities without maintaining a separate spreadsheet.
- **Additional tools:** Quick links, offer comparison, and an analytics dashboard to evaluate product engagement and workflows.

## Product approach

The interface prioritizes quick status recognition and the ability to move from a high-level overview to the next concrete action. The case study documents the design decisions and iterations behind the workspace.

The analytics dashboard illustrates a measurement framework for acquisition, engagement, retention, and conversion. Example or preliminary metrics should not be interpreted as independently verified user outcomes.

## Implementation

The site is built with HTML, CSS, and vanilla JavaScript. It uses Supabase for supported account and application-data synchronization, with browser-local fallback where available.

Some settings, including folder color preferences and Projects & Portfolio entries, are stored only in the current browser and are not synchronized across devices. The app should not be treated as a system of record for information that has not been backed up.

## Repository structure

| Path | Purpose |
| --- | --- |
| `index.html` | Main application layout and dialogs |
| `styles.css` | Interface styles and responsive behavior |
| `app.js` | Application state, interactions, and synchronization |
| `analytics/` | Product analytics dashboard |
| `case-study/index.html` | Product case study |
| `CNAME` | Custom-domain configuration |
| `.nojekyll` | GitHub Pages hosting configuration |

The project has no package installation or build step. To run the static frontend locally, serve the repository root with `python3 -m http.server 8000`. Connected-account functionality depends on the configured backend.

---

*Independent product project. Features and data availability can vary between signed-in and browser-local experiences.*
