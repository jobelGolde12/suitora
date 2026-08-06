import { apiOk } from "@/lib/api/response";
import { withApiRoute } from "@/lib/api/route";

export const GET = withApiRoute("/api/health", async () => {
  return apiOk({ status: "ok" }, "Healthy");
});
