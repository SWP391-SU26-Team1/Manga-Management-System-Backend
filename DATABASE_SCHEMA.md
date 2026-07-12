# Database Schema Reference

Use this file as the source of truth before implementing APIs. This backend is Database First, so repository queries must use the exact table names, column names, primary keys, foreign keys, unique constraints, and status values below.

## Tables

### users

Primary key: `user_id`

Columns:

| Column          | Type         | Required | Default             | Notes            |
| --------------- | ------------ | -------- | ------------------- | ---------------- |
| `user_id`       | UUID         | yes      | `gen_random_uuid()` | PK               |
| `username`      | VARCHAR(100) | yes      |                     | unique           |
| `email`         | VARCHAR(255) | yes      |                     | unique           |
| `password`      | TEXT         | yes      |                     | hashed password  |
| `role`          | VARCHAR(50)  | yes      |                     | app role         |
| `avatar_url`    | TEXT         | no       |                     |                  |
| `bio`           | TEXT         | no       |                     |                  |
| `name`          | VARCHAR(150) | no       |                     |                  |
| `gender`        | VARCHAR(20)  | no       |                     |                  |
| `date_of_birth` | DATE         | no       |                     |                  |
| `status`        | VARCHAR(50)  | yes      | `active`            | check constraint |
| `created_at`    | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                  |

Status values: `active`, `suspended`, `banned`, `inactive`

Referenced by: `notification.user_id`, `series_member.user_id`, `page_task.assigned_by_id`, `page_task.assistant_id`, `page_task_feedback.mangaka_id`, `page_task_feedback.assistant_id`, `annotation.user_id`, `review_session.created_by_user_id`, `vote.voter_id`, `manuscript.mangaka_id`

### notification

Primary key: `notification_id`

Columns:

| Column            | Type         | Required | Default             | Notes                                 |
| ----------------- | ------------ | -------- | ------------------- | ------------------------------------- |
| `notification_id` | UUID         | yes      | `gen_random_uuid()` | PK                                    |
| `user_id`         | UUID         | yes      |                     | FK to `users.user_id`, cascade delete |
| `title`           | VARCHAR(255) | yes      |                     |                                       |
| `content`         | TEXT         | no       |                     |                                       |
| `type`            | VARCHAR(50)  | no       |                     |                                       |
| `is_read`         | BOOLEAN      | yes      | `false`             | no status column                      |
| `created_at`      | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                                       |

Indexes: `idx_notification_user_id`

### series

Primary key: `series_id`

Columns:

