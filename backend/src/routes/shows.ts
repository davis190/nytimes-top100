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
  }));

  return json(200, { shows });
}
