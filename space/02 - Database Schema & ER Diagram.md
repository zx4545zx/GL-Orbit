GL-Orbit: Database Architecture

แผนผังฐานข้อมูลนี้ออกแบบมาเพื่อรองรับความยืดหยุ่นสูงสุด (Normalization) และมาตรฐาน Audit Trail

ER Diagram (Mermaid)

erDiagram
    USERS {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar display_name
        text avatar_url
        varchar password_hash
        varchar role "ADMIN | USER"
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        timestamp expires_at
        timestamp created_at
    }

    STUDIOS {
        uuid id PK
        varchar name
        text logo_url
        text official_site
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    PLATFORMS {
        uuid id PK
        varchar name
        text logo_url
        text base_url
        timestamp deleted_at
    }

    ARTISTS {
        uuid id PK
        varchar nickname
        varchar full_name
        text profile_image_url
        timestamp deleted_at
    }

    ARTIST_SOCIALS {
        uuid id PK
        uuid artist_id FK
        varchar platform
        text url
        text icon_url
    }

    SERIES {
        uuid id PK
        uuid studio_id FK
        varchar title_th
        varchar title_en
        text poster_url
        varchar status "UPCOMING | ONGOING | ENDED"
        timestamp deleted_at
    }

    SERIES_ARTISTS {
        uuid series_id PK,FK
        uuid artist_id PK,FK
        varchar role_name
    }

    SERIES_SCHEDULES {
        uuid id PK
        uuid series_id FK
        uuid platform_id FK
        int day_of_week "0-6"
        time air_time
        boolean is_uncut
    }

    EPISODES {
        uuid id PK
        uuid series_id FK
        int episode_number
        varchar title
        text cover_url
        text trailer_url
        timestamp deleted_at
    }

    EPISODE_SCHEDULES {
        uuid id PK
        uuid episode_id FK
        uuid platform_id FK
        timestamptz air_date
        text stream_link
        boolean is_uncut
        timestamp deleted_at
    }

    USERS ||--o{ SESSIONS : "has"
    USERS ||--o{ STUDIOS : "creates"
    STUDIOS ||--o{ SERIES : "produces"
    SERIES ||--o{ EPISODES : "has"
    SERIES ||--o{ SERIES_ARTISTS : "features"
    ARTISTS ||--o{ SERIES_ARTISTS : "acts_in"
    ARTISTS ||--o{ ARTIST_SOCIALS : "has_socials"
    SERIES ||--o{ SERIES_SCHEDULES : "recurring"
    EPISODES ||--o{ EPISODE_SCHEDULES : "actual"
    PLATFORMS ||--o{ SERIES_SCHEDULES : "hosts"
    PLATFORMS ||--o{ EPISODE_SCHEDULES : "streams"


Data Principles

ID Strategy: ใช้ UUID v4 ทุกตาราง (defaultRandom())

Audit Fields: ทุกตารางหลักมี created_at, updated_at, และ deleted_at (Soft Delete)

Time Strategy: ใช้ timestamptz สำหรับวันฉายจริง เพื่อให้ระบบคำนวณตาม Timezone ของผู้ใช้ได้ถูกต้อง

Session Security: เก็บ SHA-256 hash ของ JWT token ไม่ใช่ token ดิบ
