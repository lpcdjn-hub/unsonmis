# CrushLibre — prototype connecté Supabase

Prototype mobile-first de connexion Supabase. Utilise la publishable key (clé publique) uniquement; ne jamais mettre de clé secret/service-role dans le navigateur.

## Lancer
Servir ce dossier avec un serveur web statique (pas en ouvrant directement le fichier `file://`). Le SDK Supabase est chargé depuis jsDelivr.

## Important
Ce prototype teste uniquement l'authentification et l'édition basique de profil. Il ne s'agit pas d'une application de rencontres prête à publier. Avant production, vérifier les RLS de `profiles`, l'âge avec un fournisseur approprié, la séparation des espaces, les flux de médias privés, la modération, les blocages, signalements, la conformité RGPD et les règles des stores. Les règles de stockage mises en place précédemment sont à auditer: une policy SELECT trop large peut exposer les fichiers du bucket privé aux utilisateurs authentifiés.
