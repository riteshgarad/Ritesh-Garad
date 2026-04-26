# Security Specification - Garad Foundation NGO OS

## Data Invariants
1. A **User Profile** (`users/{uid}`) is mandatory for all system interactions.
2. Only users with the `Admin` role can create/update user profiles or assign roles/departments.
3. **Projects** require a valid `Lead` and a `Department` assignment.
4. **Finance Documents** (Transactions/Requests) can only be viewed/managed by `Admin` or the `Finance` department head.
5. **Social Media Content** is derived from `Documentation` artifacts and can only be managed by the `Social Media` team.
6. **Tasks** belong to a `Project` and are assigned to a `Volunteer`.
7. **Volunteers** cannot modify their own `impactPoints` or `badges`.

## The Dirty Dozen Payloads (Rejection Targets)

1. **Identity Theft**: Attempt to create a user profile with `role: 'Admin'` as a non-admin.
2. **Shadow Update**: Attempt to update a project status to 'Approved' as a non-admin.
3. **PII Leak**: Attempt to read the `users` collection lists as a regular volunteer.
4. **Budget Inflation**: Attempt to create a budget request for a project the user doesn't belong to.
5. **Relational Bypass**: Creating a Task for a non-existent Project.
6. **Identity Spoofing**: Submitting a work log for another volunteer's ID.
7. **Verification Fraud**: Manually setting a document status to 'Verified' as the uploader.
8. **Point Injection**: Updating own user document to increase `impactPoints`.
9. **Orphaned Donation**: Creating a donation record without a valid donor ID.
10. **State Shortcut**: Transitioning a project from `Draft` directly to `Active` without `Admin` approval.
11. **Shadow Key**: Adding a hidden `isSuperAdmin: true` field to a user profile update.
12. **Denial of Wallet**: Sending a 1MB string as a document ID or a description field.

## Rule Pillars Application
- **Master Gate**: All sub-resources (Tasks/Milestones) check parent Project ownership/membership.
- **Validation Blueprints**: `isValidUser`, `isValidProject`, `isValidTask` helpers enforcing strict keys and types.
- **Action-Based Updates**: Updating project status is a separate action from updating description.
- **Atomicity**: Using `exists()` to verify relational consistency.
