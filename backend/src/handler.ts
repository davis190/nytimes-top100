import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { listShows } from "./routes/shows";
import { getMyStatuses, putMyStatus } from "./routes/meStatuses";
import { listUsers, getUserStatuses } from "./routes/users";
import { compare } from "./routes/compare";
import { getCaller } from "./lib/auth";
import { json } from "./lib/response";

type Event = APIGatewayProxyEventV2 & Partial<APIGatewayProxyEventV2WithJWTAuthorizer>;

export async function handler(event: Event) {
  try {
    const routeKey = event.routeKey ?? "";

    switch (routeKey) {
      case "GET /shows":
        return await listShows();

      case "GET /me/statuses":
        return await getMyStatuses(getCaller(event as APIGatewayProxyEventV2WithJWTAuthorizer));

      case "PUT /me/statuses/{showId}": {
        const caller = getCaller(event as APIGatewayProxyEventV2WithJWTAuthorizer);
        const showId = event.pathParameters?.showId;
        if (!showId) return json(400, { message: "Missing showId" });
        const body = JSON.parse(event.body ?? "{}");
        return await putMyStatus(caller, showId, body.status);
      }

      case "GET /users":
        return await listUsers();

      case "GET /users/{userId}/statuses": {
        const userId = event.pathParameters?.userId;
        if (!userId) return json(400, { message: "Missing userId" });
        return await getUserStatuses(userId);
      }

      case "GET /compare/{userId}": {
        const caller = getCaller(event as APIGatewayProxyEventV2WithJWTAuthorizer);
        const userId = event.pathParameters?.userId;
        if (!userId) return json(400, { message: "Missing userId" });
        return await compare(caller, userId);
      }

      default:
        return json(404, { message: "Not found" });
    }
  } catch (err) {
    console.error(err);
    return json(500, { message: "Internal server error" });
  }
}
