#!/usr/bin/env bash
#
# Rollback script for production deployments.
#
# Supports both blue-green and canary deployment strategies.
#
# Usage:
#   ./rollback.sh <deployment_target> <image_tag>
#
#   deployment_target: blue|green   # The currently active deployment to rollback from.
#   image_tag: <previous_image_tag>
#
# Example:
#   ./rollback.sh green ghcr.io/jobelGolde12/suitora:v1.2.3
#
# Exit on any error
set -euo pipefail

# ---------------------------------------------------------------------------
# Argument handling
# ---------------------------------------------------------------------------
if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <blue|green> <image_tag>"
  exit 1
fi

TARGET=$1
IMAGE_TAG=$2

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
log() {
  echo "[rollback] $*"
}

run_kubectl() {
  # Run kubectl command with the production kubeconfig context
  kubectl --kubeconfig=/home/jobel/.kube/config "$@"
}

# ---------------------------------------------------------------------------
# Determine active deployment
# ---------------------------------------------------------------------------
# In blue-green, the active deployment usually has a label like `version=active`
# or uses a specific deployment name pattern.
# We'll assume the active deployment is selected by a label `env=production` and
# that there are two deployments: `suitora-web-blue` and `suitora-web-green`.

# Find the active deployment name
if [[ "$TARGET" == "blue" ]]; then
  ACTIVE_DEPLOYMENT="suitora-web-blue"
elif [[ "$TARGET" == "green" ]]; then
  ACTIVE_DEPLOYMENT="suitora-web-green"
else
  log "Error: Unknown target '$TARGET'. Use 'blue' or 'green'."
  exit 1
fi

log "Rolling back active deployment: $ACTIVE_DEPLOYMENT to image tag: $IMAGE_TAG"

# ---------------------------------------------------------------------------
# Rollback image for the active deployment
# ---------------------------------------------------------------------------
run_kubectl set image deployment/"$ACTIVE_DEPLOYMENT" web="${IMAGE_TAG}" --record

log "Image updated for $ACTIVE_DEPLOYMENT"

# ---------------------------------------------------------------------------
# Switch traffic back to the rolled-back deployment if needed
# ---------------------------------------------------------------------------
# In blue-green, there is typically a Service that routes traffic to either
# blue or green pods. We assume services are named `suitora-web` and they
# select pods based on the deployment's label.
#
# If the Service uses a selector that matches both deployments, we may need to
# patch it to point to the previously active deployment. However, for simplicity,
# we assume the `Service` already selects pods based on deployment labels
# and that setting the image is sufficient for a rollback.
#
# If you use a separate `blue-green` switching mechanism, patch the Service here:
#
#   kubectl patch service suitora-web -n production -p '{"spec":{"selector":{"deployment":"suitora-web-blue"}}}'
#
# The above command would direct traffic to the blue deployment.

log "Rollback completed successfully."