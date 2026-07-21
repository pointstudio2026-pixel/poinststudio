import { beforeEach, describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";

const sendMock = vi.fn();

class FakeS3Client {
  send = sendMock;
}

class FakeCommand {
  input: unknown;
  constructor(input: unknown) {
    this.input = input;
  }
}

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: FakeS3Client,
  PutObjectCommand: FakeCommand,
  GetObjectCommand: FakeCommand,
  DeleteObjectCommand: FakeCommand,
}));

const { S3FileStorage } = await import("@/shared/storage/S3FileStorage");

beforeEach(() => {
  sendMock.mockReset();
});

function buildStorage() {
  return new S3FileStorage({
    endpoint: "https://example.r2.cloudflarestorage.com",
    region: "auto",
    bucket: "test-bucket",
    accessKeyId: "key",
    secretAccessKey: "secret",
  });
}

describe("S3FileStorage", () => {
  it("uploads with a content-type-derived extension", async () => {
    sendMock.mockResolvedValueOnce({});
    const storage = buildStorage();

    const saved = await storage.save("exports/abc", Buffer.from("hi"), "application/pdf");

    expect(saved.key).toBe("exports/abc.pdf");
    expect(saved.sizeBytes).toBe(2);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ Bucket: "test-bucket", Key: "exports/abc.pdf" }) }),
    );
  });

  it("reads back a stored object and infers content-type from its extension", async () => {
    sendMock.mockResolvedValueOnce({ Body: Readable.from([Buffer.from("hello")]) });
    const storage = buildStorage();

    const result = await storage.read("exports/abc.pdf");

    expect(result?.data.toString()).toBe("hello");
    expect(result?.contentType).toBe("application/pdf");
  });

  it("returns null when the object doesn't exist (LocalFileStorage와 동일 계약)", async () => {
    const notFound = new Error("not found");
    notFound.name = "NoSuchKey";
    sendMock.mockRejectedValueOnce(notFound);
    const storage = buildStorage();

    expect(await storage.read("missing.png")).toBeNull();
  });

  it("re-throws unexpected errors instead of swallowing them", async () => {
    sendMock.mockRejectedValueOnce(new Error("network down"));
    const storage = buildStorage();

    await expect(storage.read("exports/abc.pdf")).rejects.toThrow("network down");
  });

  it("deletes an object", async () => {
    sendMock.mockResolvedValueOnce({});
    const storage = buildStorage();

    await storage.delete("exports/abc.pdf");

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ Bucket: "test-bucket", Key: "exports/abc.pdf" }) }),
    );
  });
});
