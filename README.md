# HealthDoc — version complète corrigée

Prototype éducatif en **HTML, CSS et JavaScript**. Interface en anglais, design responsive.

## Fonctionnalités

- **Home** : présentation et navigation entre les fonctionnalités.
- **Assessment** : questionnaire de prévention, conseils généraux, score illustratif et historique local.
- **Insights** : graphiques et historique chronologique, comparaison entre évaluations, sélection/suppression par identifiant stable, export JSON.
- **Consent** : enregistrement et révocation de **préférences fictives** de partage (aucune donnée n'est réellement partagée).
- **Documents** : ajout, recherche, téléchargement et suppression de fichiers stockés **uniquement dans le navigateur** avec IndexedDB (max. 15 Mo/fichier, formats PDF, images, TXT, DOC et DOCX).

## Démarrage

1. Décompresser l'archive.
2. Ouvrir `index.html` dans un navigateur récent (Chrome, Edge, Firefox).
3. Pour un fonctionnement plus constant d'IndexedDB, lancer un petit serveur local dans ce dossier :

   ```bash
   python -m http.server 8000
   ```

   Puis ouvrir http://localhost:8000 (ou utiliser VS Code et l'extension Live Server).

Aucune installation de dépendance ni compilation n'est nécessaire. La police Google facultative peut ne pas charger hors connexion ; le système utilise alors une police de remplacement.

## Structure

```text
HealthDoc_complet_corrige/
  index.html    # Accueil, questionnaire, consentement, documents
  stats.html    # Tableau de bord
  style.css     # Styles communs + pages du site
  stats.css     # Tableau de bord
  shared.js     # Données, scores, dates et historique
  script.js     # Navigation, formulaire, préférences et fichiers
  stats.js      # Statistiques, comparaison, graphe SVG, export
  README.md
```

## Confidentialité et limites

**Attention : ceci n'est pas une application médicale certifiée ou un stockage sécurisé de santé.** Le score est une règle pédagogique arbitraire : il ne prédit ni ne diagnostique de maladie. Aucun serveur, compte, chiffrage applicatif ou système de partage de données médicales n'est inclus. La page de consentement simule uniquement un formulaire de préférences.

Les évaluations sont stockées en `localStorage` sous `healthDocHistory`, et les documents dans `IndexedDB` (`healthDocLocalFiles`). Les préférences de consentement sont dans `localStorage` sous `healthDocConsent`. Elles restent liées au navigateur et au site d'origine. Elles ne se synchronisent pas entre appareils et peuvent être supprimées par les paramètres du navigateur, en mode privé ou si le quota est dépassé. Ne stockez pas de vrais dossiers médicaux sensibles, en particulier sur un ordinateur partagé.

La version actuelle peut lire les **anciens historiques** HealthDoc. Les anciens enregistrements n'incluaient pas la liste détaillée des cases « Genetic Predispositions » : cette information manquante n'est pas inventée dans les comparaisons. Les dates de l'ancien format `JJ/MM/AAAA` sont interprétées au format français lorsqu'elles sont ambiguës.

## Prise en main

- Faire un premier test (menu **Assessment**) et ouvrir **Insights** pour voir le résultat.
- Répéter le test avec d'autres réponses. Sur **Insights**, ouvrir **View details & comparison**, ou cocher une ou plusieurs lignes pour les supprimer.
- **Export JSON** sauvegarde une copie de l'historique, mais **ne sauvegarde pas** les documents.
- Dans **Consent**, enregistrer puis effacer les préférences simulées.
- Dans **Documents**, ajouter un fichier de test non sensible, actualiser la page, le rechercher, le télécharger et le supprimer.

## Publication

Peut être publié comme site statique (GitHub Pages, Netlify, Vercel). Les données resteront propres **à chaque navigateur** : aucune synchronisation ni compte utilisateur n'est implémenté. HTTPS est recommandé pour la publication. Pour un vrai usage médical, prévoir un audit sécurité, gestion du consentement, authentification et conformité réglementaire avant de collecter des données de santé.
