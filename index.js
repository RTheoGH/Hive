const express = require('express')
const app = express()
const port = 3000
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);

const salles=[];

// ==================================
// ========= Partie Express ========= 
// ==================================

server.listen(port, () => {
    console.log(`Serveur écoutant sur le port ${port}`);
});

app.get('/',(req,res) => {
    res.sendFile('public/index.html',{root: __dirname})
})

app.get('/regles', (req, res) => {
    res.sendFile('public/regles.html',{root: __dirname});
});

// chemin permettant d'utiliser les fichiers de public
app.get('/public/:nomFichier', (req,res) => {
    res.sendFile("public/"+req.params.nomFichier,{root: __dirname});
});

// chemin permettant d'utiliser les images de public
app.get('/public/images/:nomFichier', (req,res) => {       
    res.sendFile("public/images/"+req.params.nomFichier,{root: __dirname});
});

// chemin permettant d'utiliser les images d'insectes de public
app.get('/public/insectes/:nomFichier', (req,res) => {       
    res.sendFile("public/insectes/"+req.params.nomFichier,{root: __dirname});
});

// chemin permettant d'utiliser les sons de public
app.get('/public/sons/:nomFichier', (req,res) => {       
    res.sendFile("public/sons/"+req.params.nomFichier,{root: __dirname});
});

// ===================================
// ========== Partie Socket ========== 
// ===================================

