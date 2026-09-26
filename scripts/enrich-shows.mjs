import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const stackName = process.argv[2];
if (!stackName) {
  console.error("Usage: node enrich-shows.mjs <stack-name>");
  process.exit(1);
}

const TMDB_SECRET_NAME = process.env.TMDB_SECRET_NAME ?? "nyt100/tmdb";
const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_SIZE = "w500";
const BACKDROP_SIZE = "w1280";
const LOGO_SIZE = "w92";

const cfn = new CloudFormationClient({});
const { Stacks } = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
const tableName = Stacks?.[0]?.Outputs?.find((o) => o.OutputKey === "TableName")?.OutputValue;
if (!tableName) {
  console.error(`Could not resolve TableName output from stack ${stackName}`);
  process.exit(1);
}

const secretsClient = new SecretsManagerClient({});
const secretRes = await secretsClient.send(new GetSecretValueCommand({ SecretId: TMDB_SECRET_NAME }));
const { apiKey } = JSON.parse(secretRes.SecretString);
if (!apiKey) {
  console.error(`Secret ${TMDB_SECRET_NAME} is missing "apiKey"`);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shows = JSON.parse(readFileSync(path.join(__dirname, "..", "data", "shows.json"), "utf8"));

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tmdbGet(pathAndQuery) {
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  const res = await fetch(`${TMDB_BASE}${pathAndQuery}${sep}api_key=${apiKey}`);
  if (!res.ok) throw new Error(`TMDb request failed (${res.status}): ${pathAndQuery.split("?")[0]}`);
  return res.json();
}

function searchTitle(title) {
  // NYT list titles sometimes append a season qualifier for anthology shows
  // (e.g. "True Detective (Season 1)") that TMDb doesn't include in its own title.
  return title.replace(/\s*\(season\s+\d+\)\s*$/i, "");
}

async function findTmdbMatch(show) {
  const query = searchTitle(show.title);
  const search = await tmdbGet(`/search/tv?query=${encodeURIComponent(query)}`);
  const results = search.results ?? [];
  if (results.length === 0) return null;

  const yearOf = (r) => (r.first_air_date ? Number(r.first_air_date.slice(0, 4)) : null);
  const yearMatches = (r) => {
    const year = yearOf(r);
    return year !== null && Math.abs(year - show.yearStart) <= 1;
  };
  const titleMatches = (r) => r.name.trim().toLowerCase() === query.trim().toLowerCase();

  // Prefer an exact title match over a loose year-proximity match - a popular
  // same-era show with a similar title (e.g. "2 Broke Girls" vs "Girls") can
  // otherwise outrank the actual show since search results are popularity-sorted.
  return (
    results.find((r) => titleMatches(r) && yearMatches(r)) ??
    results.find((r) => titleMatches(r)) ??
    results.find((r) => yearMatches(r)) ??
    results[0]
  );
}

function mapProviderList(list) {
  return (list ?? []).map((p) => ({
    name: p.provider_name,
    logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/${LOGO_SIZE}${p.logo_path}` : null,
  }));
}

async function enrichOne(show) {
  const match = await findTmdbMatch(show);
  if (!match) {
    console.warn(`  no TMDb match for "${show.title}" (${show.yearStart}) - skipping`);
    return null;
  }

  const [details, providers] = await Promise.all([
    tmdbGet(`/tv/${match.id}?append_to_response=external_ids`),
    tmdbGet(`/tv/${match.id}/watch/providers`),
  ]);

  const us = providers.results?.US;
  const watchProviders = us
    ? {
        link: us.link ?? null,
        flatrate: mapProviderList(us.flatrate),
        rent: mapProviderList(us.rent),
        buy: mapProviderList(us.buy),
      }
    : null;

  return {
    tmdbId: details.id,
    overview: details.overview || null,
    genres: (details.genres ?? []).map((g) => g.name),
    network: details.networks?.[0]?.name ?? null,
    posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${details.poster_path}` : null,
    backdropUrl: details.backdrop_path
      ? `https://image.tmdb.org/t/p/${BACKDROP_SIZE}${details.backdrop_path}`
      : null,
    imdbId: details.external_ids?.imdb_id ?? null,
    watchProviders,
    enrichedAt: new Date().toISOString(),
  };
}

let enriched = 0;
let skipped = 0;

for (const show of shows) {
  try {
    const data = await enrichOne(show);
    if (!data) {
      skipped++;
      continue;
    }

    await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { PK: `SHOW#${show.id}`, SK: "META" },
        UpdateExpression:
          "SET tmdbId = :tmdbId, overview = :overview, genres = :genres, network = :network, " +
          "posterUrl = :posterUrl, backdropUrl = :backdropUrl, imdbId = :imdbId, " +
          "watchProviders = :watchProviders, enrichedAt = :enrichedAt",
        ExpressionAttributeValues: {
          ":tmdbId": data.tmdbId,
          ":overview": data.overview,
          ":genres": data.genres,
          ":network": data.network,
          ":posterUrl": data.posterUrl,
          ":backdropUrl": data.backdropUrl,
          ":imdbId": data.imdbId,
          ":watchProviders": data.watchProviders,
          ":enrichedAt": data.enrichedAt,
        },
      })
    );
    enriched++;
  } catch (err) {
    console.warn(`  failed to enrich "${show.title}": ${err.message}`);
    skipped++;
  }

  await sleep(150);
}

console.log(`Enriched ${enriched}/${shows.length} shows (${skipped} skipped) in ${tableName}`);
