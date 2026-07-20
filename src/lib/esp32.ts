// Direct HTTP client for the ESP32 relay board on the local network.
// Target: http://192.168.29.220
//
// IMPORTANT — CORS / mixed-content note:
//   Browsers block HTTP requests from HTTPS pages (mixed content). When
//   accessing this dashboard over HTTPS (e.g. via the Replit proxy), relay
//   commands will fail. To use relay control, open the dashboard directly
//   from your local network over HTTP, e.g. http://<your-machine-ip>:5000/
//
//   Your ESP32 firmware must also return the header:
//     Access-Control-Allow-Origin: *
//   on every response, otherwise the browser's CORS policy will block the
//   request even over HTTP.

export const ESP32_BASE = "http://192.168.29.220";
const TIMEOUT_MS = 5_000;

export type RelayId = 1 | 2 | 3 | 4;
export type RelayState = "on" | "off";

/**
 * Sends a relay command to the ESP32.
 * GET http://192.168.29.220/relay{id}/{state}
 * Throws on network error or non-2xx response.
 */
export async function setRelay(id: RelayId, state: RelayState): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ESP32_BASE}/relay${id}/${state}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`ESP32 returned HTTP ${res.status}`);
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Relay ${id} timed out — ESP32 at ${ESP32_BASE} did not respond within ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
