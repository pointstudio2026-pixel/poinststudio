import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/auth/session";
import { toApiError } from "@/shared/http/response";
import { exportsContainer } from "@/modules/exports/container";

interface RouteParams {
  params: Promise<{ exportId: string }>;
}

/**
 * Streams the exported file directly rather than a Signed URL -- the
 * session-authenticated ownership check on every request stands in for
 * "signing" since there's no real Object Storage provider configured yet.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { exportId } = await params;
    const file = await exportsContainer.downloadExportUseCase.execute({ exportId, userId: session.sub });

    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.fileKey.split("/").pop()}"`,
      },
    });
  } catch (err) {
    return toApiError(err);
  }
}
