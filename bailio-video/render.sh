#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# render.sh — Bailio Video Render Script
# Crée un dossier horodaté et rend toutes les compositions Remotion en 4K/8K.
# Usage : ./render.sh [4k|8k|all]
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

QUALITY="${1:-4k}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
OUT_DIR="../client/public/videos/${TIMESTAMP}"

mkdir -p "$OUT_DIR"
echo ""
echo "┌─────────────────────────────────────────────────────"
echo "│  Bailio Video Render — ${TIMESTAMP}"
echo "│  Qualité: ${QUALITY} → ${OUT_DIR}"
echo "└─────────────────────────────────────────────────────"
echo ""

render_video() {
  local COMP="$1"
  local OUT="$2"
  echo "▶ Rendering ${COMP} → ${OUT}"
  npx remotion render "${COMP}" "${OUT_DIR}/${OUT}" --overwrite
  SIZE=$(du -sh "${OUT_DIR}/${OUT}" 2>/dev/null | cut -f1)
  echo "✓ ${OUT} — ${SIZE}"
  echo ""
}

case "$QUALITY" in
  "8k")
    render_video "BailioShowcase8K" "BailioShowcase_8K_${TIMESTAMP}.mp4"
    render_video "BailioMain8K"     "BailioMain_8K_${TIMESTAMP}.mp4"
    render_video "BailioVertical"   "BailioVertical_${TIMESTAMP}.mp4"
    ;;
  "4k"|*)
    render_video "BailioShowcase4K" "BailioShowcase_4K_${TIMESTAMP}.mp4"
    render_video "BailioMain4K"     "BailioMain_4K_${TIMESTAMP}.mp4"
    render_video "BailioVertical"   "BailioVertical_${TIMESTAMP}.mp4"
    ;;
esac

echo "═══════════════════════════════════════════════════════"
echo "  Tous les fichiers sont dans :"
echo "  ${OUT_DIR}"
echo "═══════════════════════════════════════════════════════"
ls -lh "${OUT_DIR}"
