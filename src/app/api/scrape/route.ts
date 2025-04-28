import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the URL content
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Create a clean version for text extraction
    const $clean = cheerio.load(html);
    $clean("script, style, meta, link, noscript").remove();

    // Extract text content
    const title = $clean("title").text().trim();
    const bodyText = $clean("body")
      .text()
      .trim()
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .replace(/\n+/g, "\n"); // Replace multiple newlines with a single newline

    // Clean the HTML for iframe display (remove scripts for security)
    $("script").remove();
    
    // Modify links to open in new tabs and add noopener for security
    $("a").attr("target", "_blank").attr("rel", "noopener noreferrer");
    
    // Get the sanitized HTML
    const cleanHtml = $.html();

    return NextResponse.json({
      title,
      content: bodyText,
      html: cleanHtml,
      url,
    });
  } catch (error) {
    console.error("Error scraping URL:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to scrape URL";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
