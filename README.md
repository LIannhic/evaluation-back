Création d'un base de donnée SQL

commande sql de création de la base de donnée

-- Création des tables
CREATE TABLE Role (
    id_role INT PRIMARY KEY AUTO_INCREMENT,
    nom_role VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Usagers (
    id_usager INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    courriel VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    id_role INT NOT NULL,
    FOREIGN KEY (id_role) REFERENCES Role(id_role)
);

CREATE TABLE Model (
    id_model INT PRIMARY KEY AUTO_INCREMENT,
    id_usager INT NOT NULL,
    pseudo VARCHAR(100) NOT NULL UNIQUE,
    date_naissance DATE,
    taille_cm INT,
    poids_kg INT,
    mensurations VARCHAR(100),
    description TEXT,
    FOREIGN KEY (id_usager) REFERENCES Usagers(id_usager)
);

-- Insertion des rôles
INSERT INTO Role (nom_role) VALUES
('Administrateur'),
('Cupidon'),
('Utilisateur');

-- Insertion des usagers
-- Supposons les ID de rôle sont : 1=Admin, 2=Cupidon, 3=Utilisateur
INSERT INTO Usagers (nom, courriel, mot_de_passe, id_role) VALUES
('Admin', 'admin@exemple.com', 'toto', 1),
('Cupidon-A', 'cupidona@exemple.com', 'toto', 2),
('Cupidon-B', 'cupidonb@exemple.com', 'toto', 2),
('Utilisateur', 'utilisateur@exemple.com', 'toto', 3);

-- Insertion de modèles (liés aux Cupidons : id_usager 2 et 3)
INSERT INTO Model (id_usager, pseudo, date_naissance, taille_cm, poids_kg, mensurations, description) VALUES
(2, 'Cupidon92', '1992-02-14', 180, 75, '100-80-95', 'Cupidon professionnel depuis 2010.'),
(2, 'FlècheDOr', '1995-07-12', 165, 60, '85-65-90', 'Spécialiste des rencontres insolites.'),
(3, 'CoeurAimant', '1990-05-08', 172, 68, '88-70-94', 'Toujours à la recherche de l’âme sœur... pour les autres.'),
(3, 'ArcEtCharme', '1988-03-21', 178, 72, '90-72-98', 'Cupidon vétéran avec une touche artistique.');
