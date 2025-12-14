# TypeScript Migration Plan

## Overview

**Total files to migrate:** ~354  
**Strategy:** Layer-by-layer
**Typing approach:** Strict from the start  
**Networking module:** Deferred to separate phase

### Commit Strategy

- Commit after major changes for rollback safety
- Run `npm run check` at phase checkpoints
- Use commit message format: `feat: migrate [scope] to TypeScript`

---

## Phase 1: Foundation Types & Utilities

| Task                                          | Files | Commit After |
| --------------------------------------------- | ----- | ------------ |
| **1.1** Create `src/types/router.ts`          | 1 new | ✓            |
| **1.2** Migrate `src/shared/utils/`           | 4     | ✓            |
| **1.3** Migrate remaining `src/shared/hooks/` | 7     | ✓            |

**Files to migrate:**

- `shared/utils/timezone.js` → `.ts`
- `shared/utils/sorting.js` → `.ts`
- `shared/utils/formatting.js` → `.ts`
- `shared/utils/moderation.js` → `.ts`
- `shared/hooks/useMobileInputHandler.js` → `.ts`
- `shared/hooks/useRoomPresence.js` → `.ts`
- `shared/hooks/useOpenThread.js` → `.ts`
- `shared/hooks/useSocketMessages.js` → `.ts`
- `shared/hooks/useDMTyping.js` → `.ts`
- `shared/hooks/useEventStatusStyle.js` → `.ts`
- `shared/hooks/formatDate.js` → `.ts`

**Checkpoint:** `npm run check`

---

## Phase 2: Feature API Modules

| Task                              | Files | Lines | Commit After |
| --------------------------------- | ----- | ----- | ------------ |
| **2.1** `invitations/api.js`      | 1     | ~44   |              |
| **2.2** `uploads/api.js`          | 1     | ~64   |              |
| **2.3** `moderation/api.js`       | 1     | ~66   | ✓            |
| **2.4** `eventInvitations/api.js` | 1     | ~74   |              |
| **2.5** `sponsors/api.js`         | 1     | ~123  | ✓            |
| **2.6** `sessions/api.js`         | 1     | ~129  | ✓            |
| **2.7** `events/api.js`           | 1     | ~131  | ✓            |

**Migration pattern:** Follow `auth/api.ts` and `organizations/api.ts` examples:

- Add request/response type interfaces
- Type `builder.query<ResponseType, ParamsType>()`
- Type `builder.mutation<ResponseType, ParamsType>()`

**Checkpoint:** `npm run check`

---

## Phase 3: Shared Component Schemas

| Task                               | Files | Commit After |
| ---------------------------------- | ----- | ------------ |
| **3.1** Auth modal schemas         | 3     |              |
| **3.2** Event modal schema         | 1     |              |
| **3.3** Organization modal schemas | 2     |              |
| **3.4** Profile modal schema       | 1     |              |
| **3.5** Session modal schemas      | 3     | ✓            |

**Files to migrate:**

- `modals/auth/ForgotPasswordModal/schemas/forgotPasswordSchema.js`
- `modals/auth/LoginModal/schemas/loginSchema.js`
- `modals/auth/SignupModal/schemas/signupSchema.js`
- `modals/event/EventModal/schemas/eventSchema.js`
- `modals/organization/InviteUserModal/schemas/inviteUserSchema.js`
- `modals/organization/OrganizationModal/schemas/organizationSchema.js`
- `modals/profile/EditAvatarModal/avatarOptions.js`
- `modals/session/AddEventUserModal/schemas/addEventUserSchema.js`
- `modals/session/AddSpeakerModal/schemas/addSpeakerSchema.js`
- `modals/session/EditSessionModal/schemas/editSessionSchema.js`

**Checkpoint:** `npm run check`

---

## Phase 4: Shared Components

| Task                                                                                  | Files | Commit After |
| ------------------------------------------------------------------------------------- | ----- | ------------ |
| **4.1** Index/barrel exports                                                          | 5     | ✓            |
| **4.2** Standalone cards (`PersonCard`, `SpeakerCard`, `SponsorCard`, `PrivateImage`) | 4     | ✓            |
| **4.3** UI primitives (`Button`, `LoadingState`, `ErrorBoundary`, `Analytics`)        | 4     | ✓            |
| **4.4** Forms (`TimeSelect`)                                                          | 2     |              |
| **4.5** Auth modals (Login, Signup, ForgotPassword)                                   | 3     | ✓            |
| **4.6** Entity modals (Event, Organization, Profile, Session)                         | 6     | ✓            |
| **4.7** Other modals (`ConfirmationModal`, `IcebreakerModal`, `PageHeader`)           | 3     | ✓            |
| **4.8** Chat components (17 files - desktop + mobile variants)                        | 17    | ✓            |

**Checkpoint:** `npm run check`

---

## Phase 5: Page Schemas & Utilities