| Column            | Type         | Required | Default             | Notes                  |
| ----------------- | ------------ | -------- | ------------------- | ---------------------- |
| `series_id`       | UUID         | yes      | `gen_random_uuid()` | PK                     |
| `title`           | VARCHAR(255) | yes      |                     |                        |
| `description`     | TEXT         | no       |                     |                        |
| `cover_image_url` | TEXT         | no       |                     |                        |
| `genre`           | VARCHAR(100) | no       |                     |                        |
| `status`          | VARCHAR(50)  | yes      | `draft`             | check constraint       |
| `view_count`      | INT          | no       | `0`                 |                        |
| `created_at`      | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                        |
| `updated_at`      | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` | update manually in API |

Status values: `draft`, `pending_review`, `approved`, `rejected`, `published`, `archived`, `hidden`, `banned`, `deleted`

Referenced by: `series_member.series_id`, `chapter.series_id`, `review_session.series_id`, `series_ranking.series_id`, `chapter_ranking.series_id`, `manuscript.series_id`

### series_member

Primary key: `series_member_id`

Columns:

| Column             | Type        | Required | Default             | Notes                                    |
| ------------------ | ----------- | -------- | ------------------- | ---------------------------------------- |
| `series_member_id` | UUID        | yes      | `gen_random_uuid()` | PK                                       |
| `series_id`        | UUID        | yes      |                     | FK to `series.series_id`, cascade delete |
| `user_id`          | UUID        | yes      |                     | FK to `users.user_id`, cascade delete    |
| `role_in_series`   | VARCHAR(50) | yes      |                     |                                          |

Unique constraints: `UNIQUE (series_id, user_id)`

Indexes: `idx_series_member_series_id`, `idx_series_member_user_id`

### bookmark

Primary key: `bookmark_id`

Columns:

| Column             | Type      | Required | Default             | Notes                                    |
| ------------------ | --------- | -------- | ------------------- | ---------------------------------------- |
| `bookmark_id`      | UUID      | yes      | `gen_random_uuid()` | PK                                       |
| `user_id`          | UUID      | yes      |                     | FK to `users.user_id`, cascade delete    |
| `series_id`        | UUID      | yes      |                     | FK to `series.series_id`, cascade delete |
| `chapter_id`       | UUID      | no       |                     | FK to `chapter.chapter_id`, set null     |
| `progress_percent` | INT       | no       | `0`                 |                                          |
| `last_read_at`     | TIMESTAMP | no       | `CURRENT_TIMESTAMP` |                                          |

Unique constraints: `UNIQUE (user_id, series_id)`

Indexes: `idx_bookmark_user_id`, `idx_bookmark_series_id`

### bookmark

Primary key: `bookmark_id`

Columns:

| Column                 | Type        | Required | Default             | Notes                      |
| ---------------------- | ----------- | -------- | ------------------- | -------------------------- |
| `bookmark_id`          | UUID        | yes      | `gen_random_uuid()` | PK                         |
| `user_id`              | UUID        | yes      |                     | FK to `users.user_id`      |
| `series_id`            | UUID        | yes      |                     | FK to `series.series_id`   |
| `last_read_chapter_id` | UUID        | no       |                     | FK to `chapter.chapter_id` |
| `page_id`              | UUID        | no       |                     | FK to `page.page_id`       |
| `created_at`           | TIMESTAMPTZ | no       | `now()`             |                            |
| `updated_at`           | TIMESTAMPTZ | no       | `now()`             |                            |

Unique constraints: `UNIQUE (user_id, series_id)`

### chapter_like

Primary key: `like_id`

Columns:

| Column       | Type        | Required | Default             | Notes                      |
| ------------ | ----------- | -------- | ------------------- | -------------------------- |
| `like_id`    | UUID        | yes      | `gen_random_uuid()` | PK                         |
| `user_id`    | UUID        | yes      |                     | FK to `users.user_id`      |
| `chapter_id` | UUID        | yes      |                     | FK to `chapter.chapter_id` |
| `created_at` | TIMESTAMPTZ | no       | `now()`             |                            |

Unique constraints: `UNIQUE (user_id, chapter_id)`

### view_log

Primary key: `log_id`

Columns:

| Column       | Type        | Required | Default             | Notes                      |
| ------------ | ----------- | -------- | ------------------- | -------------------------- |
| `log_id`     | UUID        | yes      | `gen_random_uuid()` | PK                         |
| `chapter_id` | UUID        | yes      |                     | FK to `chapter.chapter_id` |
| `created_at` | TIMESTAMPTZ | no       | `now()`             |                            |

### comment

Primary key: `comment_id`

Columns:

| Column              | Type        | Required | Default             | Notes                      |
| ------------------- | ----------- | -------- | ------------------- | -------------------------- |
| `comment_id`        | UUID        | yes      | `gen_random_uuid()` | PK                         |
| `user_id`           | UUID        | yes      |                     | FK to `users.user_id`      |
| `chapter_id`        | UUID        | yes      |                     | FK to `chapter.chapter_id` |
| `parent_comment_id` | UUID        | no       |                     | FK to `comment.comment_id` |
| `content`           | TEXT        | yes      |                     |                            |
| `status`            | VARCHAR(50) | yes      | `active`            |                            |
| `created_at`        | TIMESTAMPTZ | no       | `now()`             |                            |
| `updated_at`        | TIMESTAMPTZ | no       | `now()`             |                            |

### chapter

Primary key: `chapter_id`

Columns:

| Column                | Type         | Required | Default             | Notes                                    |
| --------------------- | ------------ | -------- | ------------------- | ---------------------------------------- |
| `chapter_id`          | UUID         | yes      | `gen_random_uuid()` | PK                                       |
| `series_id`           | UUID         | yes      |                     | FK to `series.series_id`, cascade delete |
| `chapter_number`      | INT          | yes      |                     | unique per series                        |
| `title`               | VARCHAR(255) | no       |                     |                                          |
| `thumbnail_image_url` | TEXT         | no       |                     |                                          |
| `status`              | VARCHAR(50)  | yes      | `draft`             | check constraint                         |
| `view_count`          | INT          | no       | `0`                 |                                          |
| `publish_date`        | TIMESTAMP    | no       |                     |                                          |
| `created_at`          | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                                          |
| `updated_at`          | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` | update manually in API                   |

