import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../lib/ddb";
import { json } from "../lib/response";
import type { CallerIdentity } from "../lib/auth";
import { VALID_STATUSES, type ShowStatus } from "../lib/types";

const COUNT_FIELDS: Record<ShowStatus, string> = {
  seen_it: "seenItCount",
  seen_part_of_it: "seenPartCount",
  interested: "interestedCount",
  not_interested: "notInterestedCount",
};

async function ensureUserItem(caller: CallerIdentity) {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${caller.userId}`, SK: "META" },
      UpdateExpression:
        "SET displayName = if_not_exists(displayName, :name), GSI1PK = if_not_exists(GSI1PK, :gpk), " +
        "GSI1SK = if_not_exists(GSI1SK, :zero), seenItCount = if_not_exists(seenItCount, :zero), " +
        "seenPartCount = if_not_exists(seenPartCount, :zero), interestedCount = if_not_exists(interestedCount, :zero), " +
        "notInterestedCount = if_not_exists(notInterestedCount, :zero), joinedAt = if_not_exists(joinedAt, :now)",
      ExpressionAttributeValues: {
        ":name": caller.displayName,
        ":gpk": "USER",
        ":zero": 0,
        ":now": new Date().toISOString(),
      },
    })
  );
}

export async function getMyStatuses(caller: CallerIdentity) {
  await ensureUserItem(caller);

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": `USER#${caller.userId}`, ":prefix": "STATUS#" },
    })
  );

  const statuses = (result.Items ?? []).map((item) => ({
    showId: item.SK.replace("STATUS#", ""),
    status: item.status,
    updatedAt: item.updatedAt,
  }));

  return json(200, { statuses });
}

export async function putMyStatus(caller: CallerIdentity, showId: string, status: string) {
  if (!VALID_STATUSES.includes(status as ShowStatus)) {
    return json(400, { message: "Invalid status" });
  }

  await ensureUserItem(caller);

  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${caller.userId}`, SK: `STATUS#${showId}` },
    })
  );
  const previousStatus = existing.Item?.status as ShowStatus | undefined;
  const now = new Date().toISOString();

  const transactItems: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
    {
      Put: {
        TableName: TABLE_NAME,
        Item: { PK: `USER#${caller.userId}`, SK: `STATUS#${showId}`, status, updatedAt: now },
      },
    },
  ];

  if (previousStatus !== status) {
    const deltas: Record<string, number> = {};
    if (previousStatus) {
      const field = COUNT_FIELDS[previousStatus];
      deltas[field] = (deltas[field] ?? 0) - 1;
    }
    const field = COUNT_FIELDS[status as ShowStatus];
    deltas[field] = (deltas[field] ?? 0) + 1;
    if ("seenItCount" in deltas) {
      deltas.GSI1SK = deltas.seenItCount;
    }

    const fieldNames = Object.keys(deltas);
    const setExpr = fieldNames
      .map((f, i) => `${f} = if_not_exists(${f}, :zero) + :d${i}`)
      .join(", ");
    const values: Record<string, number> = { ":zero": 0 };
    fieldNames.forEach((f, i) => {
      values[`:d${i}`] = deltas[f];
    });

    transactItems.push({
      Update: {
        TableName: TABLE_NAME,
        Key: { PK: `USER#${caller.userId}`, SK: "META" },
        UpdateExpression: `SET ${setExpr}`,
        ExpressionAttributeValues: values,
      },
    });
  }

  await ddb.send(new TransactWriteCommand({ TransactItems: transactItems }));
  return json(200, { showId, status });
}
