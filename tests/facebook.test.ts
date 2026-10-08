import { describe, expect, it } from "vitest";
import { facebookPostUrl, isFacebookImage, parsePreview } from "@/lib/facebook";

describe("facebookPostUrl", () => {
  it("accepts facebook post links and drops tracking", () => {
    expect(facebookPostUrl("https://m.facebook.com/1shot/posts/123?__cft__=x&mibextid=y#a")).toBe("https://www.facebook.com/1shot/posts/123");
    expect(facebookPostUrl("https://www.facebook.com/permalink.php?story_fbid=55&id=7&ref=share")).toBe("https://www.facebook.com/permalink.php?story_fbid=55&id=7");
    expect(facebookPostUrl("https://fb.watch/abc/")).toBe("https://fb.watch/abc/");
  });
  it("rejects other hosts and plain http", () => {
    expect(facebookPostUrl("https://facebook.com.evil.io/x")).toBeNull();
    expect(facebookPostUrl("http://www.facebook.com/x")).toBeNull();
    expect(facebookPostUrl("not a url")).toBeNull();
  });
});

describe("isFacebookImage", () => {
  it("only allows Facebook image servers", () => {
    expect(isFacebookImage("https://scontent.fbkk1-1.fna.fbcdn.net/v/t39/a.jpg?oe=1")).toBe(true);
    expect(isFacebookImage("https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1")).toBe(true);
    expect(isFacebookImage("https://evil.com/fbcdn.net.jpg")).toBe(false);
    expect(isFacebookImage("http://scontent.fbcdn.net/a.jpg")).toBe(false);
  });
});

describe("parsePreview", () => {
  it("reads og tags, decodes entities and keeps image order", () => {
    const html = `<head>
      <meta property="og:title" content="Jr 1Shot &amp; ทีม" />
      <meta property="og:description" content='ผลงานสมาชิก &#x1F525; &quot;จริง&quot;' />
      <meta property="og:image" content="https://scontent.fbcdn.net/a.jpg" />
      <meta property="og:image" content="https://scontent.fbcdn.net/b.jpg" />
      <meta property="og:image" content="https://scontent.fbcdn.net/a.jpg" />
      <meta name="twitter:image" content="http://insecure.example/c.jpg" /></head>`;
    expect(parsePreview(html)).toEqual({
      title: "Jr 1Shot & ทีม",
      description: 'ผลงานสมาชิก 🔥 "จริง"',
      images: ["https://scontent.fbcdn.net/a.jpg", "https://scontent.fbcdn.net/b.jpg"],
    });
  });
});