Status values: `draft`, `pending_review`, `approved`, `rejected`, `published`, `archived`, `hidden`, `banned`, `deleted`

Unique constraints: `UNIQUE (series_id, chapter_number)`

Indexes: `idx_chapter_series_id`

Referenced by: `page.chapter_id`, `review_session.chapter_id`, `chapter_ranking.chapter_id`, `manuscript.chapter_id`

### page

Primary key: `page_id`

Columns:

| Column        | Type        | Required | Default             | Notes                                      |
| ------------- | ----------- | -------- | ------------------- | ------------------------------------------ |
| `page_id`     | UUID        | yes      | `gen_random_uuid()` | PK                                         |
| `chapter_id`  | UUID        | yes      |                     | FK to `chapter.chapter_id`, cascade delete |
| `page_number` | INT         | yes      |                     | unique per chapter                         |
| `image_url`   | TEXT        | no       |                     |                                            |
| `status`      | VARCHAR(50) | yes      | `draft`             | check constraint                           |
| `width`       | INT         | no       |                     |                                            |
| `height`      | INT         | no       |                     |                                            |
| `created_at`  | TIMESTAMP   | no       | `CURRENT_TIMESTAMP` |                                            |
| `updated_at`  | TIMESTAMP   | no       | `CURRENT_TIMESTAMP` | update manually in API                     |

Status values: `draft`, `in_progress`, `review`, `completed`, `published`, `archived`, `hidden`, `banned`, `deleted`

Unique constraints: `UNIQUE (chapter_id, page_number)`

Indexes: `idx_page_chapter_id`

Referenced by: `page_region.page_id`, `page_task.page_id`, `annotation.page_id`, `page_version.page_id`, `page_submission.page_id`

### page_region

Primary key: `region_id`

Columns:

| Column       | Type      | Required | Default             | Notes                                |
| ------------ | --------- | -------- | ------------------- | ------------------------------------ |
| `region_id`  | UUID      | yes      | `gen_random_uuid()` | PK                                   |
| `page_id`    | UUID      | yes      |                     | FK to `page.page_id`, cascade delete |
| `x`          | INT       | yes      |                     |                                      |
| `y`          | INT       | yes      |                     |                                      |
| `width`      | INT       | yes      |                     |                                      |
| `height`     | INT       | yes      |                     |                                      |
| `created_at` | TIMESTAMP | no       | `CURRENT_TIMESTAMP` |                                      |
| `updated_at` | TIMESTAMP | no       | `CURRENT_TIMESTAMP` | update manually in API               |

Indexes: `idx_page_region_page_id`

Referenced by: `page_task.region_id`, `annotation.region_id`

### page_task

Primary key: `task_id`

Columns:

