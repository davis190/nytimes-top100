import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../lib/ddb";
import { json } from "../lib/response";

export async function listShows() {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "SHOW" },
      ScanIndexForward: true,
    })
  );

  const shows = (result.Items ?? []).map((item) => ({
    id: item.id,
    nytRank: item.nytRank,
    title: item.title,
    yearStart: item.yearStart,
    yearEnd: item.yearEnd ?? null,
    overview: item.overview ?? null,
    genres: item.genres ?? [],
    network: item.network ?? null,
    posterUrl: item.posterUrl ?? null,
    backdropUrl: item.backdropUrl ?? null,
    imdbId: item.imdbId ?? null,
    watchProviders: item.watchProviders ?? null,
    enrichedAt: item.enrichedAt ?? null,
  }));

  return json(200, { shows });
}
