# Halo Moment series tags — Design

## Goal

Let a signed-in member associate a new Halo Moment with zero or more existing series. Tags must use the existing `moment_series` many-to-many table; no schema migration is needed.

## User experience

- Add a `แท็กซีรี่ย์` / `Tag series` control to `MomentComposer`.
- Opening it reveals a compact picker with a search field and matching series.
- Selecting a result adds a removable chip. Selecting the same series again does nothing.
- Members can choose any number of series, remove individual chips, or clear all selections.
- The picker is disabled while the Moment is publishing. Tags are optional and do not affect the existing body, link, and media flows.
- Series names follow the current page language when a localized title exists, with the other title as fallback.

## Data flow

1. The Halo feed page server load provides all non-deleted series as `{ id, label }` picker options, ordered by localized display label.
2. `MomentComposer` receives those options as a prop and owns the selected ID list.
3. On publish, the client sends `seriesIds` together with the existing create request.
4. The existing request service and mutation pass validated IDs into the existing transactional `moment_series` inserts.
5. The current feed serializer already resolves `moment_series` into display tags, so newly created Moments show their series tags after `invalidateAll()`.

## Validation and error handling

- Validate `seriesIds` as a bounded array of unique UUIDs.
- Reject unknown or soft-deleted series before creating the Moment; never create a partial association set.
- Existing authorization and publish error UI remain unchanged. An invalid request receives the existing invalid-Moment response.
- Database foreign keys remain the final integrity guard.

## Scope

Included: composer picker, page-load options, create-request validation, server-side series validation.

Excluded: schema changes, tags for artists/ships, editing legacy Moments beyond the existing generic update path, tag filtering UI changes, admin workflows.

## Verification

- Run the project type check after implementation.
- Manually verify: select several series, remove and clear selections, publish, then confirm the Moment shows every selected tag and filter results include it.
