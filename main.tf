# the Fastly service is managed by js-compute-static-publish (see ./compute-js directory)
# terraform is just responsible for DNS and TLS configuration

resource "google_dns_managed_zone" "zone" {
  name        = "tubeguessr"
  dns_name    = format("%s.", local.apex_domain)
  description = "Terraform managed zone for Tubeguessr"
}

data "fastly_tls_configuration" "config" {
  id = local.fastly_tls_configuration_id
}

resource "fastly_tls_subscription" "tls" {
  domains               = [local.www_domain, local.apex_domain]
  configuration_id      = data.fastly_tls_configuration.config.id
  certificate_authority = local.fastly_tls_authority
}

resource "google_dns_record_set" "domain_validation" {
  for_each = {
    for domain in fastly_tls_subscription.tls.domains :
    replace(domain, "*.", "") => element([
      for obj in fastly_tls_subscription.tls.managed_dns_challenges :
      obj if obj.record_name == "_acme-challenge.${replace(domain, "*.", "")}"
    ], 0)...
  }

  name = "${each.value[0].record_name}."
  type = each.value[0].record_type
  ttl  = 300

  managed_zone = google_dns_managed_zone.zone.name

  rrdatas = [format("${each.value[0].record_value}.")]
}

resource "google_dns_record_set" "apex_v4" {
  name = "${local.apex_domain}."
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.zone.name

  rrdatas = [for dns_record in data.fastly_tls_configuration.config.dns_records : dns_record.record_value if dns_record.record_type == "A"]
}

resource "google_dns_record_set" "www" {
  name = "${local.www_domain}."
  type = "CNAME"
  ttl  = 300

  managed_zone = google_dns_managed_zone.zone.name

  rrdatas = [for dns_record in data.fastly_tls_configuration.config.dns_records : "${dns_record.record_value}." if dns_record.record_type == "CNAME"]
}
