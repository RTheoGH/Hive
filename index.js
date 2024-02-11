const express = require('express')
const app = express()
const port = 3000
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);

const salles=[];

/* ========== Partie Express ========== */

server.listen(port, () => {
    console.log(`Serveur écoutant sur le port ${port}`);
});

/* ========== Partie Express ========== */
app.get('/',(req,res) => {
    res.sendFile('public/index.html',{root: __dirname})
})

app.get('/public/:nomFichier', (req,res) => {       // chemin permettant d'utiliser les fichiers
    res.sendFile("public/"+req.params.nomFichier,{root: __dirname});
});

/* ========== Partie Socket ========== */

io.on('connection', (socket) => {
    socket.emit("Salut c'est le serveur ! :)");
    
    socket.on('nouvelleSalle',(data) =>{
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
            salles.push(data);        // Ajout de la salle dans la liste des salles
            console.log("Salle crée : ",data);
            console.log("Liste des salles : ",salles);

            socket.join(data.code);   // Actualisation uniquement pour cette salle
            io.to(data.code).emit('majSalle',data);
        }else{
            console.log("Retour à l'accueil");
            socket.emit("sallePrise");  // Sinon on renvoit la personne à l'accueil
        }
        console.log(salles);
    });

    socket.on('tentativeRejoindre',(data) => {
        let joueurDejaPresent = false;
        let salleTrouve = false;

        for(i=0;i<salles.length;i++){
            if(data.nom == salles[i].nom){ // On trouve la salle correspondante
                salleTrouve = true;
                if(data.code==salles[i].code){
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
        
                            socket.join(data.code);  // Actualisation uniquement pour cette salle
                            io.to(data.code).emit('majSalle',salles[i]);
                            break;
                        }
                    }
                }else{
                    console.log("Le mot de passe ne corresond pas.");
                    console.log("Retour à l'accueil");
                    socket.emit("codeFaux");
                    break;
                }
            }
        }
        if(!salleTrouve){
            console.log("Cette salle n'existe pas.");
            console.log("Retour à l'accueil");
            socket.emit("salleIntrouvable");
        }
        console.log(salles);
    })

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
                socket.leave(salleAQuitter.code);
                console.log(salleAQuitter.listeJoueurs);
                // if(indexJoueur == 0){  // Si le joueur est le créateur de la salle, supprime la salle
                //     salles.splice(salles.indexOf(salleAQuitter), 1);
                // }

                // Émettre une mise à jour de la salle aux autres joueurs de la salle
                io.to(salleAQuitter.code).emit('majSalle',salleAQuitter);
                

                if(salleAQuitter.listeJoueurs == 0){
                    salles.splice(salles.indexOf(salleAQuitter),1);
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