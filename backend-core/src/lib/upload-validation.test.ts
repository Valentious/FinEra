import { describe, expect, it } from "vitest";
import { extensionForMime } from "./upload-validation.js";

describe("upload-validation", () => {
  it("maps allowed MIME types to extensions", () => {
    expect(extensionForMime("application/pdf")).toBe(".pdf");
    expect(extensionForMime("image/png")).toBe(".png");
    expect(extensionForMime("image/jpeg")).toBe(".jpg");
  });
});