io.on('connection', (socket) => {
    socket.emit("Salut c'est le serveur ! :)");
    
    // Socket de création d'une nouvelle salle
    socket.on('nouvelleSalle',(data) =>{
        console.log("nom : '",data.nom,"' code : '",data.code,"' Joueur 1 : '",data.listeJoueurs[0][0],"'");
        if(data.nom == ''){
            console.log("nom de salle vide");
            socket.emit('nomVide');
        }else if(data.code == ''){
            console.log("code de salle vide");
            socket.emit('codeVide');
        }else if(data.listeJoueurs[0][0] == ''){
            console.log("nom du joueur vide");
            socket.emit('joueurVide');
        }else{
            let salleLibre = true;
            console.log(data);
            for(i=0;i<salles.length;i++){   //Vérifie si on a pas déja une salle portant ce nom
                if(data.nom == salles[i].nom){
                    console.log("Ce nom de salle est déjà pris.");
                    salleLibre = false;
                    break;
                }
            }
            console.log(salleLibre);
            if(salleLibre){   // Si le nom de salle est disponible
                console.log("La salle est disponible");
                data.listeJoueurs[0][1] = socket.id;
                salles.push(data);       // Ajout de la salle dans la liste des salles
                console.log("Salle crée : ",data);
                console.log("Liste des salles : ",salles);

                socket.join(data.nom);   // Actualisation uniquement pour cette salle
                io.to(data.nom).emit('majSalle',data);
            }else{
                console.log("Retour à l'accueil");
                socket.emit("sallePrise");  // Sinon on renvoit la personne à l'accueil
            }
            console.log(salles);
        }
    });

    // Socket d'une tentative de connexion d'un joueur dans une salle
    socket.on('tentativeRejoindre',(data) => {
        let joueurDejaPresent = false;
        let salleTrouve = false;

        for(i=0;i<salles.length;i++){
            if(data.nom == salles[i].nom){ // On trouve la salle correspondante
                salleTrouve = true;
                if(data.code==salles[i].code){ // si le code de salle correspond au code fourni
                    console.log(salles[i]);
                    for(j=0;j<salles[i].listeJoueurs.length;j++){ // On vérifie si le pseudo du joueur n'est pas déjà dans la salle
                        if(data.joueur[0] == salles[i].listeJoueurs[0][0]){
                            console.log("Ce pseudo est déjà pris.\n",salles[i].listeJoueurs);
                            console.log("Retour à l'accueil");
                            socket.emit("pseudoPris"); // Si on trouve le même pseudo on le renvoit à l'accueil
                            joueurDejaPresent = true;
                            break;
                        }
                    }
                    if(!joueurDejaPresent){ // Sinon si le joueur n'était pas dans la salle
                        console.log("Le joueur n'est pas déjà dans la salle.");
                        if(salles[i].listeJoueurs.length>=2){ // On vérifie qu'il n'y est pas plus de deux joueurs dans la salle
                            console.log("La salle est pleine.\n",salles[i].listeJoueurs);
                            console.log("Retour à l'accueil");
                            socket.emit("sallePleine"); // Sinon on renvoit la personne à l'accueil
                            break;
                        }else{ // Si le joueur n'est pas dans la salle et que la salle n'est pas surchargée, on peut l'ajouter !
                            console.log("Salle trouvée : ",salles[i].nom);
                            data.joueur[1] = socket.id;
                            salles[i].listeJoueurs.push(data.joueur);
                            console.log("Joueurs : ",salles[i].listeJoueurs);
        
                            socket.join(data.nom);  // Actualisation uniquement pour cette salle
                            io.to(data.nom).emit('majSalle',salles[i]);
                            if(salles[i].listeJoueurs.length == 2){ // Si deux joueurs sont présente dans la salle, le bouton lancer
                                io.to(data.nom).emit('lancerDispo');  // devient disponible
                            }
                            break;
                        }
                    }
                }else{ // Si le code ne correspond pas à celui de la salle
                    console.log("Le code ne corresond pas.");
                    console.log("Retour à l'accueil");
                    socket.emit("codeFaux"); // Sinon on renvoit la personne à l'accueil
                    break;
                }
            }
        }
        if(!salleTrouve){ // Si on ne trouve pas de salle de ce nom
            console.log("Cette salle n'existe pas.");
            console.log("Retour à l'accueil");
            socket.emit("salleIntrouvable"); // Sinon on renvoit la personne à l'accueil
        }
        console.log(salles);
    })

    // Socket lorsqu'un joueur décide de quitter la salle
    socket.on('quittePartie', () => {
        console.log("quitter la salle reçu");
        let joueurQuittant = null;
        let salleAQuitter = null;
    
        for(const salle of salles){  // Parcourir toutes les salles
            const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);  // Recherche le joueur dans la liste des joueurs de chaque salle
            console.log(indexJoueur);
            if(indexJoueur != -1){  // Si le joueur est trouvé dans la salle
                joueurQuittant = salle.listeJoueurs[indexJoueur][0]; // Récupére le nom du joueur
                salleAQuitter = salle;
                console.log(joueurQuittant);
                console.log(salleAQuitter);
                salleAQuitter.listeJoueurs.splice(indexJoueur, 1);  // Retire le joueur de la liste des joueurs de la salle
                socket.leave(salleAQuitter.nom);
                console.log(salleAQuitter.listeJoueurs);
                // if(indexJoueur == 0){  // Si le joueur est le créateur de la salle, supprime la salle
                //     salles.splice(salles.indexOf(salleAQuitter), 1);
                // }

                // Émettre une mise à jour de la salle aux autres joueurs de la salle
                io.to(salleAQuitter.nom).emit('majSalle',salleAQuitter);

                if(salleAQuitter.listeJoueurs == 0){ // Si la salle est vide, on peut la supprimer
                    salles.splice(salles.indexOf(salleAQuitter),1);
                }
                if(salleAQuitter.listeJoueurs != 2){ // Si il n'y a pas deux joueurs dans la salle, on désactive le bouton lancer
                    io.to(salleAQuitter.nom).emit('lancerPlusDispo');
                }
                break;
            }
        }
        console.log(salles);
    });

    // Socket de lancement de partie
    socket.on('lancementPartie', () => {
        console.log("Lancement de Partie reçu");
        let salleActuelle = null;

        console.log("Je cherche la salle actuelle en cherchant le joueur");
        for(const salle of salles){ // Recherche de la salle
            const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id); // Joueur qui a lancé
            console.log("Joueur qui a lancé : ",indexJoueur)
            console.log('Salle :',salle);
            if(indexJoueur != -1){
                salleActuelle = salle;
                if(salleActuelle.listeJoueurs.length == 2){ // S'il y a bien deux joueurs dans la salle
                    console.log("J'envoie le maj de lancement à la salle");
                    console.log(salleActuelle.nom); // On affiche le jeu
                    io.to(salleActuelle.nom).emit('affichagePartie',salleActuelle);
                    break;
                }
            }
        }
    });

    // Socket lorsqu'un joueur décide de quitter la partie qui est en cours
    socket.on('quittePartieEnCours', () => {
        console.log("Quitter la partie reçu");
        let joueurQuittant = null;
        let salleAQuitter = null;
    
        for(const salle of salles){  // Parcourir toutes les salles
            const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);  // Recherche le joueur dans la liste des joueurs de chaque salle
            console.log(indexJoueur);
            if(indexJoueur != -1){  // Si le joueur est trouvé dans la salle
                joueurQuittant = salle.listeJoueurs[indexJoueur][0]; // Récupére le nom du joueur
                salleAQuitter = salle;
                console.log(joueurQuittant);
                console.log(salleAQuitter);
                salleAQuitter.listeJoueurs.splice(indexJoueur, 1);  // Retire le joueur de la liste des joueurs de la salle
                socket.leave(salleAQuitter.nom); // On quitte la socket actuelle
                console.log(salleAQuitter.listeJoueurs);

                // Émettre une mise à jour de la partie aux autres joueurs de la salle
                io.to(salleAQuitter.nom).emit('majPartie',salleAQuitter);

                console.log(salleAQuitter.listeJoueurs == 0);
                console.log(salleAQuitter.listeJoueurs.length == 1);
                if(salleAQuitter.listeJoueurs == 0 || salleAQuitter.listeJoueurs.length == 1){ // Si tout le monde quitte ou s'il reste
                    salles.splice(salles.indexOf(salleAQuitter),1);                            // un seul joueur, on supprime la salle
                }
                break;
            }
        }
        console.log(salles);
    });

    socket.on('discover', (data) => {
        const position = data.position;
        console.log('Position reçue du client :', position);
        let indicesAutour = determinerIndicesAutour(data.position);

        // Envoyer les instructions pour activer les hexagones autour
        socket.emit('instructionsActivation', { 'indices': indicesAutour });
    });

    socket.on('ClickHexRed', (data) => {
        const position = data.position;
        console.log('Position reçue du client :', position);
        let indicesAutour = determinerIndicesAutour(data.position);
        console.log('indicesAutour envoie au serveur :', indicesAutour);

        // Envoyer les instructions pour activer les hexagones autour
        socket.emit('instructionsRedActivation', { 'position': position, 'indices': indicesAutour });
    });

    socket.on('envoieMessage',(data) => {
        io.emit('recoitMessage',data);
    });
});

function determinerIndicesAutour(position) {
    let indicesAutour = [];
    nbLignes = 40;
    nbColonnes = 40;

    // Convertir la position en coordonnées de ligne et colonne
    let ligne = Math.floor(position / nbColonnes);
    let colonne = position % nbColonnes;

    // Coordonnées des voisins relatifs
    let voisinsRelatifs = [
        [0, -1], [0, 1], // gauche, droite
        [-1, (ligne % 2 === 0) ? 1 : 0], [-1, (ligne % 2 === 0) ? 0 : -1], // hautG, hautD
        [1, (ligne % 2 === 0) ? 1 : 0], [1, (ligne % 2 === 0) ? 0 : -1]  // basG, basD
    ];

    // Parcourir les voisins et calculer les indices
    for (let voisin of voisinsRelatifs) {
        let voisinLigne = ligne + voisin[0];
        let voisinColonne = colonne + voisin[1];

        // Calculer l'indice et l'ajouter au tableau
        let voisinIndice = voisinLigne * nbColonnes + voisinColonne;
        indicesAutour.push(voisinIndice);
    }

    return indicesAutour;
}