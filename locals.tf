locals {
  apex_domain                 = "tubeguessr.com"
  www_domain                  = "www.${local.apex_domain}"
  gcp_project                 = "devchat-archive"
  fastly_tls_authority        = "certainly"
  fastly_tls_configuration_id = "rW5c1A7P13bA8wo6s03yxA" # HTTP/3 & TLS v1.3 + 0RTT
}