| Column           | Type         | Required | Default             | Notes                                   |
| ---------------- | ------------ | -------- | ------------------- | --------------------------------------- |
| `task_id`        | UUID         | yes      | `gen_random_uuid()` | PK                                      |
| `page_id`        | UUID         | yes      |                     | FK to `page.page_id`, cascade delete    |
| `assigned_by_id` | UUID         | no       |                     | FK to `users.user_id`, set null         |
| `region_id`      | UUID         | no       |                     | FK to `page_region.region_id`, set null |
| `assistant_id`   | UUID         | no       |                     | FK to `users.user_id`, set null         |
| `task_type`      | VARCHAR(100) | yes      |                     |                                         |
| `status`         | VARCHAR(50)  | yes      | `pending`           | check constraint                        |
| `deadline`       | TIMESTAMP    | no       |                     |                                         |
| `content`        | TEXT         | no       |                     |                                         |
| `created_at`     | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                                         |
| `updated_at`     | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` | update manually in API                  |

Status values: `pending`, `assigned`, `in_progress`, `submitted`, `review`, `approved`, `needs_revision`, `completed`, `on_hold`, `cancelled`, `rejected`

Indexes: `idx_page_task_page_id`, `idx_page_task_region_id`, `idx_page_task_assistant_id`, `idx_page_task_assigned_by_id`, `idx_page_task_status`

Referenced by: `page_submission.task_id`, `annotation.task_id`

### page_version

Primary key: `version_id`

Columns:

| Column           | Type        | Required | Default             | Notes                                      |
| ---------------- | ----------- | -------- | ------------------- | ------------------------------------------ |
| `version_id`     | UUID        | yes      | `gen_random_uuid()` | PK                                         |
| `page_id`        | UUID        | yes      |                     | FK to `page.page_id`, cascade delete       |
| `image_url`      | TEXT        | yes      |                     | Cloudinary secure_url                      |
| `version_number` | INT         | yes      |                     | Auto-calculated by backend: MAX+1 per page |
| `version_type`   | VARCHAR(50) | yes      | `submitted`         | check constraint                           |
| `created_at`     | TIMESTAMP   | no       | `CURRENT_TIMESTAMP` |                                            |

Version type values: `original`, `submitted`, `approved`

Rules:

- Version 1 (`original`) is created when a page is first created by mangaka.
- Each assistant submission creates a new version (`submitted`). Backend auto-calculates `version_number = MAX(version_number)+1 WHERE page_id`.
- On reviewer approve, the version is updated to `approved`.

Unique constraints: `UNIQUE (page_id, version_number)`

Indexes: `idx_page_version_page_id`

Referenced by: `page_submission.version_number` (logical, not FK)

### page_submission

Primary key: `submission_id`

Columns:

| Column              | Type        | Required | Default             | Notes                                                            |
| ------------------- | ----------- | -------- | ------------------- | ---------------------------------------------------------------- |
| `submission_id`     | UUID        | yes      | `gen_random_uuid()` | PK                                                               |
| `page_id`           | UUID        | yes      |                     | FK to `page.page_id`, cascade delete                             |
| `task_id`           | UUID        | yes      |                     | FK to `page_task.task_id`, cascade delete                        |
| `assistant_id`      | UUID        | yes      |                     | FK to `users.user_id` (`fk_page_submission_assistant`), set null |
| `file_url`          | TEXT        | yes      |                     | Cloudinary secure_url of the submitted image                     |
| `version_number`    | INT         | yes      |                     | Matches `page_version.version_number` for this page              |
| `submission_status` | VARCHAR(50) | yes      | `pending`           | check constraint                                                 |
| `submission_notes`  | TEXT        | no       |                     | Assistant's notes when submitting                                |
| `submitted_at`      | TIMESTAMP   | no       | `CURRENT_TIMESTAMP` |                                                                  |
| `reviewed_at`       | TIMESTAMP   | no       |                     | Set when reviewer acts                                           |

Submission status values: `pending`, `approved`, `rejected`, `needs_revision`

Indexes: `idx_page_submission_task_id`, `idx_page_submission_assistant_id`, `idx_page_submission_status`

Referenced by: `page_task_feedback.submission_id`

### page_task_feedback

Primary key: `feedback_id`

Columns:

| Column          | Type      | Required | Default             | Notes                                                     |
| --------------- | --------- | -------- | ------------------- | --------------------------------------------------------- |
| `feedback_id`   | UUID      | yes      | `gen_random_uuid()` | PK                                                        |
| `submission_id` | UUID      | yes      |                     | FK to `page_submission.submission_id`, cascade delete     |
| `mangaka_id`    | UUID      | no       |                     | FK to `users.user_id` (`fk_feedback_mangaka`), set null   |
| `assistant_id`  | UUID      | no       |                     | FK to `users.user_id` (`fk_feedback_assistant`), set null |
| `content`       | TEXT      | yes      |                     |                                                           |
| `created_at`    | TIMESTAMP | no       | `CURRENT_TIMESTAMP` |                                                           |

Notes:

- `task_id` column was removed — feedback is now scoped to a `submission_id`, not a task.
- `status` column removed — feedback is a simple note, no workflow needed.
- Auto-created by backend when reviewer calls `request-revision`.

Indexes: `idx_page_task_feedback_submission_id`, `idx_page_task_feedback_mangaka_id`, `idx_page_task_feedback_assistant_id`

### annotation

Primary key: `annotation_id`

Columns:

| Column          | Type        | Required | Default             | Notes                                   |
| --------------- | ----------- | -------- | ------------------- | --------------------------------------- |
| `annotation_id` | UUID        | yes      | `gen_random_uuid()` | PK                                      |
| `page_id`       | UUID        | yes      |                     | FK to `page.page_id`, cascade delete    |
| `user_id`       | UUID        | yes      |                     | FK to `users.user_id`, cascade delete   |
| `region_id`     | UUID        | no       |                     | FK to `page_region.region_id`, set null |
| `task_id`       | UUID        | no       |                     | FK to `page_task.task_id`, set null     |
| `x`             | INT         | no       |                     |                                         |
| `y`             | INT         | no       |                     |                                         |
| `content`       | TEXT        | no       |                     |                                         |
| `status`        | VARCHAR(50) | yes      | `active`            | check constraint                        |
| `created_at`    | TIMESTAMP   | no       | `CURRENT_TIMESTAMP` |                                         |
| `updated_at`    | TIMESTAMP   | no       | `CURRENT_TIMESTAMP` | update manually in API                  |

Status values: `active`, `resolved`, `closed`, `archived`

Indexes: `idx_annotation_page_id`, `idx_annotation_user_id`, `idx_annotation_region_id`, `idx_annotation_task_id`

### review_session

Primary key: `session_id`

Columns:

| Column               | Type         | Required | Default             | Notes                                    |
| -------------------- | ------------ | -------- | ------------------- | ---------------------------------------- |
| `session_id`         | UUID         | yes      | `gen_random_uuid()` | PK                                       |
| `series_id`          | UUID         | yes      |                     | FK to `series.series_id`, cascade delete |
| `chapter_id`         | UUID         | no       |                     | FK to `chapter.chapter_id`, set null     |
| `created_by_user_id` | UUID         | no       |                     | FK to `users.user_id`, set null          |
| `name`               | VARCHAR(255) | no       |                     |                                          |
| `description`        | TEXT         | no       |                     |                                          |
| `started_at`         | TIMESTAMP    | no       |                     |                                          |
| `ended_at`           | TIMESTAMP    | no       |                     |                                          |
| `created_at`         | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                                          |
| `status`             | VARCHAR(50)  | yes      | `pending`           | added by migration                       |

Status values: `pending`, `in_progress`, `completed`, `finished`, `paused`, `cancelled`

Indexes: `idx_review_session_series_id`, `idx_review_session_chapter_id`, `idx_review_session_created_by_user_id`

Referenced by: `vote.session_id`

### vote

Primary key: `vote_id`

Columns:

| Column       | Type        | Required | Default             | Notes                                             |
| ------------ | ----------- | -------- | ------------------- | ------------------------------------------------- |
| `vote_id`    | UUID        | yes      | `gen_random_uuid()` | PK                                                |
| `voter_id`   | UUID        | yes      |                     | FK to `users.user_id`, cascade delete             |
| `session_id` | UUID        | no       |                     | FK to `review_session.session_id`, cascade delete |
| `decision`   | VARCHAR(50) | no       |                     |                                                   |
| `score`      | INT         | no       |                     | check: null or 1-10                               |
| `note`       | TEXT        | no       |                     |                                                   |
| `created_at` | TIMESTAMP   | no       | `CURRENT_TIMESTAMP` |                                                   |
| `updated_at` | TIMESTAMP   | no       | `CURRENT_TIMESTAMP` | update manually in API                            |
| `status`     | VARCHAR(50) | yes      | `submitted`         | added by migration                                |

Status values: `submitted`, `verified`

Indexes: `idx_vote_voter_id`, `idx_vote_session_id`

### ranking_period

Primary key: `period_id`

Columns:

| Column          | Type         | Required | Default             | Notes              |
| --------------- | ------------ | -------- | ------------------- | ------------------ |
| `period_id`     | UUID         | yes      | `gen_random_uuid()` | PK                 |
| `name`          | VARCHAR(255) | yes      |                     |                    |
| `period_type`   | VARCHAR(50)  | no       |                     |                    |
| `start_date`    | DATE         | yes      |                     |                    |
| `end_date`      | DATE         | yes      |                     |                    |
| `calculated_at` | TIMESTAMP    | no       |                     |                    |
| `created_at`    | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                    |
| `status`        | VARCHAR(50)  | yes      | `pending`           | added by migration |

Status values: `pending`, `calculating`, `completed`, `archived`

Referenced by: `series_ranking.period_id`, `chapter_ranking.period_id`

### series_ranking

Primary key: `series_ranking_id`

Columns:

| Column              | Type          | Required | Default             | Notes                                            |
| ------------------- | ------------- | -------- | ------------------- | ------------------------------------------------ |
| `series_ranking_id` | UUID          | yes      | `gen_random_uuid()` | PK                                               |
| `period_id`         | UUID          | yes      |                     | FK to `ranking_period.period_id`, cascade delete |
| `series_id`         | UUID          | yes      |                     | FK to `series.series_id`, cascade delete         |
| `rank_position`     | INT           | no       |                     |                                                  |
| `score`             | NUMERIC(10,2) | no       | `0`                 |                                                  |
| `total_vote`        | INT           | no       | `0`                 |                                                  |
| `created_at`        | TIMESTAMP     | no       | `CURRENT_TIMESTAMP` |                                                  |

Unique constraints: `UNIQUE (period_id, series_id)`

Indexes: `idx_series_ranking_period_id`, `idx_series_ranking_series_id`

### chapter_ranking

Primary key: `chapter_ranking_id`

Columns:

| Column               | Type          | Required | Default             | Notes                                            |
| -------------------- | ------------- | -------- | ------------------- | ------------------------------------------------ |
| `chapter_ranking_id` | UUID          | yes      | `gen_random_uuid()` | PK                                               |
| `period_id`          | UUID          | yes      |                     | FK to `ranking_period.period_id`, cascade delete |
| `series_id`          | UUID          | yes      |                     | FK to `series.series_id`, cascade delete         |
| `chapter_id`         | UUID          | yes      |                     | FK to `chapter.chapter_id`, cascade delete       |
| `rank_position`      | INT           | no       |                     |                                                  |
| `score`              | NUMERIC(10,2) | no       | `0`                 |                                                  |
| `total_vote`         | INT           | no       | `0`                 |                                                  |
| `created_at`         | TIMESTAMP     | no       | `CURRENT_TIMESTAMP` |                                                  |

Unique constraints: `UNIQUE (period_id, chapter_id)`

Indexes: `idx_chapter_ranking_period_id`, `idx_chapter_ranking_series_id`, `idx_chapter_ranking_chapter_id`

### manuscript

Primary key: `manuscript_id`

Columns:

| Column          | Type         | Required | Default             | Notes                                    |
| --------------- | ------------ | -------- | ------------------- | ---------------------------------------- |
| `manuscript_id` | UUID         | yes      | `gen_random_uuid()` | PK                                       |
| `mangaka_id`    | UUID         | yes      |                     | FK to `users.user_id`, cascade delete    |
| `series_id`     | UUID         | yes      |                     | FK to `series.series_id`, cascade delete |
| `chapter_id`    | UUID         | no       |                     | FK to `chapter.chapter_id`, set null     |
| `title`         | VARCHAR(255) | no       |                     |                                          |
| `content`       | TEXT         | no       |                     |                                          |
| `file_url`      | TEXT         | no       |                     |                                          |
| `status`        | VARCHAR(50)  | yes      | `draft`             | check constraint                         |
| `created_at`    | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                                          |
| `updated_at`    | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` | update manually in API                   |

