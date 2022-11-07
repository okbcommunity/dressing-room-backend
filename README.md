# 🐻👕 `Dressing Room`

> [Project definition](https://docs.google.com/document/d/1r79JpQuDaUg7jHCuk29znx-eFeEVWszP1QbT7YaIZR4/edit)

This is the backend project for the `Dressing Room` project.

#### 🕐 Time spent building this project

todo

---

## 🛠 Local Development

todo

---

## 📬 Deployment

todo

---

## 🦾 Database

We've decided to use a `Relational Database` (PostgreSQL). Why because it's fast, scalable and we were most comfortable with it.

### Database Requirements

- Store default `traits` (including Background, Fur, Mouth, Eyes, Hat, Clothes, Eyewear) with `Bear Number` (e.g. #7227) and corresponding `public key` for each Bear (Primary key should be `public key`)
- `Public key` to fetch additional data from blockchain and keep attributes in sync (e.g. with cronjob)
- Each Bear can have **one TRAIT for each default CATEGORY**
- Attributes consist of `image urls` (different sizes and formats for different use cases → download, frontend compositions), a `unique id` (referenced in the image link), a name (e.g. yellow) and a `category id` (Primary key should be `unique id`)
- Each **trait belongs to ONE category** and can be assigned to x Bears
- Categories consist of a `name`, a `weight` (to decide which category is added to the layer at what position) and a `unique id` (Primary key should be `uniqe id`)

### Concept

<details>
<summary>v1</summary>

![img](./resources/assets/uml_er_diagram.drawio.png)

#### FAQ

**Why extracted Table `Category_Weight`?** </br>
For easier sorting and adding new categories. Since if a new category is added each weight needs to be updated based on where the new category is ‘ranked’.

</details>

---

## Content Management System (CMS)

In term of management; we’ll need a CMS that permits us to easily add/remove and edit the tags of a trait.

---

## 🧐 FAQ

### Why we've decided to use GraphQL over REST for this project?

1. **Client-side data shaping + Navigating a relational Graph**
   _e.g. Frontend can decide whehter it only requires the Trait ID's of a Bear or all Trait Information already baked into the Response -> only one request instead of potential 2 as we would only return the Trait ID's via the REST API; Easier support for multipe display languages -> Frontend can decide what language the display name of a Trait should be_

2. **Auto documentation + Types for the Backend and Frontend.** Wouldn't be a problem with REST either if we could've figured out how to generate Backend Types (Typescript) based on the created `Open API` file. In Spring Boot its easy but we decided to go with NodeJs + Express for simplicity as the majority devs knows how to write Typescript and can work on frontend and backend.

**Ressources:**

- [Video](https://www.youtube.com/watch?v=x6r4IzofPVc)
- [Blog](https://hygraph.com/blog/graphql-vs-rest-apis)
