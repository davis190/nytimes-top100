import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../lib/ddb";
import { json } from "../lib/response";

export async function listUsers() {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "USER" },
      ScanIndexForward: false,
    })
  );

  const users = (result.Items ?? []).map((item) => ({
    userId: String(item.PK).replace("USER#", ""),
    displayName: item.displayName,
    seenItCount: item.seenItCount ?? 0,
    seenPartCount: item.seenPartCount ?? 0,
    interestedCount: item.interestedCount ?? 0,
    notInterestedCount: item.notInterestedCount ?? 0,
    joinedAt: item.joinedAt,
  }));

  return json(200, { users });
}

export async function getUserStatuses(userId: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":prefix": "STATUS#" },
    })
  );

  const statuses = (result.Items ?? []).map((item) => ({
    showId: item.SK.replace("STATUS#", ""),
    status: item.status,
    updatedAt: item.updatedAt,
  }));

  return json(200, { statuses });
}