Status values: `draft`, `submitted`, `in_review`, `needs_revision`, `approved`, `published`, `archived`, `hidden`, `rejected`, `deleted`

Indexes: `idx_manuscript_mangaka_id`, `idx_manuscript_series_id`, `idx_manuscript_chapter_id`

Referenced by: `manuscript_file.manuscript_id`

### manuscript_file

Primary key: `file_id`

Columns:

| Column          | Type         | Required | Default             | Notes                                            |
| --------------- | ------------ | -------- | ------------------- | ------------------------------------------------ |
| `file_id`       | UUID         | yes      | `gen_random_uuid()` | PK                                               |
| `manuscript_id` | UUID         | yes      |                     | FK to `manuscript.manuscript_id`, cascade delete |
| `file_url`      | TEXT         | yes      |                     |                                                  |
| `file_type`     | VARCHAR(50)  | no       |                     |                                                  |
| `file_name`     | VARCHAR(255) | no       |                     |                                                  |
| `description`   | TEXT         | no       |                     |                                                  |
| `uploaded_at`   | TIMESTAMP    | no       | `CURRENT_TIMESTAMP` |                                                  |
| `status`        | VARCHAR(50)  | yes      | `uploaded`          | added by migration                               |

Status values: `uploaded`, `validated`, `deleted`

