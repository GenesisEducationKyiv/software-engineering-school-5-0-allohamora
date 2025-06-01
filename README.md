# Weather Subscription

a weather subscription app.

[![build](https://github.com/allohamora/weather-subscription/actions/workflows/build.yml/badge.svg?event=push&branch=master)](https://github.com/allohamora/weather-subscription/actions/workflows/build.yml)
[![test](https://github.com/allohamora/weather-subscription/actions/workflows/test.yml/badge.svg?event=push&branch=master)](https://github.com/allohamora/weather-subscription/actions/workflows/test.yml)

## Overview

This application allows users to subscribe to weather updates and receive them via email at their preferred interval. It's built with modern TypeScript technologies:

- [Hono](https://hono.dev/) - Fast, lightweight web framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM for SQL databases
- [PostgreSQL](https://www.postgresql.org/) - Robust relational database
- [Resend](https://resend.com/) - Email delivery service
- [Croner](https://github.com/hexagon/croner) - Cron-based job scheduler

## Prerequisites

Before running the application, you'll need:

- Node.js (v22.13.0 or higher)
- npm (v10.9.2 or higher)
- Docker and Docker Compose
- A domain for email sending

## Setup Weather API

1. Go to [Weather API](https://www.weatherapi.com/)
2. Register an account
3. Create an API key
4. You'll add this key to your `.env` file in the installation steps

## Setup Email Sending

1. Purchase a domain on [Google Cloud DNS](https://cloud.google.com/dns) or another provider
2. Go to [Resend](https://resend.com/)
3. Register an account
4. Follow the instructions to set up your domain for email sending
5. Create an API key
6. You'll add this key to your `.env` file in the installation steps

## Installation & Local Development

1. Clone the repository

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file from the template:

   ```bash
   cp .env.example .env
   ```

4. Fill the `.env` file with your API keys and configuration

5. Start the required services with Docker:

   ```bash
   docker compose up -d pg
   ```

6. Run the application in development mode:

   ```bash
   npm run dev
   ```

7. Access the application:
   - Subscribe form: [http://localhost:3000](http://localhost:3000)
   - Swagger API documentation: [http://localhost:3000/swagger](http://localhost:3000/swagger)

## Running in Docker

For a full production-like environment:

1. Clone the repository

2. Create a `.env` file from the template:

   ```bash
   cp .env.example .env
   ```

3. Fill the `.env` file with your API keys and configuration

4. Start the application and all services using Docker:

   ```bash
   docker compose up -d
   ```

5. Access the application:
   - Subscribe form: [http://localhost:3000](http://localhost:3000)
   - Swagger API documentation: [http://localhost:3000/swagger](http://localhost:3000/swagger)

## Database Management

Database migrations are automatically run when the application starts.

To generate a new migration after making schema changes:

```bash
npm run migrations:generate
```

## Development Scripts

```bash
# Run the application in development mode
npm run dev

# Build the application
npm run build

# Start the production build
npm run start

# Run tests
npm run test

# Format code
npm run format:fix

# Lint code
npm run lint:fix
```

## Project Architecture

### API Structure

The application follows a clean architecture pattern:

- **Controllers** (`src/controllers/`) - Handle HTTP requests/responses
- **Services** (`src/services/`) - Implement business logic
- **Repositories** (`src/repositories/`) - Handle data access
- **Templates** (`src/templates/`) - Define email templates

### Design Decisions

#### Weather API Integration

This project uses [Weather API](https://www.weatherapi.com/) to fetch accurate weather data. The service layer abstracts the API integration, making it easy to swap providers if needed.

#### Email Delivery

The application uses [Resend](https://resend.com/) for reliable email delivery. Emails are generated using custom templates and delivered at the user's preferred intervals.

#### JWT for Subscription Management

This application uses JWT tokens rather than storing inactive subscriptions in the database for several reasons:

1. **Reduced Database Overhead**: Prevents storing temporary data in the database
2. **Improved Developer Experience**: Simplifies subscription management
3. **Stateless Verification**: Subscriptions can be verified without database queries

The JWT contains all necessary information for subscription creation, and if a user wants to resubscribe after the verification period (10 minutes), a new token is simply generated.

For more robust production environments, a Redis-based token store with TTL could be implemented, but this would add unnecessary complexity for this project.

#### Scheduling

The application uses [Croner](https://github.com/hexagon/croner) for scheduling weather updates instead of a message queue system because:

1. **Simplified Timing**: Weather updates are sent at fixed intervals (hourly/daily) or not at all
2. **User Expectations**: Attempting to retry failed email deliveries could create confusing timing for users
3. **Reduced Complexity**: In-memory scheduling is simpler to implement and maintain

For applications requiring more robust retry mechanisms and scalability, a message queue system like BullMQ would be more appropriate, but this would introduce unnecessary complexity for this project's requirements.

#### Future Improvements

While this application is designed to be a focused MVP, several enhancements could be implemented for larger-scale production deployments:

1. **LRU Cache with TTL for Weather API Calls**: Implementing a caching layer would reduce external API calls, improve response times, and reduce costs for frequently requested locations.

2. **DataLoader for Subscription Processing**: Using a batching and caching library like DataLoader when processing subscriptions would optimize database queries and improve performance when sending updates to many users.

3. **Rate Limiting**: Adding API rate limiting would protect the application from abuse and ensure fair resource allocation among users.

These improvements would enhance scalability and performance but are deliberately omitted from the current implementation to maintain simplicity and focus on core functionality in this MVP.
