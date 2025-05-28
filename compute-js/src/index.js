/// <reference types="@fastly/js-compute" />
import { PublisherServer } from "@fastly/compute-js-static-publish";
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

  const response = await publisherServer.serveRequest(request);
  if (response != null) {
    return response;
  }

  return new Response("Not found", { status: 404 });
}

// eslint-disable-next-line no-restricted-globals
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));
