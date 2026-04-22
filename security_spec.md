# Security Specification for Garad Hub OS Firestore

## 1. Data Invariants
- A **Task** can be created by any signed-in user, but must be tied to a valid project (exists in `/projects`).
- A **Project** can be created by any signed-in user. Only the creator can modify project settings, although team members might be allowed in the future.
- **Volunteers** can only be managed (created/updated) by authenticated staff.
- **Notifications** are private; only the recipient (`userId` in path) can read or mark them as read.

## 2. The "Dirty Dozen" Payloads (Deny Test Cases)
1. **Identity Spoofing**: Attempt to create a project with `creator_id` not matching `request.auth.uid`.
2. **Project Injection**: Attempt to create a task for a non-existent `project_id`.
3. **Escalation**: Attempt to update a project's `creator_id` to another user.
4. **State Shortcutting**: Attempt to update a project status directly to 'completed' without being the owner.
5. **PII Breach**: Attempt to read another user's notifications.
6. **Value Poisoning**: Inject a 2MB string into a task `title`.
7. **Orphaned Write**: Create a task with an invalid project ID string.
8. **Malicious ID**: Create a document using a 2KB string as ID.
9. **Shadow Field**: Add `isVerified: true` to a Volunteer document update.
10. **Timestamp Fraud**: Provide a client-side timestamp for `created_at` instead of `request.time`.
11. **Massive Array**: (N/A for current schema, but guard against large lists).
12. **System Override**: Attempt to modify `hours` in a volunteer document unauthorized.

## 3. Test Runner (Draft)
A `firestore.rules.test.ts` would verify that for each collection:
- `get` / `list` is restricted to appropriate users.
- `create` / `update` triggers `isValid[Entity]` and `affectedKeys().hasOnly()`.
- `delete` is restricted.
