#!/bin/bash

# Base directories
mkdir -p src/app/store
mkdir -p src/app/router/layouts/components/{MainNav,NavContext,NavMenu}
mkdir -p src/app/router/layouts/AppLayout
mkdir -p src/app/router/guards/AuthGuard
mkdir -p src/app/router/routes

# Features directories
mkdir -p src/features/{auth,landing,organizations,events,sessions,users}/{components,hooks,types}

# Shared directories
mkdir -p src/shared/{types,utils,components/ui}

# Create base files
touch src/main.tsx
touch src/app/store/{index.ts,rootReducer.ts,types.ts}
touch src/app/router/routes/{index.tsx,protectedRoutes.ts,publicRoutes.ts,types.ts}

# Create component files
for dir in MainNav NavContext NavMenu; do
    touch src/app/router/layouts/components/$dir/{index.tsx,$dir.module.css,types.ts}
done

touch src/app/router/layouts/AppLayout/{index.tsx,AppLayout.module.css,types.ts}
touch src/app/router/guards/AuthGuard/{index.tsx,types.ts}