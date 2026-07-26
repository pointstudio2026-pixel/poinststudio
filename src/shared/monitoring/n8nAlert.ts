import { logger } from "@/shared/logging/logger";

/**
 * n8n(Railway 자체 호스팅) 웹훅으로 이벤트를 실시간으로 쏘는 fire-and-forget
 * 헬퍼. 알림 전송 실패가 실제 요청/응답 흐름을 절대 막거나 깨서는 안 되므로
 * 호출부에서 await하지 않고, 내부에서도 예외를 삼킨다. 웹훅 URL이 설정 안
 * 되어 있으면(로컬 개발 등) 조용히 스킵한다.
 */
export function sendN8nAlert(webhookUrl: string | undefined, payload: Record<string, unknown>): void {
  if (!webhookUrl) return;

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    logger.warn("n8n webhook alert failed", {
      webhookUrl,
      error: err instanceof Error ? err.message : String(err),
    });
  });
}
