# Testing Guide

This guide provides instructions for running different types of tests in the weather-subscription application.

## Prerequisites

- Git
- Docker and Docker Compose
- Node.js

## Unit Tests

Unit tests verify individual components in isolation without external dependencies.

1. Install dependencies:

   ```bash
   npm i
   ```

2. Run unit tests:

   ```bash
   npm run test
   ```

   **Location:** `__tests__/unit/`

## Integration Tests

Integration tests verify how components work together and require a database connection.

1. Start required Docker services (database):

   ```bash
   docker compose up -d
   ```

2. Install dependencies:

   ```bash
   npm i
   ```

3. Run integration tests:

   ```bash
   npm run test:integration
   ```

   **Location:** `__tests__/integration/`

## End-to-End Tests

E2E tests validate the entire application flow from a user's perspective.

1. Start required Docker services:

   ```bash
   docker compose up -d
   ```

2. Install dependencies (and playwright browsers):

   ```bash
   npm i
   ```

3. Run end-to-end tests:

   ```bash
   npm run test:e2e
   ```

   **Location:** `__tests__/e2e/`

## Running All Tests at Once

Run all test suites with a single sequence of commands:

1. Start required Docker services:

   ```bash
   docker compose up -d
   ```

2. Install dependencies (and playwright browsers):

   ```bash
   npm i
   ```

3. Run all test suites sequentially:
   ```bash
   npm test && npm run test:integration && npm run test:e2e
   ```

## Tips

- **VS Code Integration:** This project is already configured to use the [Jest Runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner) extension. After installing the extension in VS Code, you can:
  - Run a single test by clicking the "Run" button above the test
  - Debug a test by clicking the "Debug" button
  - Easily run tests without leaving your editor