Indexes: `idx_manuscript_file_manuscript_id`

### page_ai_suggestion

Primary key: `suggestion_id`

Columns:

| Column                | Type         | Required | Default             | Notes                                   |
| --------------------- | ------------ | -------- | ------------------- | --------------------------------------- |
| `suggestion_id`       | UUID         | yes      | `gen_random_uuid()` | PK                                      |
| `page_id`             | UUID         | yes      |                     | FK to `page.page_id`, cascade delete    |
| `region_id`           | UUID         | no       |                     | FK to `page_region.region_id`, set null |
| `task_id`             | UUID         | no       |                     | FK to `page_task.task_id`, set null     |
| `requested_by_id`     | UUID         | yes      |                     | FK to `users.user_id`, cascade delete   |
| `attempt_number`      | INTEGER      | yes      | `1`                 | Count number of AI runs for this task   |
| `ai_model`            | VARCHAR(100) | no       |                     |                                         |
| `prompt`              | TEXT         | no       |                     |                                         |
| `reference_image_url` | TEXT         | no       |                     |                                         |
| `result_data`         | JSONB        | no       |                     |                                         |
| `status`              | VARCHAR(50)  | yes      | `processing`        | check constraint                        |
| `processing_time_ms`  | INTEGER      | no       |                     |                                         |
| `created_at`          | TIMESTAMPTZ  | no       | `now()`             |                                         |
| `updated_at`          | TIMESTAMPTZ  | no       | `now()`             | update trigger                          |

