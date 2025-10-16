# 🏰 Plan 3D de Poudlard - EPSI Workshop 2026

> **Projet réalisé par Adrien Lazaille** dans le cadre du workshop 2026 lors de son Master à l'EPSI

[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📖 Contexte du Projet

Ce projet a été réalisé dans le cadre d'un **workshop innovant organisé par l'EPSI**, où nous devions utiliser les **LLM (Large Language Models)** pour relever des défis créatifs et techniques.

### 🎯 Le Défi : "Où est la Chambre des Secrets ?"

**Objectif :** Réaliser les plans 3D de notre école dans le style Harry Potter ! L'objectif était de générer un objet 3D des plans de Poudlard et d'y mettre en surbrillance la chambre des secrets (myDiL).

**Exigences techniques :**
- ✅ Animation du plan pour voir Poudlard sous tous ses angles
- ✅ Bonne répartition des surfaces
- ✅ Murs bien définis
- ✅ Portes apparentes
- ✅ Bonus : Bureaux et tableaux

### 🛠️ Choix Technologique

J'ai choisi **Three.js** pour découvrir cette librairie 3D et progresser sur mes compétences de développement web. Une excellente occasion d'explorer le rendu 3D dans le navigateur !

## 🚀 Comment Lancer le Projet

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/VOTRE_USERNAME/poudlard-epsi-3d.git
cd poudlard-epsi-3d
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
# ou
yarn dev
```

4. **Ouvrir dans le navigateur**
```
http://localhost:5173
```

### Build de Production
```bash
npm run build
# ou
yarn build
```

## 🏗️ Architecture du Projet

```
poudlard-epsi-3d/
├── 📁 public/
│   └── 📁 textures/           # Textures 3D (murs, sols, objets)
│       ├── 📁 castle_wall/    # Textures des murs du château
│       ├── 📁 floor/          # Textures des sols
│       ├── 📁 object/         # Textures des objets (portes, fenêtres)
│       └── 📁 wall/           # Textures des murs intérieurs
├── 📁 src/
│   ├── 📁 components/         # Composants Vue.js
│   ├── 📁 three/             # Logique Three.js
│   │   ├── 📁 objects/       # Objets 3D (portes, meubles)
│   │   ├── 📁 utils/         # Utilitaires (construction murs, sols)
│   │   ├── materials.ts      # Matériaux Three.js
│   │   └── Scene3D.vue       # Scène principale
│   ├── 📁 stores/            # Store Pinia
│   └── 📁 views/             # Vues de l'application
├── index.html                # Point d'entrée HTML
└── package.json              # Dépendances et scripts
```

## 🎮 Fonctionnalités

### 🎥 Navigation 3D
- **Contrôles orbitaux** : Rotation, zoom, déplacement de la caméra
- **Mode Lecture** : Animation automatique de la caméra
- **Navigation rapide** : Bouton pour aller directement à la Chambre des Secrets

### 🏰 Éléments du Bâtiment
- **Murs extérieurs** avec fenêtres vitrées
- **Salles de classe** avec textures spécifiques
- **Chambre des Secrets** avec surbrillance rouge
- **Portes d'entrée** avec ouverture dans les murs
- **Éclairage** : Soleil visible + éclairage ambiant

### 🪑 Mobilier
- **Tables** dans les salles de classe
- **Bureaux en L** dans les couloirs
- **Canapés** dans les espaces de détente
- **Textures réalistes** : bois, marbre, cuir

### 🎨 Interface Utilisateur
- **Bouton d'information** : Explication complète du projet
- **Bouton Chambre des Secrets** : Navigation et surbrillance
- **Design responsive** et accessible

## 🛠️ Comment Nous L'avons Construit

### 1. **Analyse du Défi**
- Compréhension des exigences techniques
- Choix de Three.js pour la 3D
- Planification de l'architecture

### 2. **Modélisation 3D**
- **Construction des murs** : Utilisation de segments pour créer les contours
- **Création des sols** : Différentes textures selon les zones
- **Ajout du mobilier** : Tables, bureaux, canapés avec textures réalistes

### 3. **Intégration des Textures**
- **Textures PBR** : Couleur, normal, rugosité
- **Répétition intelligente** : Adaptation des textures aux dimensions
- **Optimisation** : Chargement asynchrone des textures

### 4. **Système d'Éclairage**
- **Éclairage directionnel** : Simulation du soleil
- **Éclairage ambiant** : Éclairage général de la scène
- **Effets visuels** : Soleil visible dans le ciel

### 5. **Interface Utilisateur**
- **Contrôles de navigation** : OrbitControls de Three.js
- **Boutons interactifs** : Vue.js pour la réactivité
- **Animations fluides** : Transitions de caméra

### 6. **Optimisations**
- **Gestion mémoire** : Nettoyage des ressources
- **Performance** : Rendu optimisé
- **Responsive** : Adaptation aux différentes tailles d'écran

## 🎯 Technologies Utilisées

- **Three.js** : Rendu 3D dans le navigateur
- **Vue.js 3** : Framework JavaScript réactif
- **TypeScript** : Typage statique pour plus de robustesse
- **Vite** : Build tool rapide et moderne
- **Pinia** : Gestion d'état
- **CSS3** : Styles et animations

## 📱 Compatibilité

- ✅ Chrome (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- 📱 Responsive design

## 🤝 Contribution

Ce projet a été réalisé dans le cadre d'un workshop éducatif. Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue !

## 📄 Licence

Ce projet est réalisé dans un cadre éducatif pour l'EPSI.

---

**Réalisé avec ❤️ par Adrien Lazaille**  
*Master EPSI - Workshop 2026*