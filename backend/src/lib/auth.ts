import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

export interface CallerIdentity {
  userId: string;
  email?: string;
  displayName: string;
}

export function getCaller(event: APIGatewayProxyEventV2WithJWTAuthorizer): CallerIdentity {
  const claims = event.requestContext.authorizer.jwt.claims;
  const userId = String(claims.sub);
  const email = claims.email ? String(claims.email) : undefined;
  const name = claims.name ? String(claims.name) : undefined;
  return { userId, email, displayName: name || email || userId };
}
