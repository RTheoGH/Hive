# Jeu de stratégie avec des insectes - Hive
#### Projet de programmation - Semestre 6

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![D3.js](https://img.shields.io/static/v1?style=for-the-badge&message=D3.js&color=222222&logo=D3.js&logoColor=F9A03C&label=)

## Projet réalisé par
### Groupe 4 :

| Nom          | Prénom       | Numéro d'étudiant |   Groupe   |
|--------------|--------------|-------------------|------------|
| Reynier      | Théo         | 22008945          | Groupe C   |
| Hommais      | Anthony      | 22010461          | Groupe C   |
| Fay          | Corentin     | 22013398          | Groupe C   |
| Viguier      | Killian      | 22011024          | Groupe C   |

## Description

Hive est un jeu de stratégie pour deux joueurs, créé par John Yianni et édité par Gen42 en 2001.

Véritable jeu d’échecs des temps modernes, Hive porte en lui des éléments qui font l’essence du jeu d’échecs : Simplicité et profondeur, pièces aux caractéristiques et déplacements uniques.

Ce jeu ravira les Pousseurs de Bois les plus obtus. Si Magnus Carlsen renonce au Roi des Jeux, c’est qu’il batifole avec la « Reine Abeille » !

## Règles du jeu

**But du jeu :**

Cerner (encercler) la Reine Abeille de l’adversaire.

**Déroulement :**

Les joueurs jouent à tour de rôle en posant une pièce à côté d’une ou plusieurs pièces déjà en jeu.

**Placement :**

Une pièce doit être placée à côté d’une pièce amie et ne peut en aucun cas être placée à côté de celle de son adversaire. (Sauf au premier tour)

**Descriptifs des différentes pièces**

- Abeille : Se déplace d’un espace à la fois. Doit être placée avant 3 tours. 

![Abeille](/public/insectes/abeille.png)
- Fourmi : Peut se déplacer d’autant d’espaces que le joueur le désire.

![Fourmi](/public/insectes/fourmi.png)
- Sauterelle : Se déplace en sautant en ligne droite par-dessus une ou plusieurs autres pièces, jusqu’au premier espace libre.

![Sauterelle](/public/insectes/sauterelle.png)
- Scarabee : Se déplace d’un espace à la fois, a la capacité de grimper sur les autres pièces.

![Scarabee](/public/insectes/scarabee.png)
- Araignee : Se déplace de trois espaces.

![Araignee](/public/insectes/araignee.png)
- Coccinelle : Se déplace de trois espaces à chaque tour, mais doit obligatoirement effectuer ses deux premiers déplacements en montant au-dessus des autres pièces puis redescendre au sol lors de son troisième déplacement.

![Coccinelle](/public/insectes/coccinelle.png)
- Moustique : Prend le mode de déplacement de la ou des pièces adjacentes. 

![Moustique](/public/insectes/moustique.png)

## Liste des fonctionnalités implémentés

- Page d'accueil, des règles, de création d'une partie, pour rejoindre une partie, du jeu
- Gestion des erreurs au niveau des salles
- Système de communication via une messagerie (tchat)
- Système audio sur les pages
- Affichage selon les tailles d'écran
-
-

## Installer les packages
```bash
npm install
```

## Pour lancer le jeu 
```bash
node index.js
```

## Références

- Page du jeu : https://www.regledujeu.fr/hive/