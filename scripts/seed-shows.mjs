import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const stackName = process.argv[2];
if (!stackName) {
  console.error("Usage: node seed-shows.mjs <stack-name>");
  process.exit(1);
}

const cfn = new CloudFormationClient({});
const { Stacks } = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
const tableName = Stacks?.[0]?.Outputs?.find((o) => o.OutputKey === "TableName")?.OutputValue;

if (!tableName) {
  console.error(`Could not resolve TableName output from stack ${stackName}`);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shows = JSON.parse(readFileSync(path.join(__dirname, "..", "data", "shows.json"), "utf8"));

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const chunks = [];
for (let i = 0; i < shows.length; i += 25) chunks.push(shows.slice(i, i + 25));

for (const chunk of chunks) {
  await ddb.send(
    new BatchWriteCommand({
      RequestItems: {
        [tableName]: chunk.map((show) => ({
          PutRequest: {
            Item: {
              PK: `SHOW#${show.id}`,
              SK: "META",
              GSI1PK: "SHOW",
              GSI1SK: show.nytRank,
              id: show.id,
              nytRank: show.nytRank,
              title: show.title,
              yearStart: show.yearStart,
              yearEnd: show.yearEnd,
            },
          },
        })),
      },
    })
  );
}

console.log(`Seeded ${shows.length} shows into ${tableName}`);