Status values: `processing`, `completed`, `failed`, `cancelled`, `applied`, `rejected`

Indexes: `idx_ai_suggestion_page_id`, `idx_ai_suggestion_region_id`, `idx_ai_suggestion_task_id`, `idx_ai_suggestion_status`, `idx_ai_suggestion_requested_by`, `idx_ai_suggestion_created_at`

## Status Constants

When implementing validation, mirror these in `src/constants/status.js`.

```js
const USER_STATUS = ["active", "suspended", "banned", "inactive"];
const SERIES_STATUS = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "published",
  "archived",
  "hidden",
  "banned",
  "deleted",
];
const CHAPTER_STATUS = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "published",
  "archived",
  "hidden",
  "banned",
  "deleted",
];
const PAGE_STATUS = [
  "draft",
  "in_progress",
  "review",
  "completed",
  "published",
  "archived",
  "hidden",
  "banned",
  "deleted",
];
const PAGE_TASK_STATUS = [
  "pending",
  "assigned",
  "in_progress",
  "submitted",
  "review",
  "approved",
  "needs_revision",
  "completed",
  "on_hold",
  "cancelled",
  "rejected",
];
const PAGE_VERSION_TYPE = ["original", "submitted", "approved"];
const PAGE_SUBMISSION_STATUS = [
  "pending",
  "approved",
  "rejected",
  "needs_revision",
];
const ANNOTATION_STATUS = ["active", "resolved", "closed", "archived"];
const REVIEW_SESSION_STATUS = [
  "pending",
  "in_progress",
  "completed",
  "finished",
  "paused",
  "cancelled",
];
const VOTE_STATUS = ["submitted", "verified"];
const MANUSCRIPT_STATUS = [
  "draft",
  "submitted",
  "in_review",
  "needs_revision",
  "approved",
  "published",
  "archived",
  "hidden",
  "rejected",
  "deleted",
];
const MANUSCRIPT_FILE_STATUS = ["uploaded", "validated", "deleted"];
const RANKING_PERIOD_STATUS = [
  "pending",
  "calculating",
  "completed",
  "archived",
];
const PAGE_AI_SUGGESTION_STATUS = [
  "processing",
  "completed",
  "failed",
  "cancelled",
  "applied",
  "rejected",
];
```

## Supabase Relationship Notes

Use table names exactly as defined: `users`, `notification`, `series`, `series_member`, `chapter`, `page`, `page_region`, `page_task`, `page_version`, `page_submission`, `page_task_feedback`, `annotation`, `review_session`, `vote`, `ranking_period`, `series_ranking`, `chapter_ranking`, `manuscript`, `manuscript_file`, `page_ai_suggestion`.

Important foreign key constraint names for joined selects:

