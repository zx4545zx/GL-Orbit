# Chatbot GL Scope and Related Sources Design

## Goal

Improve GL-Orbit AI chat so it can respond naturally to general conversation while staying oriented around GL/Girls' Love topics, and prevent the UI from showing a related-data button when there is no useful related data to display.

## Current behavior

- Chat messages are routed through SQL generation unless a deterministic shortcut handles them.
- Out-of-scope messages get a strict refusal reply.
- Assistant messages show a related-data button whenever a non-null context object exists.
- The context panel can open with no useful content when context IDs do not resolve to displayable series, artist, or schedule data.

## User-approved behavior

- The chatbot may handle broader casual conversation, but should try to connect the conversation back to GL or GL-Orbit.
- Greetings such as “สวัสดี” should receive a normal friendly answer.
- Non-GL general questions may receive a brief helpful response, followed by an invitation to ask about GL series, actors, schedules, episodes, or streaming links.
- Do not add new automated tests for this change. Verification will rely on type checking and manual behavior checks.

## Design

### 1. Conversation routing

Add a lightweight pre-SQL classifier in the chat API:

- **GL data question**: keep the existing deterministic SQL / LLM SQL / read-only DB / final answer flow.
- **Casual or general chat**: skip SQL and call the chat model directly with a system prompt that:
  - answers in the user’s language,
  - stays friendly and natural,
  - does not invent GL-Orbit database facts,
  - gently steers the conversation back to GL topics.

This avoids treating every greeting as a database query.

### 2. Related-data context

Keep `context: null` when there is no useful preview target. The UI should only show related-data controls when the context has a positive entity count.

For context extraction:

- Preserve existing context shapes: `series`, `artist`, `schedule`.
- Prefer `series_id` for schedule context when available.
- Avoid accidentally extracting unrelated IDs that cannot be resolved by `/api/chat/context`.

### 3. UI behavior

In `ChatApp.svelte`:

- Treat context with zero related items as empty.
- Hide the header context button and per-message “ดูข้อมูลที่เกี่ยวข้อง” button unless count is greater than zero.
- Keep the panel fallback message for defensive handling if an empty context still reaches the component.

### 4. Persistence

Store casual-chat exchanges in conversation history with `context: null`, so follow-up conversation remains natural but does not create a false related-data button.

## Error handling

- If the casual chat model call fails due to missing MiniMax config, reuse the existing AI setup error path.
- If it fails unexpectedly, return the existing generic chat error.
- Related-data fetch failures continue to show the existing retry state inside the panel.

## Verification

No new tests will be written per user request. Verify by running:

- `npm run check`

Manual checks:

1. Ask “สวัสดี” and confirm a friendly reply with no related-data button.
2. Ask a general question and confirm the answer gently steers back to GL.
3. Ask “ขอ link ตอนที่ 9 หน่อย” and confirm the related-data button appears only if the preview has usable data.
