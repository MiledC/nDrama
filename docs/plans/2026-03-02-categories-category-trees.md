# Epic: Categories & Category Trees

**Date:** 2026-03-02
**Status:** Approved

## Overview

Categories are organizational containers that group tags into a browsable/filterable tree.
Users navigate categories to discover series; admins manage the tree in the admin panel.

- Max depth: 2 levels (categories → subcategories)
- A category is a collection of tags (many-to-many)
- A parent category aggregates its subcategories' series plus its own direct tags
- Tags remain the atomic labels assigned to series — categories don't link to series directly

## Data Model

### `categories` table

| Column      | Type         | Constraints                          |
|-------------|--------------|--------------------------------------|
| id          | UUID         | PK, auto-generated                   |
| name        | VARCHAR(100) | NOT NULL                             |
| icon        | VARCHAR(50)  | NULLABLE (emoji or icon class)       |
| description | TEXT         | NULLABLE                             |
| parent_id   | UUID         | FK → categories.id, NULLABLE         |
| sort_order  | INTEGER      | NOT NULL, DEFAULT 0                  |
| match_mode  | VARCHAR(5)   | NOT NULL, DEFAULT 'any' ('any'/'all')|
| created_at  | TIMESTAMP    | auto                                 |
| updated_at  | TIMESTAMP    | auto                                 |

**Constraints:**
- UNIQUE(parent_id, name) — no duplicate names at same level
- App-level: parent_id can only reference a root category (parent_id IS NULL)

### `category_tags` join table

| Column      | Type | Constraints                           |
|-------------|------|---------------------------------------|
| category_id | UUID | FK → categories.id (CASCADE), PK     |
| tag_id      | UUID | FK → tags.id (CASCADE), PK           |

### Relationships

- Category ↔ Tags: many-to-many via category_tags
- Category → Subcategories: one-to-many self-referential (parent_id)
- A tag can belong to multiple categories

## Resolution Logic

- **Leaf category:** Series matching its tags using match_mode (any=union, all=intersection)
- **Parent category:** Union of all subcategory results + its own direct tag matches
- Resolution always goes through the Series↔Tags relationship; categories never link to series directly

## API Endpoints

### Admin/Editor (authenticated)

```
GET    /api/categories              — List categories (flat or ?format=tree)
GET    /api/categories/{id}         — Single category with tags and subcategories
POST   /api/categories              — Create category (name, icon, description, parent_id?, tag_ids?, match_mode?)
PATCH  /api/categories/{id}         — Update category fields
DELETE /api/categories/{id}         — Delete (409 if has subcategories)
PUT    /api/categories/{id}/tags    — Replace tags for category
PATCH  /api/categories/reorder      — Batch reorder [{id, sort_order}]
```

### Public (browsing)

```
GET    /api/categories/tree         — Full category tree
GET    /api/categories/{id}/series  — Resolved series (paginated)
```

## Frontend

### Admin — CategoriesView

- Tree view with drag-to-reorder
- Inline actions: edit, delete, add subcategory
- Create/edit modal: name, icon, description, tag multi-select, match mode toggle
- Tag pills showing assigned tags per category

### Public — Browse by Category

- Category navigation (sidebar or tabs)
- Top-level categories with icons, expandable subcategories
- Selecting a category filters series grid by resolved tags

## What stays the same

- Tags model unchanged (the `category` enum column stays; orthogonal)
- Series↔Tags relationship unchanged
- Tag CRUD unchanged
