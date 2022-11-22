# Backend

> The actual backend

## Gest Started

### Enironment Variables

```
# Express App Server Details
APP_PORT=9000
APP_BASE_URL=http://localhost:{}
APP_CORS_ORIGIN=http://localhost:3000

# Github
GITHUB_APP_ID=260964
GITHUB_APP_WEBHOOK_SECRET="development"
GITHUB_APP_PRIVATE_KEY={private_key}

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5001/dressing_room?schema=public"
```

#### `PRIVATE_KEY `

Download `.pem` file from Github and open it in your Code Editor.
[Replace all 'newlines' with `\n`](https://unix.stackexchange.com/questions/572207/vim-how-to-replace-a-newline-with-the-string-n).
Copy the String and replace `{private_key}` with the downloaded and parsed
Private Key.

---

## 🧐 FAQ

### How was the `backend` setup?

The project was setup from scratch using the follwoing commands:

```bash
> pnpm init
> npx tsc --init
```

We've continued expanding it from there and added additional necessary
dependencies.

---

## 🔴 Issues

todo

---

## 👨‍🏫 Learnings

### Github App

Github Apps can act on them self (like a independent user), where OAuth Apps
only proivde authentication (e.g. to your User Account). Thus OAuth Apps will
create e.g. Comments in your behalf with your Github Profile. Github Apps on the
other hand have an own profile (e.g. JeffBot) and act on them self while they
can create e.g. Comments in their name.

#### Get Started

- [Blog Post](https://medium.com/@knidarkness/creating-a-github-app-with-node-js-3bda731d45b9)

#### Test Github Webhook locally

- [Gist](https://gist.github.com/joyrexus/7898e57be3478b4522ec5654c3cb572e)
- [Seem.io](https://smee.io/)

#### Rate Limit

- [Docs](https://docs.github.com/en/developers/apps/building-github-apps/rate-limits-for-github-apps)

---

### No line break after a header in markdown?

- [Github Issue](https://github.com/prettier/prettier/issues/6491)

---

### Determine project root from a running node.js application

- [Stackoverflow](https://stackoverflow.com/questions/10265798/determine-project-root-from-a-running-node-js-application)

---

### Prisma

- [How to Build a REST API with Prisma and PostgreSQL](https://www.digitalocean.com/community/tutorials/how-to-build-a-rest-api-with-prisma-and-postgresql)
- [Preview Database with PrismaStudio](https://www.prisma.io/studio)
- [Connect PostgreSQL Database](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Migration in DEV](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production)

#### Commands

- `npx prisma migrate reset` - Drops the old database + schema and creates a new
  database with the updated schema
- `prisma migrate dev --name init` - Create first migration

---

### Docker

#### Commands

- [`docker ps` - List Containers](https://docs.docker.com/engine/reference/commandline/ps/)
- [`docker stop {container_name}` - Stop one or more running containers](https://docs.docker.com/engine/reference/commandline/stop/)

---

### How des Node.js handle 10k concurrent requests?

- [Stackoverflow](https://stackoverflow.com/questions/34855352/how-in-general-does-node-js-handle-10-000-concurrent-requests)

---

### Stringified regexp doesn't work when parsed with `new RegExp()`

- [Typescript Playground](https://www.typescriptlang.org/play?#code/ATBQIYwewOwZwC7BgUwO4DkCGBbFwBeYAIgCMAbLCAa1IFcaUEALLBAegqtoeqdYQB9ACYBqABQAzOgCdBAN1EwoKLDLgBKAHQAHGAHNiAbnDBo8JBFYBLGIRKDjp84mDCUKHQGEbMAMoIakhExOJOkLCu7p4+WLYAojDC9sQaTs6RSHA65NYIsbYACkFw8QAeOjIocHDWsABKWGj27ADaggC6EgD8AIStAHriHQBUADoaGuz6RsDs7MAA6lAy1HAZFsDZufm+xTIIpRVVNXV2RKjN9Sj65TriAAZtACQA3lZxMAC+XeJ9g29ot5fAEgj9xmNAR5gZ9EsIvlN9A8NLN5sAMFAkMtVrZ9KY0QAVKDASTWMrAFhsYDWGp0fAATygdAA5PJ8AhiVUcFA2RTmPg4NAdPgoJI+fgdFgaihkogZLjrKSZcAUMdqrVYGAQGisElqRZVLLhRBFdZ6dSkFLgGp9HQ8DAkJLpckOeLgNdbhUzJQahtXNs8gUYPtDncThqYAAxMnKi7od03O6PVpvD62H49foDKExEGBA7gsaQ15AoNwhEPAA0JEMKLmC2xa1AfssexK9ku2DwphAWiqOSoKHE7AGWlEY3m1eZzI09YTA4g+BQbJk9JYuOAdAd1nIbp9SGZ7GZwCgEAgsiqMEXwFIKHIsH0G9dLAlbGYwAAtAA+YDMiD3uAZXYf8oEA4QPywchSFsKBj2-X8QLAiCoJg5ke2APtPEoRdxGZXQDGZKcZzna4F3wUlyCXJIN3ERVrWlBANHQrQAwQcRWKDEMjkqdUzhRZsQAieAoEorR730cQ02DEoUSAA)

```ts
const newName = 'blackbuckethat/blackbuckethat_d+(fur_v+noears).png';
const chain = '_';
const deepChainStart = '(';
const deepChainEnd = ')';

const splitChainPartsExpressionRaw = /[_]+(?![^(]*\))/g; // Works
const splitChainPartsExpression = new RegExp(
  `/[${chain}]+(?![^${deepChainStart}]*\\${deepChainEnd})/g`
); // Not Working
// To fix that issue you've to remove the scope of the passed stringified expression
// and instead specifiy it as argument passed to the RegExp class
const splitChainPartsExpressionFixed = new RegExp(
  `[${chain}]+(?![^${deepChainStart}]*\\${deepChainEnd})`,
  'g'
); // Works

const chainParts = newName
  .replace(/^.+\//, '') // Replace everything until the last '/' occurrence belonging to the path -> 'closed/closed-albino' -> 'closed-albino'
  .replace('.png', '') // Replace file ending (if asset)
  .split(splitChainPartsExpression);

console.log(chainParts);
```
