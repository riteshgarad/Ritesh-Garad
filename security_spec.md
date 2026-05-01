# Security Specification - Garad Foundation OS

## 1. Data Invariants
- A **Task** must belong to a valid Department and have a descriptive title.
- A **Mission/Project** cannot be created without a valid Lead Name and Department.
- **Financial Transactions** must have an amount > 0 and be linked to a Category/Department.
- **Schedule Events** must have a `start` and `end` timestamp and be assigned a visibility type (`global`, `mission`, `departmental`).
- **User Profiles** are immutable in their sensitive fields (`role`, `uid`) except by Admins.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

| ID | Collection | Action | Payload | Expected | Reason |
|:---|:---|:---|:---|:---|:---|
| P1 | `users` | update | `{ role: "Admin" }` | DENY | Privilege Escalation (Self-assigning role) |
| P2 | `schedule` | create | `{ type: "global", title: "Evil", start: "2026-01-01", end: "2026-01-01" }` (by Volunteer) | DENY | Volunteers cannot create global events (only admins/heads) |
| P3 | `finance` | read | `list collection` (by Volunteer) | DENY | Volunteers cannot access the private ledger |
| P4 | `projects` | update | `{ status: "approved" }` (by Creator) | DENY | Creator cannot approve their own mission pulse |
| P5 | `tasks` | update | `{ title: "Changed" }` (by Assigned Volunteer) | DENY | Volunteers can only update status/completedAt, not meta fields |
| P6 | `messages` | create | `{ senderId: "someone_else", text: "Spoofed" }` | DENY | Identity Spoofing (SenderID must match AuthUID) |
| P7 | `schedule` | delete | `any doc` (by Dept Head) | DENY | Only Admins can delete mission pulses |
| P8 | `transactions` | create | `{ amount: -100 }` | DENY | Integrity (Negative amounts not allowed) |
| P9 | `expense_requests` | create | `{ requesterId: "someone_else" }` | DENY | Identity Integrity on application |
| P10 | `users` | create | `{ role: "Admin", email: "evil@hacker.com" }` | DENY | Unauthorized Admin provisioning |
| P11 | `schedule` | update | `{ dept: "Finance" }` (on an "HR" event) | DENY | Action-based update guard (Cannot move departments) |
| P12 | `documents` | delete | `doc owned by Admin` (by Volunteer) | DENY | Resource Poisoning/Orphaned removal |

## 3. Red Team Conflict Report

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|:---|:---|:---|:---|
| `users` | PASS (Owner check) | PASS (Admin only role) | PASS (Key count check) |
| `projects` | PASS (Creator check) | PASS (Status check) | PASS (Size limits) |
| `finance` | PASS (Role check) | PASS (Admin only) | PASS (Size limits) |
| `schedule` | PASS (Creator/Admin) | PASS (Locking) | PASS (isValidId check) |
| `messages` | PASS (SenderID check) | N/A | PASS (3000 char limit) |
