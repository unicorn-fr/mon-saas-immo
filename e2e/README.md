# Parcours de bout en bout (Playwright)

Ces tests ouvrent un vrai navigateur et parcourent Bailio comme un propriétaire : pages publiques,
tunnel avec confirmation de l'email, liste « Il manque… », fiche du logement, signature électronique
complète (locataire, garant, propriétaire) et avenant.

Ils tournent **en local**, sur une base de test : ils créent des comptes et des baux.

## Lancer

```bash
# 1. Une base PostgreSQL de test (DATABASE_URL dans server/.env), puis :
npm --prefix server run db:migrate

# 2. L'API, sans service d'email : les emails (liens, codes) sont écrits dans son journal
npm --prefix server run dev > /tmp/bailio-api.log 2>&1 &

# 3. Le site
npm --prefix client run dev &

# 4. Les parcours (la première fois : npx --prefix e2e playwright install chromium)
npm --prefix e2e test
```

Variables utiles : `E2E_BASE` (site, `http://localhost:5173`), `E2E_API` (`http://localhost:5000/api`),
`E2E_API_LOG` (journal de l'API, `/tmp/bailio-api.log`), `CHROMIUM_PATH` (navigateur déjà installé).

Les captures d'écran sont écrites dans `e2e/captures/` (ignoré par git).
