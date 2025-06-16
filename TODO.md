
# TODO - Réparation Module Workflow n8n

## 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **Base de données - Tables manquantes**
- [ ] Créer table `user_secrets` pour stocker les clés API de façon sécurisée
- [ ] Vérifier/corriger le schéma de `app_settings`
- [ ] Ajouter les index nécessaires pour les performances

### 2. **Configuration n8n - Incohérences**
- [ ] Corriger l'incohérence entre `app_settings` et `user_secrets`
- [ ] Standardiser le stockage des configurations n8n
- [ ] Supprimer les URLs hardcodées

### 3. **Services n8n - Architecture fragmentée**
- [ ] Consolider `n8nService`, `unifiedN8nService`, `enhancedWorkflowService`
- [ ] Supprimer la duplication de code
- [ ] Standardiser la gestion d'erreurs

### 4. **Fonctions Edge Supabase**
- [ ] Corriger `n8n-proxy/index.ts` - récupération configurations
- [ ] Améliorer `test-n8n-connection/index.ts` - tests plus complets
- [ ] Corriger `save-n8n-config/index.ts` - cohérence stockage

### 5. **Gestion des erreurs**
- [ ] Corriger la retry logic qui peut causer des boucles infinites
- [ ] Ajouter validation des types d'erreurs
- [ ] Implémenter circuit breaker pattern

### 6. **Interface utilisateur**
- [ ] Corriger les états non synchronisés dans `EnhancedWorkflowManager`
- [ ] Ajouter état de loading global
- [ ] Séparer logique métier des composants UI

### 7. **Sécurité**
- [ ] Chiffrer les clés API stockées
- [ ] Valider les permissions n8n côté serveur
- [ ] Corriger les CORS headers trop permissifs

### 8. **Monitoring et logs**
- [ ] Ajouter monitoring temps réel des exécutions
- [ ] Améliorer les logs d'erreurs
- [ ] Ajouter audit trail des actions

## 📊 TESTS À EFFECTUER
- [ ] Test connexion n8n
- [ ] Test CRUD workflows
- [ ] Test exécution workflows
- [ ] Test gestion des erreurs
- [ ] Test interface utilisateur
- [ ] Test sécurité

## 🎯 OBJECTIF FINAL
Application n8n parfaitement intégrée avec :
- Configuration sécurisée et centralisée
- Interface utilisateur intuitive
- Gestion d'erreurs robuste
- Monitoring complet
- Architecture propre et maintenable