| Task                                            | Files | Commit After |
| ----------------------------------------------- | ----- | ------------ |
| **5.1** Auth schemas (`resetPasswordSchema.js`) | 1     |              |
| **5.2** EventAdmin schemas                      | 6     | ✓            |
| **5.3** Other page schemas                      | 6     | ✓            |
| **5.4** Page utilities/hooks                    | 8     | ✓            |

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

| Task                                                                   | Files | Commit After |
| ---------------------------------------------------------------------- | ----- | ------------ |
| **6.1** `main.jsx` → `main.tsx`                                        | 1     | ✓            |
| **6.2** Route guards (`AuthGuard`, `PublicGuard`)                      | 2     |              |
| **6.3** Layouts (`AppLayout`, `RootLayout`)                            | 2     |              |
| **6.4** Route definitions (`index`, `protectedRoutes`, `publicRoutes`) | 3     | ✓            |

**Checkpoint:** `npm run check`

---

## Phase 7: Pages

Ordered from smallest to largest for incremental progress.

| Task                                     | Folder | Files | Commit After |
| ---------------------------------------- | ------ | ----- | ------------ |
| **7.1** `Errors/`                        | 2      |       |
| **7.2** `Roadmap/`                       | 1      |       |
| **7.3** `Speakers/`                      | 2      |       |
| **7.4** `Sponsors/`                      | 2      |       |
| **7.5** `NewUserLanding/`                | 3      | ✓     |
| **7.6** `Network/`                       | 4      | ✓     |
| **7.7** `Profile/`                       | 7      | ✓     |
| **7.8** `Settings/`                      | 9      | ✓     |
| **7.9** `Invitations/`                   | 8      | ✓     |
| **7.10** `Auth/`                         | 8      | ✓     |
| **7.11** `Dashboard/`                    | 10     | ✓     |
| **7.12** `Agenda/`                       | 6      | ✓     |
| **7.13** `Session/`                      | 18     | ✓     |
| **7.14** `Events/`                       | 11     | ✓     |
| **7.15** `Networking/`                   | 10     | ✓     |
| **7.16** `Organizations/`                | 19     | ✓     |
| **7.17** `Landing/`                      | 31     | ✓     |
| **7.18** `Landing_backup_v2/`            | 16     | ✓     |
| **7.19** `EventAdmin/AttendeesManager/`  | 9      | ✓     |
| **7.20** `EventAdmin/EventSettings/`     | 10     | ✓     |
| **7.21** `EventAdmin/NetworkingManager/` | 10     | ✓     |
| **7.22** `EventAdmin/SessionManager/`    | 8      | ✓     |
| **7.23** `EventAdmin/SpeakersManager/`   | 8      | ✓     |
| **7.24** `EventAdmin/SponsorsManager/`   | 18     | ✓     |
| **7.25** `Navigation/`                   | 10     | ✓     |

**Checkpoint:** `npm run check` after each commit

---

## Phase 8: Networking Module (Deferred)

Complex Socket.IO integration - migrated separately.

| Task                                              | Files | Lines | Commit After |
| ------------------------------------------------- | ----- | ----- | ------------ |
| **8.1** Define socket event types                 | 1 new | -     | ✓            |
| **8.2** `networking/api.js`                       | 1     | ~445  | ✓            |
| **8.3** `networking/socketClient.js`              | 1     | ~1424 | ✓            |
| **8.4** Evaluate/remove `TBD - api-simplified.js` | 1     | ~327  | ✓            |

**Checkpoint:** `npm run check`

---

## Phase 9: Final Cleanup & Enforcement

| Task                                         | Action         | Commit After |
| -------------------------------------------- | -------------- | ------------ |
| **9.1** Audit/fix remaining `any` types      | Search & fix   | ✓            |
| **9.2** Remove `@ts-expect-error` directives | Search & fix   | ✓            |
| **9.3** Remove `jsconfig.json`               | Delete file    |              |
| **9.4** Set `allowJs: false` in tsconfig     | Config change  | ✓            |
| **9.5** Add type coverage CI check           | GitHub Actions | ✓            |

**Final Checkpoint:** `npm run check` + `npm run build`

---

## Summary

| Phase     | Description                  | Files    | Commits |
| --------- | ---------------------------- | -------- | ------- |
| 1         | Foundation Types & Utilities | 12       | 3       |
| 2         | Feature API Modules          | 7        | 4       |
| 3         | Shared Component Schemas     | 10       | 1       |
| 4         | Shared Components            | 43       | 7       |
| 5         | Page Schemas & Utilities     | 21       | 3       |
| 6         | Router & Entry Point         | 8        | 2       |
| 7         | Pages                        | 249      | 25      |
| 8         | Networking Module            | 4        | 4       |
| 9         | Final Cleanup                | -        | 4       |
| **Total** |                              | **~354** | **~53** |

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
