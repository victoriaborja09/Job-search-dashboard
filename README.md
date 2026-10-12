# Applyfolio

A recruiting workspace for collecting job opportunities, organizing applications, tracking people and follow-ups, and preparing for interviews.

## Current interface

- **Overview:** live city and role-type donut charts; click any segment or legend item to explore matching jobs.
- **Folders:** Saved Jobs, In the Works (the existing `Applying` status), Interviewing, Applied, and Projects & Portfolio.
- **Folder view:** modal paper-folder interaction with real job cards and six opportunities per page.
- **Customize colors:** five built-in palette options for each folder, saved to this browser.
- **Upcoming deadlines / Tasks:** collapsed on the overview until opened. Task completion uses the existing timeline/next-action completion logic.
- **All Jobs:** filterable full list, retaining the existing job detail page and its contacts, recruiting prompts, timeline, notes, compensation, priority and other controls.
- **Resources:** the existing editable quick links, available from the sidebar.
- **Offer Compare:** existing offer comparison screen, unchanged.

## Data and limitations

Job records, timelines, contacts, quick links, and offers use the existing Supabase account sync and browser-local fallback. The overview and job folders read these same records; no migration or duplicate job dataset is created.

The **Projects & Portfolio** folder offers basic project records (title, description, optional URL) stored **locally on the current device** at this stage. Those project records and folder color selections are **not yet cloud-synced**. This is intentionally separate from the application's existing job state, until the server data model is extended.

## Repository structure

The application is intentionally dependency-free and kept in the existing files:

- `index.html` — screens and dialogs
- `styles.css` — visual styles and responsive rules
- `app.js` — interactions, persistence, and existing Supabase integration
- `case-study/index.html` — existing case-study page

No new build pipeline, duplicate prototype files, or libraries were added for the redesign.

## Next iterations

Refine the detailed job screen against the existing UI, then decide whether portfolio projects and folder preferences should be synced across devices.
