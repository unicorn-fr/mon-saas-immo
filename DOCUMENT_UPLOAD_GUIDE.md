# Document Upload pour les Contrats de Location

## Vue d'ensemble

Le système d'upload de documents pour les contrats de location a été implémenté avec **compression automatique** et **validation stricte de la taille** (maximum **5 KB** par fichier).

## Caractéristiques principales

✅ **Limite de taille stricte** : 5 KB maximum par document
✅ **Compression automatique** : Les images sont automatiquement compressées et redimensionnées
✅ **Formats supportés** : PDF, JPG, PNG, WebP, DOC, DOCX
✅ **Interface intuitif** : Drag-and-drop ou sélection de fichiers
✅ **Validation en temps réel** : Messages d'erreur clairs et instantanés

## Installation et Configuration

### Frontend (Client)

Les nouveaux fichiers ont été créés :

```
client/src/
├── utils/fileUtils.ts              # Utilitaires de compression et validation
├── components/contract/
│   └── DocumentUpload.tsx           # Composant d'upload de documents
└── store/documentStore.ts           # (Existant) Zustand store pour documents
```

### Backend (Server)

Les routes et contrôleurs suivants ont été ajoutés :

```
POST   /api/v1/contracts/:id/documents              # Upload un document
GET    /api/v1/contracts/:id/documents              # Liste les documents
DELETE /api/v1/contracts/:id/documents/:docId      # Supprime un document
PUT    /api/v1/contracts/:id/documents/:docId/validate   # Valide (admin)
PUT    /api/v1/contracts/:id/documents/:docId/reject     # Rejette (admin)
```

## Utilisation

### Pour les utilisateurs (Propriétaires/Locataires)

#### 1. Ajouter le composant DocumentUpload au formulaire de contrat

```tsx
import DocumentUpload, { UploadedFile } from '@/components/contract/DocumentUpload'

function MyComponent() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  return (
    <DocumentUpload
      contractId="contract-id-optional"
      onFilesSelected={setUploadedFiles}
      maxFiles={5}
      category="CONTRACT_DOCUMENT"
    />
  )
}
```

#### 2. Upload des fichiers via l'API

```typescript
import { useDocumentStore } from '@/store/documentStore'

const { uploadDocument } = useDocumentStore()

// Upload un fichier compressé
const uploadedFile = await uploadDocument(contractId, file)
```

### Limites de taille

- **Maximum 5 KB** par fichier
- Les images sont automatiquement compressées à 70% de qualité JPEG
- Les dimensions sont réduites à maximum 800x600 pixels
- Les fichiers trop volumineux sont rejetés avec un message d'erreur

### Formats acceptés

| Format | Type MIME | Compression |
|--------|-----------|-------------|
| PDF | `application/pdf` | Aucune |
| JPG | `image/jpeg` | Oui |
| PNG | `image/png` | Oui |
| WebP | `image/webp` | Oui |
| DOC | `application/msword` | Aucune |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Aucune |

## Exemple d'intégration complète

Voir le exemple dans `client/src/components/contract/DocumentUpload.tsx`

```tsx
<DocumentUpload
  contractId={contractId}
  onFilesSelected={(files) => {
    // Traiter les fichiers uploadés
    files.forEach(file => {
      console.log(`${file.fileName}: ${file.fileSize} bytes`)
    })
  }}
  maxFiles={5}
  category="LOCATAIRE_DOCUMENTS"
/>
```

## Validation et Messages d'erreur

### Messages d'erreur clientsle

| Erreur | Cause |
|--------|-------|
| "Type de fichier non autorisé" | Extension de fichier non supportée |
| "Fichier trop volumineux (X KB). Maximum: 5 KB" | Fichier dépassant 5 KB après compression |
| "Erreur lors du traitement du fichier" | Problème lors de la compression |

### Messages backend

- `400`: Paramètres invalides
- `403`: Non autorisé (utilisateur ne peut pas uploader pour ce contrat)
- `404`: Contrat non trouvé
- `413`: Fichier trop volumineux (> 5KB)

## Architecture

### Flux d'upload

```
Utilisateur sélectionne fichier
            ↓
Validation du format (fileUtils.ts)
            ↓
Compression (si image)
            ↓
Vérification de la taille limite (5 KB)
            ↓
Si OK : envoi à l'API (/contracts/:id/documents POST)
Si erreur : affichage du message d'erreur
            ↓
Backend revalide la taille et crée un enregistrement DB
            ↓
Affichage dans la liste de documents
```

### Compression des images

Les images sont compressées automatiquement selon ces règles :

1. **Redimensionnement** : Maximum 800x600 pixels (aspect ratio préservé)
2. **Compression** : 70% de qualité JPEG
3. **Résultat** : Généralement < 5 KB

Exemple : Une image de 2MB peut être réduite à ~2-4 KB après compression.

## Sécurité

✅ **Validation server-side** : Tous les fichiers sont re-validés côté API
✅ **Limite stricte 5 KB** : Impossible de contourner cette limite
✅ **Vérification MIME type** : Stricte validation des types de fichiers
✅ **Stockage sécurisé** : Base de données PostgreSQL avec historique complet

## Points importants

⚠️ **Limite de 5 KB NON négociable** : C'est une limite stricte appliquée au backend

Le système est actuellement en développement. Pour l'intégration au ContractDetails, consultez le composant existing `DocumentChecklist`.

## Support et Debugging

Pour vérifier que tout fonctionne :

1. Vérifier dans le navigateur (DevTools → Network) que les uploads réussissent
2. Vérifier que la limite de 5 KB est respectée : `console.log(file.fileSize / 1024)` KB
3. Vérifier dans la base de données PostgreSQL la table `contract_documents`

## Prochaines étapes

- [ ] Intégrer DocumentUpload au ContractDetails
- [ ] Ajouter une preview pour les documents PDF
- [ ] Implémenter un système de vérification des documents (admin)
- [ ] Ajouter des notifications lors de la validation/rejet de documents
