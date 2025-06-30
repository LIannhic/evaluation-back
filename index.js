const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwtUtils = require("jsonwebtoken");
const interceptor = require("./middleware/jwt-interceptor");

const app = express();

// Configuration de la base de données
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306, //<-- optionnel si c'est le port par défaut (3306)
  user: "root",
  //password: "", //<--- ne pas mettre si vous n'avez pas de mot de passe
  database: "evaluation_angular",
});

// Connexion à la base de données
connection.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données :", err);
    return;
  }
  console.log("Connecté à la base de données MySQL");
});

app.use(cors());

app.use(express.json()); // permet d'envoyer et recevoir du JSON (via les en-tête content-type et accept-content)

app.get("/", (requete, resultat) => {
  resultat.send("<h1>C'est une API il y a rien a voir ici</h1>");
});

app.get("/models/liste", (requete, resultat) => {
  connection.query("SELECT * FROM model", (err, lignes) => {
    //en cas d'erreur sql ou d'interuption de connexion avec la bdd
    if (err) {
      console.error(err);
      return resultat.sendStatus(500);
    }

    return resultat.json(lignes);
  });
});

app.post("/model", interceptor, (requete, resultat) => {
  const model = requete.body;

  if (requete.user.role != "Cupidon" && 
    requete.user.role != "Administrateur") {
      return resultat.sendStatus(403);
  }

  if (
    model.pseudo == null ||
    model.pseudo == "" ||
    model.pseudo.length > 20 ||
    model.description.length > 50
  ) {
    //validation
    return resultat.sendStatus(400); //bad request
  }

  connection.query(
    "SELECT * FROM model WHERE pseudo = ?",
    [model.pseudo],
    (err, lignes) => {
      if (lignes.length > 0) {
        return resultat.sendStatus(409); //conflict
      }

      connection.query(
        "INSERT INTO model (pseudo, date_naissance, taille_cm, poids_kg, mensurations, description) VALUES (?, ?, ?, ?, ?, ?)",
        [model.pseudo, model.date_naissance, model.taille_cm, model.poids_kg, model.mensurations, model.description, requete.user.id],
        (err, lignes) => {
          if (err) {
            console.error(err);
            return resultat.sendStatus(500); //internal server error
          }

          resultat.status(201).json(model);
        }
      );
    }
  );
});

app.delete("/model/:id", interceptor, (requete, resultat) => {

  connection.query("SELECT * FROM model WHERE id = ?", [requete.params.id], (erreur, lignes) => {

    if (erreur) {
      console.error(err);
      return resultat.sendStatus(500);
    }

    if(lignes.length == 0) {
      return resultat.sendStatus(404);
    }

    const estProprietaire = requete.user.role == "Cupidon" && requete.user.id == lignes[0].id_usager

    if (!estProprietaire && requete.user.role != "Administrateur") {
      return resultat.sendStatus(403);
    }

    connection.query("DELETE FROM model WHERE id = ?", [requete.params.id], (erreur, lignes) => {

      if (erreur) {
        console.error(err);
        return resultat.sendStatus(500); //internal server error
      }

      //204 = no content = tout c'est bien passé, mais il n'y a rien dans le corp de la réponse
      return resultat.sendStatus(204);
    })

  })

  

})

app.post("/inscription", (requete, resultat) => {
  const utilisateur = requete.body;

  const passwordHash = bcrypt.hashSync(utilisateur.mot_de_passe, 10);

  connection.query(
    "INSERT INTO Usagers (nom, courriel, mot_de_passe, id_role) VALUES (? , ?, ?, 3)",
    [utilisateur.nom, utilisateur.courriel, passwordHash],
    (err, retour) => {
      if (err && err.code == "ER_DUP_ENTRY") {
        return resultat.sendStatus(409); //conflict
      }

      if (err) {
        console.error(err);
        return resultat.sendStatus(500); //internal server error
      }

      utilisateur.id = retour.insertId;
      resultat.json(utilisateur);
    }
  );
});

app.post("/connexion", (requete, resultat) => {
  connection.query(
    `SELECT u.id_usager, u.courriel, u.mot_de_passe, r.nom_role 
      FROM usagers u 
      JOIN role r ON u.id_role = r.id_role 
      WHERE courriel = ?`,
    [requete.body.courriel],
    (erreur, lignes) => {
      if (erreur) {
        console.error(erreur);
        return resultat.sendStatus(500); //internal server error
      }

      console.log(lignes);

      //si l'email est inexistant
      if (lignes.length === 0) {
        return resultat.sendStatus(401);
      }

      const motDePasseFormulaire = requete.body.mot_de_passe;
      const motDePasseHashBaseDeDonnees = lignes[0].mot_de_passe;

      const compatible = bcrypt.compareSync(
        motDePasseFormulaire,
        motDePasseHashBaseDeDonnees
      );

      if (!compatible) {
        return resultat.sendStatus(401);
      }

      return resultat.send(
        jwtUtils.sign(
          {
            sub: requete.body.courriel,
            role: lignes[0].nom_role,
            id: lignes[0].id_usager
          },
          "azerty123"
        )
      );
    }
  );
});

app.listen(5000, () => console.log("Le serveur écoute sur le port 5000 !!"));
