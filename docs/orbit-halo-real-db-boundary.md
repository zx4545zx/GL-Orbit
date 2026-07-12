# Orbit Halo real-database boundary

Moment schema and migration exist locally only. This work does not run `db:push`, apply a migration, or change Neon.

Unit and handler tests mock the Neon HTTP client. They verify payload guards, access control, query orchestration, and that moderation writes are submitted as one Neon HTTP transaction. They cannot verify PostgreSQL constraints, partial indexes, concurrent counter updates, or transaction rollback.

Before release, run disposable PostgreSQL integration coverage for the generated Moment migration and concurrent mutation cases. Then apply the reviewed migration through the deployment migration process; do not use production Neon as test infrastructure.
