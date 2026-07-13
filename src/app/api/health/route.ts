import { apiSuccess } from "@/shared/http/response";

export function GET() {
  return apiSuccess({ status: "ok" });
}
