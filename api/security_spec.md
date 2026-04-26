# Security Specification - NGO System

## Data Invariants
1. **Immutable Identity**: `creator_id` and `ownerId` (if used) must never change after creation.
2. **Strict Status Workflow**: Projects must follow the status chain: `pending_dept_review` -> `pending_admin_review` -> `approved`.
3. **Atomic Linking**: Finance requests can only be created when a project is approved (enforced via `existsAfter`).
4. **Role Integrity**: Users cannot assign themselves roles or change their department in a way that bypasses DH/Admin review.
5. **PII Protection**: Notification content is private to the specific user.

## The Dirty Dozen Payloads (Target: `projects`)

1. **The ID Poisoning Attack**: Attempt to create a project with a 2KB string as `projectId`.
2. **The Status Jump**: Attempt to create a project with `status: "approved"` directly.
3. **The Identity Spoof**: Attempt to create a project with `creator_id: "other_user_id"`.
4. **The Ghost Field**: Attempt to create a project with an extra field `isVerified: true`.
5. **The Resource Exhaustion**: Send a 1MB string in the `description` field.
6. **The Orphan Write**: Create a project without a valid `department`.
7. **The Terminal Re-entry**: Attempt to update a `rejected` project's description.
8. **The Role Escalation**: Update project's `budget_status` as a non-Admin user.
9. **The Temporal Fraud**: Send a hardcoded date in `created_at` instead of `serverTimestamp()`.
10. **The Negative Progress**: Attempt to update a project with `progress: -10`.
11. **The Phase Warp**: Update `phase` from 1 directly to 5.
12. **The Unauthorized Deletion**: Attempt to delete a project not owned by the user (and user is not Admin).

## Test Runner (Logic Check)
The `firestore.rules.test.ts` (conceptual) verifies that:
- Any `create` without `request.auth.uid == incoming().creator_id` returns `PERMISSION_DENIED`.
- Any `create` with `status != 'pending_dept_review'` (unless Admin) returns `PERMISSION_DENIED`.
- Any `update` modifying `creator_id` returns `PERMISSION_DENIED`.
- Any `update` modifying `budget_status` without Admin role returns `PERMISSION_DENIED`.
