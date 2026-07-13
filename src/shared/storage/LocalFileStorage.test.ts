import { describe, expect, it } from "vitest";
import { LocalFileStorage } from "@/shared/storage/LocalFileStorage";

describe("LocalFileStorage", () => {
  it("saves, reads, and deletes a file round-trip", async () => {
    const storage = new LocalFileStorage();
    const data = Buffer.from("hello export");
    const key = `test/${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const saved = await storage.save(key, data, "application/pdf");
    expect(saved.key).toBe(`${key}.pdf`);
    expect(saved.sizeBytes).toBe(data.byteLength);

    const read = await storage.read(saved.key);
    expect(read?.data.toString()).toBe("hello export");
    expect(read?.contentType).toBe("application/pdf");

    await storage.delete(saved.key);
    expect(await storage.read(saved.key)).toBeNull();
  });

  it("returns null for a missing key", async () => {
    const storage = new LocalFileStorage();
    expect(await storage.read("does-not-exist.png")).toBeNull();
  });
});
