#!/bin/bash
BACKEND_URL="${1:-https://votre-app.railway.app}"

echo "=== Test connectivité Bailio ==="
echo "Backend: $BACKEND_URL"
echo ""

# Health check
echo -n "Backend /health : "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
[ "$STATUS" = "200" ] && echo "✅ $STATUS" || echo "❌ $STATUS"

# CORS
echo -n "CORS depuis Vercel : "
CORS=$(curl -s -I -H "Origin: https://bailio.vercel.app" "$BACKEND_URL/health" | grep -i "access-control")
[ -n "$CORS" ] && echo "✅ OK" || echo "❌ Headers CORS manquants"

# Auth endpoint
echo -n "Route auth accessible : "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}')
[ "$STATUS" = "401" ] && echo "✅ $STATUS (401 attendu)" || echo "⚠️  $STATUS"

# Properties endpoint (public)
echo -n "Route properties publique : "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/properties")
[ "$STATUS" = "200" ] && echo "✅ $STATUS" || echo "⚠️  $STATUS"

# Auth required route (should return 401)
echo -n "Auth middleware actif : "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/contracts")
[ "$STATUS" = "401" ] && echo "✅ $STATUS (401 attendu)" || echo "⚠️  $STATUS"

echo ""
echo "=== Fin des tests ==="
