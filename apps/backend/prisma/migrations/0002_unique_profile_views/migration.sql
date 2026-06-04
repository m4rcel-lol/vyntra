WITH ranked_views AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "profileId", "visitorHash"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rank
  FROM "ProfileView"
)
DELETE FROM "ProfileView"
USING ranked_views
WHERE "ProfileView".id = ranked_views.id
  AND ranked_views.rank > 1;

UPDATE "Profile"
SET "viewCount" = unique_views.count
FROM (
  SELECT "profileId", COUNT(*)::int AS count
  FROM "ProfileView"
  GROUP BY "profileId"
) AS unique_views
WHERE "Profile".id = unique_views."profileId";

UPDATE "Profile"
SET "viewCount" = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM "ProfileView"
  WHERE "ProfileView"."profileId" = "Profile".id
);

CREATE UNIQUE INDEX "ProfileView_profileId_visitorHash_key" ON "ProfileView"("profileId", "visitorHash");
