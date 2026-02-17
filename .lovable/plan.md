

# Offline FX — Currency Converter PWA

A production-ready, offline-first currency converter built for travelers. Mobile-first PWA with automatic rate updates, favorites, history, and bilingual support (Norwegian/English).

---

## Phase 1: Foundation & Core Converter

### Data & Services Layer
- **Rate Service** (`rateService.ts`): fetch rates from API, cache to IndexedDB, derive cross rates using decimal-safe math
- **Connectivity Service**: detect online/offline status with event listeners
- **Storage Layer**: IndexedDB with versioned schema for rates, settings, favorites, and history; LocalStorage fallback
- **Serverless Proxy**: Supabase Edge Function to securely proxy exchange rate API calls (keeps API key private)

### Home / Converter Screen
- Large amount input field with real-time conversion (debounced)
- From/To currency selectors showing flag emoji + code + name
- Swap button (↔) to flip currencies
- Prominent result display
- Quick amount chips (10 / 25 / 50 / 100 / 500)
- "Last updated" timestamp + Online/Offline status badge
- "Update now" manual refresh button

---

## Phase 2: Currency Selector & Favorites

### Currency Selector (Modal)
- Search by code or name (e.g. "USD", "dollar")
- Common currencies pinned at top
- Star icon to add/remove from favorites
- Support for 170+ currencies

### Favorites
- Favorites bar on home screen for quick currency selection
- Manage favorite currencies and favorite pairs
- Persisted in IndexedDB

---

## Phase 3: History & Settings

### History Screen
- List of last 50 conversions with amount, pair, result, and timestamp
- Clear history button

### Settings Screen
- Default base and target currency
- Edit quick amount chips
- "Auto-update on Wi-Fi only" toggle
- API provider attribution
- Diagnostics: last fetch status, cached rates age, app version

---

## Phase 4: Localization & Accessibility

### Bilingual Support
- Norwegian (Bokmål) as default, English toggle
- All UI strings in a translation map
- Language preference persisted

### Accessibility
- Large tap targets, proper ARIA labels, high contrast
- Keyboard-friendly navigation

---

## Phase 5: PWA & Offline

### PWA Setup
- Web App Manifest with app name, icons, theme colors
- Service Worker: cache-first for app shell, network-first for rates endpoint
- "Install app" CTA shown when eligible (non-intrusive)

### Offline Handling
- Use cached rates when offline with clear "Offline rates" indicator
- Friendly first-launch-offline message if no cached data
- Stale rates warning banner (configurable threshold)
- Graceful API failure handling with backoff

---

## Phase 6: Privacy, Testing & Polish

### Privacy
- Simple privacy page: "No personal data collected"
- No login required

### Testing
- Unit tests for conversion math and caching logic
- Manual test checklist documented in the app

### Polish
- Lighthouse PWA optimization
- Proper metadata, icons (placeholders), and publish configuration
- Error boundaries and edge case handling throughout

