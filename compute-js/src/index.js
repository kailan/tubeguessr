/// <reference types="@fastly/js-compute" />
import { PublisherServer } from "@fastly/compute-js-static-publish";
import { env } from "fastly:env";
import rc from "../static-publish.rc.js";
const publisherServer = PublisherServer.fromStaticPublishRc(rc);

async function handleRequest(event) {
  const request = event.request;

  // Handle apex requests
  if (request.headers.get("Host") === "tubeguessr.com") {
    // Redirect to the correct subdomain
    const url = new URL(request.url);
    url.hostname = "www.tubeguessr.com";
    url.protocol = "https";
    return Response.redirect(url, 301);
  }

  // Handle tile requests
  if (request.url.includes("/assets/vendor/tiles/")) {
    if (request.headers.get("Referer") !== "https://www.tubeguessr.com/" && env("FASTLY_HOSTNAME") !== "localhost") {
      return new Response("Forbidden", { status: 403 });
    }

    const url = new URL(request.url);
    url.pathname = url.pathname.replace("/assets/vendor/tiles/", "/styles/v1/kailan/clnmjy811006901qpergtfrho/tiles/512/");
    url.pathname += "@2x";
    url.search = "access_token=pk.eyJ1Ijoia2FpbGFuIiwiYSI6ImNreHh6MjNtNzJhd3oyb21wYjRkY2U0aGsifQ.tZzQ-GAom5_D8SLwrqmy-Q"
    request.url = url.toString();
    console.log("Tile request URL:", request.url);
    request.headers.set("Host", "api.mapbox.com");
    const response = await fetch(url, {
      backend: 'mapbox',
      headers: {
        "Host": "api.mapbox.com"
      }
    });
    ["alt-svc", "etag", "via", "x-amz-cf-id", "x-amz-cf-pop", "x-cache", "x-powered-by", "x-rate-limit-interval", "x-rate-limit-limit"].forEach(header => {
      response.headers.delete(header);
    });
    return response;
  }

  const response = await publisherServer.serveRequest(request);
  if (response != null) {
    // Cache the response for 30 minutes
    response.headers.set("Cache-Control", "public, max-age=3600, immutable");
    if (response.headers.get("Content-Type") === "text/html") {
      // Set the content security policy for HTML responses
      // Set performance and security headers
      response.headers.set("Alt-Svc", 'h3=":443";ma=86400,h3-29=":443";ma=86400,h3-27=":443";ma=86400');
      response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "SAMEORIGIN");
      response.headers.set("Referrer-Policy", "no-referrer");
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self';"
      );
    }
  }
  return response;
}

return new Response("Not found", { status: 404 });
}

// eslint-disable-next-line no-restricted-globals
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));
