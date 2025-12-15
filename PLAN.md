# TypeScript Migration Plan

## Overview

**Total files to migrate:** ~357  
**Strategy:** Layer-by-layer
**Typing approach:** Strict from the start  
**Networking module:** Deferred to separate phase

### Commit Strategy

- Commit after each phase is completed
- Run `npm run check` at phase checkpoints
- Use commit message format: `refactor: migrate [scope] to TypeScript`

---

## Phase 1: Foundation Types & Utilities ✅

| Task                                          | Files | Status |
| --------------------------------------------- | ----- | ------ |
| **1.1** Create `src/types/router.ts`          | 1 new | ✅     |
| **1.2** Migrate `src/shared/utils/`           | 4     | ✅     |
| **1.3** Migrate remaining `src/shared/hooks/` | 7     | ✅     |

---

## Phase 2: Feature API Modules ✅

| Task                              | Files | Status |
| --------------------------------- | ----- | ------ |
| **2.1** `invitations/api.js`      | 1     | ✅     |
| **2.2** `uploads/api.js`          | 1     | ✅     |
| **2.3** `moderation/api.js`       | 1     | ✅     |
| **2.4** `eventInvitations/api.js` | 1     | ✅     |
| **2.5** `sponsors/api.js`         | 1     | ✅     |
| **2.6** `sessions/api.js`         | 1     | ✅     |
| **2.7** `events/api.js`           | 1     | ✅     |

---

## Phase 3: Shared Component Schemas ✅

| Task                               | Files | Status |
| ---------------------------------- | ----- | ------ |
| **3.1** Auth modal schemas         | 3     | ✅     |
| **3.2** Event modal schema         | 1     | ✅     |
| **3.3** Organization modal schemas | 2     | ✅     |
| **3.4** Profile modal schema       | 1     | ✅     |
| **3.5** Session modal schemas      | 3     | ✅     |

---

## Phase 4: Shared Components ✅

| Task                                                                                  | Files | Status |
| ------------------------------------------------------------------------------------- | ----- | ------ |
| **4.1** Index/barrel exports                                                          | 5     | ✅     |
| **4.2** UI primitives (`Button`, `LoadingState`, `ErrorBoundary`, `Analytics`)        | 4     | ✅     |
| **4.3** Forms (`TimeSelect`)                                                          | 1     | ✅     |
| **4.4** Constants (`speakerRoles`, `timezones`, `usStates`)                           | 3     | ✅     |
| **4.5** Standalone cards (`PersonCard`, `SpeakerCard`, `SponsorCard`, `PrivateImage`) | 4     | ✅     |
| **4.6** Auth modals (Login, Signup, ForgotPassword)                                   | 3     | ✅     |
| **4.7** Entity modals (Event, Organization, Profile, Session)                         | 6     | ✅     |
| **4.8** Other modals (`ConfirmationModal`, `IcebreakerModal`, `PageHeader`)           | 3     | ✅     |
| **4.9** Chat components (shared + Networking/ChatArea + Session/SessionChat)          | 26    | ✅     |

**Checkpoint:** `npm run check` ✅

---

## Phase 5: Page Schemas & Utilities

| Task                                            | Files |
| ----------------------------------------------- | ----- |
| **5.1** Auth schemas (`resetPasswordSchema.js`) | 1     |
| **5.2** EventAdmin schemas                      | 6     |
| **5.3** Other page schemas                      | 6     |
| **5.4** Page utilities/hooks                    | 8     |

**EventAdmin schemas:**

- `AttendeesManager/schemas/attendeeSchemas.js`
- `EventSettings/schemas/eventSettingsSchemas.js`
- `NetworkingManager/schemas/chatRoomSchema.js`
- `SessionManager/schemas/sessionCardSchema.js`
- `SpeakersManager/schemas/speakerSchemas.js`
- `SponsorsManager/schemas/sponsorSchema.js`

**Checkpoint:** `npm run check`

---

## Phase 6: Router & Entry Point

| Task                                                                   | Files |
| ---------------------------------------------------------------------- | ----- |
| **6.1** `main.jsx` → `main.tsx`                                        | 1     |
| **6.2** Route guards (`AuthGuard`, `PublicGuard`)                      | 2     |
| **6.3** Layouts (`AppLayout`, `RootLayout`)                            | 2     |
| **6.4** Route definitions (`index`, `protectedRoutes`, `publicRoutes`) | 3     |

**Checkpoint:** `npm run check`

---

## Phase 7: Pages

Ordered from smallest to largest for incremental progress.

| Task                                     | Files |
| ---------------------------------------- | ----- |
| **7.1** `Errors/`                        | 2     |
| **7.2** `Roadmap/`                       | 1     |
| **7.3** `Speakers/`                      | 2     |
| **7.4** `Sponsors/`                      | 2     |
| **7.5** `NewUserLanding/`                | 3     |
| **7.6** `Network/`                       | 4     |
| **7.7** `Profile/`                       | 7     |
| **7.8** `Settings/`                      | 9     |
| **7.9** `Invitations/`                   | 8     |
| **7.10** `Auth/`                         | 8     |
| **7.11** `Dashboard/`                    | 10    |
| **7.12** `Agenda/`                       | 6     |
| **7.13** `Session/`                      | 18    |
| **7.14** `Events/`                       | 11    |
| **7.15** `Networking/`                   | 10    |
| **7.16** `Organizations/`                | 19    |
| **7.17** `Landing/`                      | 31    |
| **7.18** `Landing_backup_v2/`            | 16    |
| **7.19** `EventAdmin/AttendeesManager/`  | 9     |
| **7.20** `EventAdmin/EventSettings/`     | 10    |
| **7.21** `EventAdmin/NetworkingManager/` | 10    |
| **7.22** `EventAdmin/SessionManager/`    | 8     |
| **7.23** `EventAdmin/SpeakersManager/`   | 8     |
| **7.24** `EventAdmin/SponsorsManager/`   | 18    |
| **7.25** `Navigation/`                   | 10    |

