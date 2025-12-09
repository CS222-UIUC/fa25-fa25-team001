# E2E Tests

End-to-end tests using Playwright.

## Test Files

- `signup-signin-flow.spec.ts` - Authentication flows
- `search-flow.spec.ts` - Search functionality
- `dashboard-profile-flow.spec.ts` - Dashboard and profile features
- `movie-review-flow.spec.ts` - Movie review interactions
- `platform-connection-flow.spec.ts` - Platform connections (Steam, Xbox, PlayStation, Nintendo)

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Record new test
npm run test:e2e:codegen
```

