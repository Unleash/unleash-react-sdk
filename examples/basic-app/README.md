# Unleash React SDK example

This directory contains a small Vite + React application that consumes
`@unleash/proxy-client-react`. It connects to the Unleash Frontend API and
shows how to:

- bootstrap the SDK with `FlagProvider`
- evaluate a toggle with `useFlag`
- inspect variants with `useVariant`
- update the evaluation context with `useUnleashContext`
- react to the client status via `useFlagsStatus`

## Prerequisites

You need a running [Unleash Frontend API](https://docs.getunleash.io/reference/front-end-api)
or [Unleash Edge](https://docs.getunleash.io/reference/unleash-edge) along with an
appropriate frontend token.

## Local setup

From the repository root, install the dependencies used by the example:

```bash
cd examples/basic-app
yarn install
```

The Vite configuration aliases `@unleash/proxy-client-react` to the local `src`
folder, so you do not need to build the SDK before running the demo. Swap this
alias for the npm package if you copy the example into another project.

Create a `.env` file with your connection details:

```bash
cp .env.example .env
```

and edit the file to match your environment:

```env
VITE_UNLEASH_URL=https://<your-unleash-domain>/api/frontend
VITE_UNLEASH_CLIENT_KEY=<frontend-or-pretrusted-token>
VITE_UNLEASH_APP_NAME=react-example-app
VITE_UNLEASH_REFRESH_INTERVAL=15
VITE_UNLEASH_ENVIRONMENT=development
```

> The app evaluates the `demo-app.simple-toggle` flag by default. Make sure the
> toggle exists and is available to the token you supplied.

Start the Vite dev server:

```bash
yarn dev
```

Open the printed URL (defaults to http://localhost:5173) in your browser. The
UI renders the current status for the configured toggle and exposes a small
form that lets you swap the `userId` used for evaluations.
