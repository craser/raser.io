-- ABOUTME: One-time setup of the blog_publisher database role used by `npm run blog-post`.
-- ABOUTME: Run by hand in the CockroachDB Cloud SQL shell; grants only what publishing needs.
--
-- Create the role here in SQL, not with the Cloud Console's "Add user" button: users made in
-- the console are given admin rights.
--
-- Before running: generate a password in 1Password, put it in place of the placeholder below,
-- and run the statements. Do not commit the real password. Then store the connection string,
-- postgresql://blog_publisher:<password>@<host>:26257/defaultdb?sslmode=verify-full,
-- in the 1Password item as database_url.

CREATE USER IF NOT EXISTS blog_publisher WITH PASSWORD 'paste-the-generated-password-here';

GRANT SELECT, INSERT, UPDATE ON TABLE blog_entries TO blog_publisher;
GRANT SELECT, INSERT, DELETE ON TABLE attachments TO blog_publisher;
GRANT SELECT, INSERT ON TABLE tags TO blog_publisher;
GRANT SELECT, INSERT, DELETE ON TABLE tag_links TO blog_publisher;

-- CockroachDB's built-in `public` role, which every user inherits, can create tables in the
-- public schema by default. Remove that so blog_publisher holds only the grants above. Admin
-- users (the app's own user among them) are unaffected.
REVOKE CREATE ON SCHEMA public FROM public;
