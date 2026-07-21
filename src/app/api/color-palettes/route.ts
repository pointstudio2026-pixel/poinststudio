import { apiSuccess, toApiError } from "@/shared/http/response";
import { colorPalettesContainer } from "@/modules/colorPalettes/container";

export async function GET() {
  try {
    const palettes = colorPalettesContainer.listColorPalettesUseCase.execute();
    return apiSuccess({ palettes });
  } catch (err) {
    return toApiError(err);
  }
}
