# Projet RoboML — Métamodèle Ecore (Checkpoint 1)

Ce dépôt contient le métamodèle Ecore du langage dédié (DSL) RoboML, conçu avec Eclipse DSL 2025-09, permettant de modéliser le comportement, la logique de contrôle et les déplacements d'un robot.

## Structure du dépôt

* `fr.esir.ase.roboml.model/model/roboml.ecore` : Le métamodèle Ecore de RoboML.
* `fr.esir.ase.roboml.model/model/example_square.xmi` : Une instance dynamique valide représentant le programme d'exemple du sujet (`entry` et `square`).
* `roboml/src/language/robo-ml.langium` : Grammaire Langium (syntaxe concrète, gestion des priorités d'opérateurs et terminaux).
* `roboml/` : Projet Langium / TypeScript générant l'AST, le parseur et l'extension VS Code pour la Partie 2 et la Partie 3.
---

## Principaux choix de conception

### 1. Structure globale et Fonctions (`RoboMLProgram`, `Function`, `Datatype`)
* **`RoboMLProgram`** est la classe racine du métamodèle. Elle contient par composition (`containment = true`) une liste de fonctions (`functions : Function[0..*]`) et possède une référence directe vers la fonction principale (`entryFunction : Function[1]`), ce qui facilite l'identification du point d'entrée lors de l'interprétation ou de la compilation.
* **`Function`** modélise une fonction avec son nom (`name`), son type de retour (`returnType : Datatype`), sa liste de paramètres (`parameters : Parameter[0..*]`) et son bloc d'instructions (`body : Statement[0..*]`).
* **`Datatype`** est une énumération (`EEnum`) regroupant les types primitifs du langage : `VOID`, `NUMBER` et `BOOLEAN`.

### 2. Hiérarchie des Instructions (`Statement`) et factorisation des Variables
Toutes les instructions exécutables dans le corps d'une fonction ou d'une structure de contrôle héritent de la classe abstraite **`Statement`**.

Pour gérer les variables et paramètres de manière uniforme :
* Nous avons introduit une classe abstraite **`Variable`** portant un `name : EString` et un `type : Datatype`.
* **`Parameter`** (paramètre d'une fonction) et **`VariableDecla`** (déclaration locale `var number count = 0`) héritent toutes deux de **`Variable`**.
* **`VariableDecla`** hérite également de **`Statement`**  afin de pouvoir être placée directement dans un bloc d'instructions, avec une expression d'initialisation optionnelle (`initialValue : Expression[0..1]`).
* Grâce à ce polymorphisme, l'affectation (**`Assignment`**) et la lecture de variable (**`VariableRef`**) pointent simplement vers **`Variable`** (`containment = false`), permettant de manipuler indifféremment une variable locale ou un paramètre de fonction.

### 3. Double nature des appels de fonctions (`FunctionCall`)
Un appel de fonction peut être utilisé :
* Comme une **instruction autonome** (ex. `square()` dans le corps d'une boucle, lorsque la fonction retourne `VOID`).
* Comme une **expression** au sein d'un calcul ou d'une condition (ex. `computeDistance() + 10`).

La classe **`FunctionCall`** hérite donc à la fois de **`Statement`** et de **`Expression`**. Elle référence la fonction cible (`function : Function[1]`) et contient la liste des arguments passés (`arguments : Expression[0..*]`). L'instruction **`Return`** (`Statement`) permet quant à elle de renvoyer une `Expression[0..1]`.

### 4. Structures de contrôle (`Loop`, `Condition`)
* **`Loop`** (héritant de `Statement`) contient une condition d'arrêt/continuation (`condition : Expression[1]`) et un bloc d'instructions (`body : Statement[0..*]`).
* **`Condition`** (héritant de `Statement`) modélise les branchements `if / else` via une condition (`condition : Expression[1]`), une branche principale (`thenBranch : Statement[0..*]`) et une branche alternative optionnelle (`elseBranch : Statement[0..*]`).

### 5. Commandes du robot et Unités (`Movement`, `Rotation`, `SetSpeed`, `DistanceUnit`)
Plutôt que de multiplier les classes pour chaque direction, nous avons factorisé les commandes physiques du robot (toutes sous-classes de `Statement`) à l'aide d'énumérations :
* **`DistanceUnit`** (`EEnum`) : `MM`, `CM`, `M`.
* **`Movement`** : combine une direction (`direction : MovementDirection` parmi `FORWARD`, `BACKWARD`, `LEFT`, `RIGHT`), une expression de distance (`distance : Expression[1]`) et une unité (`unit : DistanceUnit[1]`).
* **`Rotation`** : combine un sens de rotation (`direction : RotationDirection` parmi `CLOCK`, `ANTICLOCK`) et une expression d'angle en degrés (`angle : Expression[1]`).
* **`SetSpeed`** : règle la vitesse du robot via une expression (`speed : Expression[1]`) associée à une unité (`unit : DistanceUnit[1]`).

Le fait d'utiliser `Expression` (et non une simple constante numérique) pour la distance, l'angle et la vitesse permet d'écrire des commandes dynamiques (ex. `Forward (count * 10) in cm`).

### 6. Expressions arithmétiques, booléennes et Capteurs (`Expression`)
Toutes les valeurs évaluables héritent de la classe abstraite **`Expression`** :
* **Constantes et références** : **`NumberConstant`** (`value : EDouble`), **`BooleanConstant`** (`value : EBoolean`) et **`VariableRef`** (`variable : Variable[1]`).
* **Opérations binaires et unaires** :
  * **`BinaryExpression`** associe une opérande gauche (`left : Expression[1]`), une opérande droite (`right : Expression[1]`) et un opérateur **`BinaryOperator`** (`PLUS`, `MINUS`, `MULT`, `DIV`, `LT`, `LTE`, `GT`, `GTE`, `EQ`, `NEQ`, `AND`, `OR`).
  * **`UnaryExpression`** associe une opérande (`operand : Expression[1]`) et un opérateur **`UnaryOperator`** (`NOT`, `MINUS`).
* **Capteurs (`SensorExpression`)** : Les lectures de capteurs étant des valeurs utilisables directement dans des expressions ou conditions, elles héritent de la classe abstraite **`SensorExpression`** (sous-classe d'`Expression`) :
  * **`DistanceSensor`** : mesure la distance face à un obstacle dans l'unité souhaitée (`unit : DistanceUnit[1]`).
  * **`TimeSensor`** : retourne la mesure du temps courant (timestamp / horloge interne).

### 7. Passage à la syntaxe concrète sous Langium (Partie 2)
- **Syntaxe concrète lisible** : Plutôt que de conserver une syntaxe générée automatiquement très verbeuse, la grammaire `robo-ml.langium` définit une syntaxe concise alignée sur les exemples du sujet (`let`, `var`, `loop`, `if`/`else`, `Forward`/`Backward`/`Left`/`Right`, `Clock`/`Anticlock`, `setSpeed`, `getDistance()`, `getTimestamp()`, avec `in` optionnel pour les unités `mm`, `cm`, `m`).
- **Gestion des priorités d'opérateurs** : Les expressions sont structurées en niveaux de priorité (`||`, `&&`, `==`/`!=`, `<`/`<=`/`>`/`>=`, `+`/`-`, `*`/`/`, puis `PrimaryExpression` et `UnaryExpression`) avec `{infer BinaryExpression.left=current}` afin d'éviter la récursion gauche et de construire un AST cohérent.
- **Adaptation aux contraintes JavaScript/Langium** : La règle de fonction a été nommée `FunctionDef` (et non `Function`, mot-clé réservé en JavaScript/TypeScript), et les fichiers générés par défaut du template ont été adaptés à `RobotMLProgram`.
  
---
*Ce document a été partielement rédigé et structuré avec l'aide d'une IA.*
