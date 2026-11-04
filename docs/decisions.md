# Décisions

Journal des choix structurants. Ajouter une entrée datée quand on en prend un nouveau ; ne pas réécrire les anciennes, les marquer « remplacée par ».

## 2026-11-04 : TanStack Start + Supabase, sur Vercel

Délai de trois jours avant l'événement. TanStack Start donne du React avec des server functions pour garder les secrets côté serveur (détection du score sur photo, Instagram) sans gérer des Edge Functions à part. Supabase couvre d'un coup la base, le temps réel pour l'écran public, le stockage des photos et l'auth des bénévoles. MDLR a déjà des comptes GitHub, Supabase et Vercel.

## 2026-11-04 : shadcn/ui thémé par le design system MDLR

Les composants viennent de shadcn (new-york, Radix). Leurs variables (`--primary`, `--background`…) sont branchées sur les tokens MDLR dans `src/styles/mdlr/shadcn.css`, ce qui les fait suivre les trois thèmes sans recompiler. Le bundle React du design system (React 18, global `MDLR`) n'est pas utilisé. Les composants spécifiques MDLR seront écrits ici puis extraits plus tard dans une lib partagée.

## 2026-11-04 : une seule table `scores` pour soumissions et saisies admin

Une soumission joueur et un score saisi par un bénévole sont le même objet à des étapes différentes (`status`, `source`). Une seule table simplifie le classement, le temps réel et l'admin.

## 2026-11-04 : inscriptions fermées, bénévoles dans `public.admins`

Pas d'inscription publique. Un compte Auth seul ne donne aucun droit : il faut être dans `public.admins`. Ça évite qu'une inscription ouverte par erreur donne accès à l'admin.

## 2026-11-04 : dépôt public

Rien de sensible dans le code ; la clé publishable est publique par conception et la RLS protège les données. Le dépôt sert aussi de vitrine pour l'association. Conséquence : jamais de vraies données de joueurs dans les seeds, tests ou captures.

## 2026-11-04 : photos dans un bucket public

L'écran public et l'admin affichent les photos sans signer d'URL. Les noms de fichiers sont des UUID et le bucket n'est pas listable par le public. À revoir si on veut cacher les photos des soumissions rejetées (bucket privé + URLs signées depuis l'admin).
