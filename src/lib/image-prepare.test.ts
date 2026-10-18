import { describe, expect, it } from "vitest";
import { prepareImageFile } from "@/lib/image-prepare";

describe("prepareImageFile", () => {
  it("não altera vídeo ou gif", async () => {
    const video = new File([new Uint8Array([0, 1, 2])], "clip.mp4", { type: "video/mp4" });
    expect(await prepareImageFile(video)).toBe(video);
    const gif = new File([new Uint8Array([0, 1, 2])], "a.gif", { type: "image/gif" });
    expect(await prepareImageFile(gif)).toBe(gif);
  });
});
