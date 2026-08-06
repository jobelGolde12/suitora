import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { withApiRoute } from "@/lib/api/route";

const handler = toNextJsHandler(auth);

export const GET = withApiRoute(
  "/api/auth/*",
  async (req: Request, ctx: { params: Promise<{ all: string[] }> }) => {
    void ctx;
    return handler.GET(req);
  }
);
export const POST = withApiRoute(
  "/api/auth/*",
  async (req: Request, ctx: { params: Promise<{ all: string[] }> }) => {
    void ctx;
    return handler.POST(req);
  }
);
