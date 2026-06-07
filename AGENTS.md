# Backend API Rules

Use these rules whenever adding or changing APIs in this backend.

Before implementing any API, read `API_IMPLEMENTATION_PLAN.md` for the endpoint roadmap and read `DATABASE_SCHEMA.md` as the source of truth for table names, column names, primary keys, foreign keys, unique constraints, status values, and Supabase relationship names.

## Architecture

This project is Node.js Express + Supabase/PostgreSQL, following a Database First approach.

Every API should follow this flow:

```text
Client
-> Route
-> Middleware
-> Validation
-> Controller
-> Service
-> Repository
-> Supabase/PostgreSQL
-> Response helper
```

Keep responsibilities separated:

- Route: declares HTTP method, endpoint, middleware chain, and controller.
- Middleware: handles auth, role checks, validation, uploads, and request pre-processing.
- Controller: reads `req.params`, `req.query`, `req.body`, `req.file`; calls service; returns response; catches errors with `next(error)`.
- Validation: validates input with Zod before service logic runs.
- Service: owns business rules, workflow rules, FK existence checks, default values, and authorization-related domain rules.
- Repository: owns Supabase queries only. Do not put business logic here.
- Utils/config: shared helpers, response helpers, app errors, pagination, Supabase, Cloudinary.

Do not put Supabase query logic directly in controllers unless it is a very small temporary health/debug endpoint.

## Module Structure

Each module should use this structure:

```text
src/modules/moduleName/
  moduleName.routes.js
  moduleName.controller.js
  moduleName.service.js
  moduleName.repository.js
  moduleName.validation.js
```

Use existing project naming conventions. If a module already exists with a slightly different pattern, follow the existing pattern unless it is clearly wrong.

## Routing

Prefer REST-style endpoints:

```text
GET    /api/resources
POST   /api/resources
GET    /api/resources/:resourceId
PATCH  /api/resources/:resourceId
PATCH  /api/resources/:resourceId/status
DELETE /api/resources/:resourceId
```

Mount module routes from `src/app.js`.

Route order should be:

```js
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  validate(createSchema),
  controller.create
);
```

## Validation

Use Zod for request validation.

Validate:

- `req.body` for create/update requests.
- `req.params` for IDs.
- `req.query` for pagination, filters, search, and sort.
- file presence/type when upload is required.

Never trust frontend input.

Use shared constants for status values and roles when available. If not available, create them in `src/constants/`.

## Service Rules

Services must enforce business rules before writing data.

Always check important foreign keys before insert/update, for example:

- `series_id` exists.
- `chapter_id` belongs to the expected series.
- `page_id` exists.
- `assistant_id` exists and has role `assistant`.
- `task_id` exists.
- region/page relationships are valid.

Handle workflow transitions in service instead of relying only on database constraints.

Examples:

- Do not allow `page_task` to jump from `pending` directly to `completed` unless the user has a special role.
- Do not publish a chapter if its series is not published.
- Do not add the same user twice to a series if the database has `UNIQUE (series_id, user_id)`.

Use clear errors such as `new AppError('Series not found', 404)`.

## Repository Rules

Repositories should only query Supabase.

Common repository methods:

```js
findAll
findById
create
update
deleteById
existsById
```

When reading from Supabase:

- Use exact database table and column names from the schema.
- Use `.single()` only when exactly one row is expected.
- Use `.maybeSingle()` when not found is allowed and service will decide the error.
- Return `data`, not raw Supabase responses.
- Throw or normalize Supabase errors consistently.

## Response Format

All API responses should use shared response helpers.

Success response:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Error"
}
```

List response with pagination:

```json
{
  "success": true,
  "message": "Success",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

If the current helper does not support pagination yet, extend it cleanly instead of returning ad hoc JSON.

## Query Features

List APIs should support these when useful:

- Pagination: `page`, `limit`
- Filter: `status`, `role`, relevant foreign keys
- Search: `keyword`
- Sort: `sort`, `order`

Validate query params and whitelist sortable columns. Do not pass arbitrary client-provided column names into Supabase queries without checking.

## Authorization

Use auth middleware for protected APIs.

Use role middleware for role-restricted APIs.

Suggested role responsibilities:

- `admin`: full access.
- `mangaka`: create/manage own series and manuscripts, view tasks related to own series.
- `assistant`: view assigned tasks, submit tasks, view feedback.
- `editor`: create/review tasks, create review sessions.
- `reviewer`: vote in review sessions.
- `reader`: view published content.

Authorization checks that depend on ownership or relationships should live in service logic.

## Uploads

Use `src/middlewares/upload.middleware.js` for image uploads.

Use `src/utils/cloudinary.js` for Cloudinary upload/delete helpers.

Do not expose Cloudinary API secrets to responses or frontend.

Store Cloudinary `secure_url` and `public_id` when the file may need to be deleted later.

## Database First Checklist

Before implementing an API, inspect or confirm:

- Table name.
- Column names.
- Primary key.
- Foreign keys.
- Unique constraints.
- Check constraints.
- Valid status values.
- Relationships and join names.
- Required fields and defaults.

Use `DATABASE_SCHEMA.md` for this checklist. If the schema has changed in Supabase, update `DATABASE_SCHEMA.md` first, then implement the API.

Backend should return readable errors before users hit confusing database errors where practical.

## Error Handling

Controllers should use:

```js
try {
  const data = await service.method(...);
  return sendSuccess(res, 200, data, 'Success');
} catch (error) {
  next(error);
}
```

Use centralized error middleware.

Prefer `src/utils/appError.js` for operational errors. If it does not exist yet, create it before adding larger modules.

## Implementation Checklist

For each new API/module:

1. Confirm database schema and constraints.
2. Define routes.
3. Add validation schemas.
4. Add controller methods.
5. Add service business logic.
6. Add repository queries.
7. Mount routes in `app.js`.
8. Use response helper.
9. Use error middleware.
10. Test at least one success case and one failure/validation case when feasible.

## Current Project Notes

Existing configured services:

- Supabase: `src/config/supabase.js`
- Cloudinary: `src/config/cloudinary.js`
- Upload middleware: `src/middlewares/upload.middleware.js`
- Cloudinary helpers: `src/utils/cloudinary.js`
- Response helpers: `src/utils/response.js`

Keep `.env` secrets private. Never commit Supabase service role key, JWT secret, or Cloudinary secrets.
