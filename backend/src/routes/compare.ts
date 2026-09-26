import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../lib/ddb";
import { json } from "../lib/response";
import type { CallerIdentity } from "../lib/auth";

async function fetchStatuses(userId: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":prefix": "STATUS#" },
    })
  );
  return (result.Items ?? []).map((item) => ({
    showId: item.SK.replace("STATUS#", "") as string,
    status: item.status as string,
  }));
}

export async function compare(caller: CallerIdentity, targetUserId: string) {
  const [mine, theirs] = await Promise.all([
    fetchStatuses(caller.userId),
    fetchStatuses(targetUserId),
  ]);

  const mineMap = new Map(mine.map((s) => [s.showId, s.status]));
  const theirsMap = new Map(theirs.map((s) => [s.showId, s.status]));
  const allShowIds = new Set([...mineMap.keys(), ...theirsMap.keys()]);

  let bothSeen = 0;
  let matching = 0;
  for (const showId of allShowIds) {
    const a = mineMap.get(showId);
    const b = theirsMap.get(showId);
    if (a === "seen_it" && b === "seen_it") bothSeen++;
    if (a && b && a === b) matching++;
  }

  return json(200, {
    mine,
    theirs,
    summary: { bothSeen, matching, totalCompared: allShowIds.size },
  });
}