**Checkpoint:** `npm run check` after each commit

---

## Phase 8: Networking Module (Deferred)

Complex Socket.IO integration - migrated separately.

| Task                                              | Files | Lines |
| ------------------------------------------------- | ----- | ----- |
| **8.1** Define socket event types                 | 1 new | -     |
| **8.2** `networking/api.js`                       | 1     | ~445  |
| **8.3** `networking/socketClient.js`              | 1     | ~1424 |
| **8.4** Evaluate/remove `TBD - api-simplified.js` | 1     | ~327  |

**Checkpoint:** `npm run check`

---

## Phase 9: Final Cleanup & Enforcement

| Task                                         | Action         |
| -------------------------------------------- | -------------- |
| **9.1** Audit/fix remaining `any` types      | Search & fix   |
| **9.2** Remove `@ts-expect-error` directives | Search & fix   |
| **9.3** Remove `jsconfig.json`               | Delete file    |
| **9.4** Set `allowJs: false` in tsconfig     | Config change  |
| **9.5** Add type coverage CI check           | GitHub Actions |

**Final Checkpoint:** `npm run check` + `npm run build`

---

## Summary

| Phase     | Description                  | Files    |
| --------- | ---------------------------- | -------- |
| 1 ✅      | Foundation Types & Utilities | 12       |
| 2 ✅      | Feature API Modules          | 7        |
| 3 ✅      | Shared Component Schemas     | 10       |
| 4 ✅      | Shared Components            | 55       |
| 5         | Page Schemas & Utilities     | 21       |
| 6         | Router & Entry Point         | 8        |
| 7         | Pages                        | 249      |
| 8         | Networking Module            | 4        |
| 9         | Final Cleanup                | -        |
| **Total** |                              | **~357** |

---

## Already Completed

- [x] Infrastructure & Tooling (tsconfig, vite, eslint)
- [x] Core domain types (`src/types/` - 12 files)
- [x] `lib/axios.ts`
- [x] Redux store configuration
- [x] Redux slices
- [x] RTK Query base (`api/baseQuery.ts`, `api/index.ts`)
- [x] Feature APIs: `auth`, `chat`, `organizations`, `users`
- [x] Shared hooks: `useChatScroll`, `useThreadFiltering`, `useGradientBadge`, `useIsMobile`, `index.ts`
- [x] Storybook config (`.storybook/main.ts`, `.storybook/preview.ts`)
- [x] Phase 1: Foundation Types & Utilities
- [x] Phase 2: Feature API Modules
- [x] Phase 3: Shared Component Schemas
- [x] Phase 4.1-4.3: Index exports, UI primitives, Forms

---

## Type Schema Mismatch Prevention

**IMPORTANT**: When defining TypeScript types for API responses, always verify the backend schema returns the same structure. Several type mismatches were discovered and fixed during this migration.

### Pattern 1: Flat vs Nested Objects
- **Backend**: Uses Marshmallow `Method` fields or `dump_only` computed properties to flatten nested relationships
- **TypeScript**: Must match the flat structure, not the database model
- **Example**: `SessionSpeaker` has flat `speaker_name`, `image_url`, etc. fields, not a nested `user: {...}` object

### Pattern 2: Pagination Structure
- **Backend**: `paginate()` in `commons/pagination.py` returns flat keys at root level:
  - `total_items`, `total_pages`, `current_page`, `per_page`
  - Link fields: `self`, `first`, `last`, `next`, `prev`
  - Collection: matched by `collection_name` parameter
- **TypeScript**: Do NOT nest pagination fields - keep them flat at root
- **Fixed**: `PaginatedResponse<T>` interface updated

### Pattern 3: Dynamic/Meta Fields from Services
- Fields added dynamically by services (not in database models):
  - Connection status fields from networking service (added to EventUser)
  - Privacy-filtered computed fields (speaker_name, image_url, etc.)
  - Event context fields for DMs (shared_event_ids, other_user_in_event, is_new)
- **Check**: backend services that add transient attributes before schema serialization

### Verification Process for Future Types
1. Check backend schema file (e.g., `backend/atria/api/schemas/session_speaker.py`)
2. Verify Marshmallow fields - flat vs nested using `Method` or `dump_only`
3. Check service layer for computed/dynamic fields
4. Confirm pagination structure in `commons/pagination.py`
5. Test with actual API responses or consult API documentation
6. Check existing frontend code for actual field usage patterns

### Fixed Type Mismatches
- **frontend/src/types/api.ts** - Pagination structure (flat keys, link fields)
- **frontend/src/types/events.ts** - SessionSpeaker (flat name/image/title fields), EventUser (connection fields)
- **frontend/src/types/networking.ts** - DirectMessageThread (event context fields)
- **frontend/src/app/features/invitations/api.ts** - Invitation response types
- **frontend/src/shared/hooks/useSocketMessages.ts** - Redux state typing
- **frontend/src/shared/utils/moderation.ts** - Mutation function types
