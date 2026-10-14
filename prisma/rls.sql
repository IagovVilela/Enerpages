DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'enerpages_public') THEN
    CREATE ROLE enerpages_public LOGIN PASSWORD 'public_secret';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE enerpages TO enerpages_public;
GRANT USAGE ON SCHEMA public TO enerpages_public;

ALTER TABLE "Page" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Page" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS published_read ON "Page";
CREATE POLICY published_read ON "Page"
  FOR SELECT
  TO enerpages_public
  USING (status = 'PUBLISHED');

REVOKE ALL ON TABLE "Page" FROM enerpages_public;

DROP VIEW IF EXISTS "PublishedPage";
CREATE VIEW "PublishedPage" AS
SELECT
  id,
  slug,
  "customDomain",
  "clientName",
  segment,
  "publishedData",
  "publishedAt",
  "seoTitle",
  "seoDescription",
  archetype,
  "updatedAt"
FROM "Page"
WHERE status = 'PUBLISHED';

DROP VIEW IF EXISTS "PageState";
CREATE VIEW "PageState" AS
SELECT slug, status, "customDomain", "clientName"
FROM "Page";

GRANT SELECT ON "PublishedPage" TO enerpages_public;
GRANT SELECT ON "PageState" TO enerpages_public;
