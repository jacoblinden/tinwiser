# One-off adoption of existing prod resources into fresh remote state.
# Safe to delete after the first successful apply.
import {
  to = google_project_service.compute
  id = "tinwiser/compute.googleapis.com"
}
import {
  to = google_project_service.storage
  id = "tinwiser/storage.googleapis.com"
}
import {
  to = google_storage_bucket.website
  id = "tinwiser_tf_state"
}
import {
  to = google_storage_bucket_iam_member.public_read
  id = "b/tinwiser_tf_state roles/storage.objectViewer allUsers"
}
import {
  to = google_compute_global_address.lb_ip
  id = "projects/tinwiser/global/addresses/tinwiser-website-ip"
}
import {
  to = google_compute_backend_bucket.website
  id = "projects/tinwiser/global/backendBuckets/tinwiser-website-backend"
}
import {
  to = google_compute_url_map.website
  id = "projects/tinwiser/global/urlMaps/tinwiser-website-map"
}
import {
  to = google_compute_managed_ssl_certificate.website[0]
  id = "projects/tinwiser/global/sslCertificates/tinwiser-website-cert"
}
import {
  to = google_compute_target_https_proxy.website[0]
  id = "projects/tinwiser/global/targetHttpsProxies/tinwiser-website-https-proxy"
}
import {
  to = google_compute_url_map.http_redirect[0]
  id = "projects/tinwiser/global/urlMaps/tinwiser-website-http-redirect"
}
import {
  to = google_compute_target_http_proxy.http_redirect_proxy[0]
  id = "projects/tinwiser/global/targetHttpProxies/tinwiser-website-http-redirect-proxy"
}
import {
  to = google_compute_global_forwarding_rule.https[0]
  id = "projects/tinwiser/global/forwardingRules/tinwiser-website-https"
}
import {
  to = google_compute_global_forwarding_rule.http[0]
  id = "projects/tinwiser/global/forwardingRules/tinwiser-website-http"
}
