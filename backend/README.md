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

---

### Docker

#### Commands

- [`docker ps` - List Containers](https://docs.docker.com/engine/reference/commandline/ps/)
- [`docker stop {container_name}` - Stop one or more running containers](https://docs.docker.com/engine/reference/commandline/stop/)