| From table           | Column               | Constraint                      | References                      |
| -------------------- | -------------------- | ------------------------------- | ------------------------------- |
| `notification`       | `user_id`            | `fk_notification_user`          | `users.user_id`                 |
| `series_member`      | `series_id`          | `fk_series_member_series`       | `series.series_id`              |
| `series_member`      | `user_id`            | `fk_series_member_user`         | `users.user_id`                 |
| `chapter`            | `series_id`          | `fk_chapter_series`             | `series.series_id`              |
| `page`               | `chapter_id`         | `fk_page_chapter`               | `chapter.chapter_id`            |
| `page_region`        | `page_id`            | `fk_page_region_page`           | `page.page_id`                  |
| `page_task`          | `page_id`            | `fk_page_task_page`             | `page.page_id`                  |
| `page_task`          | `assigned_by_id`     | `fk_page_task_assigned_by`      | `users.user_id`                 |
| `page_task`          | `region_id`          | `fk_page_task_region`           | `page_region.region_id`         |
| `page_task`          | `assistant_id`       | `fk_page_task_assistant`        | `users.user_id`                 |
| `page_version`       | `page_id`            | `fk_page_version_page`          | `page.page_id`                  |
| `page_submission`    | `page_id`            | `fk_page_submission_page`       | `page.page_id`                  |
| `page_submission`    | `task_id`            | `fk_page_submission_task`       | `page_task.task_id`             |
| `page_submission`    | `assistant_id`       | `fk_page_submission_assistant`  | `users.user_id`                 |
| `page_task_feedback` | `submission_id`      | `fk_feedback_submission`        | `page_submission.submission_id` |
| `page_task_feedback` | `mangaka_id`         | `fk_feedback_mangaka`           | `users.user_id`                 |
| `page_task_feedback` | `assistant_id`       | `fk_feedback_assistant`         | `users.user_id`                 |
| `annotation`         | `page_id`            | `fk_annotation_page`            | `page.page_id`                  |
| `annotation`         | `user_id`            | `fk_annotation_user`            | `users.user_id`                 |
| `annotation`         | `region_id`          | `fk_annotation_region`          | `page_region.region_id`         |
| `annotation`         | `task_id`            | `fk_annotation_task`            | `page_task.task_id`             |
| `review_session`     | `series_id`          | `fk_review_series`              | `series.series_id`              |
| `review_session`     | `chapter_id`         | `fk_review_chapter`             | `chapter.chapter_id`            |
| `review_session`     | `created_by_user_id` | `fk_review_created_by`          | `users.user_id`                 |
| `vote`               | `voter_id`           | `fk_vote_user`                  | `users.user_id`                 |
| `vote`               | `session_id`         | `fk_vote_session`               | `review_session.session_id`     |
| `series_ranking`     | `period_id`          | `fk_series_ranking_period`      | `ranking_period.period_id`      |
| `series_ranking`     | `series_id`          | `fk_series_ranking_series`      | `series.series_id`              |
| `chapter_ranking`    | `period_id`          | `fk_chapter_ranking_period`     | `ranking_period.period_id`      |
| `chapter_ranking`    | `series_id`          | `fk_chapter_ranking_series`     | `series.series_id`              |
| `chapter_ranking`    | `chapter_id`         | `fk_chapter_ranking_chapter`    | `chapter.chapter_id`            |
| `manuscript`         | `mangaka_id`         | `fk_manuscript_mangaka`         | `users.user_id`                 |
| `manuscript`         | `series_id`          | `fk_manuscript_series`          | `series.series_id`              |
| `manuscript`         | `chapter_id`         | `fk_manuscript_chapter`         | `chapter.chapter_id`            |
| `manuscript_file`    | `manuscript_id`      | `fk_manuscript_file_manuscript` | `manuscript.manuscript_id`      |
| `page_ai_suggestion` | `page_id`            | `fk_ai_suggestion_page`         | `page.page_id`                  |
| `page_ai_suggestion` | `region_id`          | `fk_ai_suggestion_region`       | `page_region.region_id`         |
| `page_ai_suggestion` | `task_id`            | `fk_ai_suggestion_task`         | `page_task.task_id`             |
| `page_ai_suggestion` | `requested_by_id`    | `fk_ai_suggestion_user`         | `users.user_id`                 |

When a table has multiple FKs to `users`, join with constraint names to avoid ambiguity:

```js
supabase.from("page_task").select(`
    *,
    page:page_id (*),
    region:region_id (*),
    assistant:assistant_id!fk_page_task_assistant (*),
    assigned_by:assigned_by_id!fk_page_task_assigned_by (*)
  `);
```

If Supabase rejects this syntax, use the constraint-only form:

```js
assistant:users!fk_page_task_assistant (*)
```

## API Implementation Checklist

Before writing a repository query:

1. Find the table in this file.
2. Use the exact primary key name.
3. Check required columns and defaults.
4. Check unique constraints to avoid duplicate inserts.
5. Check FK relationships in service before writes.
6. Validate status values with constants.
7. Update `updated_at` manually for update APIs.
8. For list APIs, prefer indexed filters where possible.
