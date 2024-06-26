// const { range } = require('d3');
import('d3').then((d3) => {
    const { range } = d3;
}).catch((error) => {
    console.error('Une erreur s\'est produite lors du chargement du module D3:', error);
});
const express = require('express')
const app = express()
const port = 3000
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);

var salles=[];
var file=[];
var matchmaking=[];
const pions = {
    'pionAbeille' : 1,'pionFourmi' : 3,
    'pionScarabee' : 2,'pionCoccinelle' : 1,
    'pionAraignee' : 2,'pionSauterelle' : 3,
    'pionMoustique' : 1
}
var etatP = false; // etat pour la recherche de partie

function randInt(max) { //renvoie un entier random entre 0 et < max
    return Math.floor(Math.random() * max);
}

// MongoDB
const mongoose = require("mongoose"); 
const Historique = require("./schema/historique.js")

// ==================================
// ========= Partie Express ========= 
// ==================================

server.listen(port, () => {
    console.log(`Serveur écoutant sur le port ${port}`);
});

app.get('/',(req,res) => {
    res.sendFile('public/index.html',{root: __dirname})
})

// chemin permettant d'utiliser les fichiers de public
app.get('/public/:nomFichier', (req,res) => {
    res.sendFile("public/"+req.params.nomFichier,{root: __dirname});
});

// chemin permettant d'utiliser les images de public
app.get('/public/images/:nomFichier', (req,res) => {       
    res.sendFile("public/images/"+req.params.nomFichier,{root: __dirname});
});

// chemin annexe d'images pour les différents fonds
app.get('/public/images/fonds/:nomFichier', (req,res) => {
    res.sendFile("public/images/fonds/"+req.params.nomFichier,{root: __dirname});
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
        if(data.nom == ''){ // Si le nom de la salle est vide
            console.log("nom de salle vide");
            socket.emit('nomVide');
        }else if(data.code == ''){ // Si le code de la salle est vide
            console.log("code de salle vide");
            socket.emit('codeVide');
        }else if(data.listeJoueurs[0][0] == ''){ // Si le nom du joueur est vide
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
                const copiePions = JSON.parse(JSON.stringify(pions));
                data.listeJoueurs[0][2] = copiePions;
                salles.push(data);       // Ajout de la salle dans la liste des salles
                console.log("Salle crée : ",data);
                console.log("Liste des salles : ",salles);
                
                if(data.listeJoueurs.length != 2){
                    socket.emit('lancerPlusDispo');
                }

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
                            const copiePions = JSON.parse(JSON.stringify(pions));
                            data.joueur[2] = copiePions;
                            salles[i].listeJoueurs.push(data.joueur);
                            salles[i]["etatPlateau"] = [];  //liste de dicos, représente les pièces par leur position, le pion et la couleur
                            salles[i]["pilesDePions"] = {};
                            salles[i]["compteurTour"] = 1;
                            salles[i]["tour"] = randInt(2);
                            console.log("C'est au tour du joueur : ",salles[i].tour);
                            console.log("Joueurs : ",salles[i].listeJoueurs);
                            
                            socket.join(data.nom);  // Actualisation uniquement pour cette salle
                            let recupMode = salles[i].mode;
                            console.log("Le mode est ",recupMode);
                            io.to(data.nom).emit("recupMode",recupMode);
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
    socket.on('lancementPartie', (extension) => {
        console.log("Lancement de Partie reçu");
        let salleActuelle = null;
        console.log("Je cherche la salle actuelle en cherchant le joueur");
        for(const salle of salles){ // Recherche de la salle
            var indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id); // Joueur qui a lancé
            console.log('Salle :',salle);
            if(indexJoueur != -1){
                salleActuelle = salle;
                if(salleActuelle.listeJoueurs.length == 2){ // S'il y a bien deux joueurs dans la salle
                    console.log("J'envoie le maj de lancement à la salle");
                    console.log(salleActuelle.nom); // On affiche le jeu
                    if (indexJoueur != 0){indexJoueur = 1-indexJoueur;}
                    io.to(salle.listeJoueurs[indexJoueur][1]).emit("genereCouleurJoueur", "white");
                    io.to(salle.listeJoueurs[1-indexJoueur][1]).emit("genereCouleurJoueur", "black");
                    io.to(salleActuelle.nom).emit('affichagePartie',{"salle" : salleActuelle, "extension" : extension});
                    console.log("liste des joueurs : ", salle.listeJoueurs);
                    console.log("tour : ", salle.tour);
                    io.to(salleActuelle.nom).emit("infosTour", {"tour" : salle.tour, "compteurTour" : Math.floor(salle.compteurTour), "joueur" : salle.listeJoueurs[salle.tour][0]});
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
                console.log("joueur qui quitte est : ", joueurQuittant);
                //met a jour le Schema winner
                J1 = salle.listeJoueurs[0][0];//copie des joueurs pour eviter un bug de synchro
                J2 = salle.listeJoueurs[1][0];
                gagnant = [].concat(salle.listeJoueurs); // copie des listes joueur pour eviter un bug de synchro
                gagnant.splice(indexJoueur,1);// enleve le joueur perdant
                (async () => {
                    try {
                        await mongoose.connect("mongodb://127.0.0.1:27017/local"); //connection
                        // await mongoose.connect("mongodb://localhost:27017/local"); // ancienne version problématique
                        console.log("Connexion réussi avec MongoDB");
                        const WinByFF = new Historique({ // nouveau tuple
                            Joueur_1 : J1,
                            Joueur_2 : J2,
                            Winner : gagnant[0][0],
                            Plateau : salle.etatPlateau
                        });
                        console.log("winbyff créer avec succés");
                        const resultat = await WinByFF.save() // insert
                        console.log(resultat);
                    }catch(error){
                        console.log(error);
                    }
                    })();
                    //Fin de maj Schema 
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

    // Socket lorsqu'un joueur quitte une partie
    socket.on("sortieDePartie", (data) => {
        socket.leave(data.nom);
    })

    // Socket lorqu'un joueur lance la recherche de partie
    socket.on('rejoindreFile', (data) => {
        console.log("Joueur en recherche :",data.joueur[1]);
        console.log("Niveau :",data.joueur[0]);
        file.push(data.joueur); // On l'ajoute dans la file
        console.log(file);
    });

    // Socket lorqu'un joueur quitte la recherche de partie
    socket.on('quitterFile', (data) => {
        let joueurQuittant = data.joueur;
        console.log("Joueur qui souhaite quitter la recherche :",joueurQuittant[1]);
        let index = file.findIndex(joueur => joueur[0] === joueurQuittant[0] && joueur[1] === joueurQuittant[1]);
        if(index !== -1){
            file.splice(index,1); // One le retire de la file
            console.log("Le joueur quitte");
        }
        console.log(file);
    });

    // Socket de réception qu'un joueur recherche (toute les 1 secondes)
    socket.on("recherchePartie", () => {
        // console.log("recherche...");
        // console.log(file);
        if(file.length >= 2){
            // console.log("L>2");
            for(i=0;i<file.length;i++){
                for(j=0;j<file.length;j++){
                    if(file[i][0] == file[j][0] && file[i][1] != file[j][1]){ // Si même niveau et pas le même joueur
                        console.log(file[i][1],"VS",file[j][1],"?");
                        let matchID = generateRandomText();
                        console.log("Match :",matchID);
                        let match = {"J1":file[i],"J2":file[j],"MatchID":matchID,"accept":[false,false]};
                        matchmaking.push(match); // On les ajoute dans la liste des 'duels' (matchmaking)
                        io.to(file[i]).emit("matchTrouve",match);
                        io.to(file[j]).emit("matchTrouve",match);
                        file.pop(file[i]); // On retire le premier de la file
                        file.pop(file[j]); // et le deuxième également

                        setTimeout(() => { // Si au bout d'un certain temps la partie n'est pas lancé
                            let leMatch = matchmaking.find(m => m.MatchID == match.MatchID);
                            if(leMatch != undefined){
                                console.log("Temps écoulé pour le match ",leMatch.MatchID);
                                matchmaking.pop(leMatch);
                                if(leMatch.accept[0]){ // Si le premier joueur n'a pas accepté
                                    console.log("J1 a accepté");
                                    file.push(leMatch.J1);
                                    io.to(leMatch.J1).emit("repriseSonFile");
                                }
                                if(leMatch.accept[1]){ // Si le deuxième joueur n'a pas accepté
                                    console.log("J2 a accepté");
                                    file.push(leMatch.J2);
                                    io.to(leMatch.J2).emit("repriseSonFile");
                                }
                            }
                        }, 13000); // Au bout de 13 secondes
                    }
                }
            }
        }
    });

    // Socket quand un joueur accepte le match trouvé
    socket.on('accepterMatch', (data) => {
        console.log(data.joueur[1],"accepte");
        matchmaking = matchmaking.map(match => {
            if (match.MatchID === data.matchID) { // Vérifie si l'id correspond
                if(data.joueur[2] == match.J1[2]){ // Si le joueur 1 accepte on le passe à true
                    match.accept[0] = true;
                }else{ // Sinon on passe le joueur 2 a true
                    match.accept[1] = true;
                }
            }
            return match;
        });
        console.log(matchmaking);
        let matchPop = matchmaking.find(match => match.MatchID == data.matchID);
        if(matchPop.accept[0] == true && matchPop.accept[1] == true){ // SI les deux ont acceptés ([true,true])
            console.log(matchPop);
            const copiePionsJ1 = JSON.parse(JSON.stringify(pions));
            const copiePionsJ2 = JSON.parse(JSON.stringify(pions));
            let nouvelle_salle = {"nom":matchPop.MatchID,"code":"","listeJoueurs":[[matchPop.J1[1],matchPop.J1[2],copiePionsJ1],[matchPop.J2[1],matchPop.J2[2],copiePionsJ2]],"type":"VS","mode":"extension2", "etatPlateau":[], "pilesDePions" : {}, "tour":randInt(2), "compteurTour":1};
            salles.push(nouvelle_salle); // On crée et ajoute la nouvelle salle dans les salles
            let cpt = 0; // compteur pour éviter de lancer deux fois la partie (voir socket suivante)
            io.to(matchPop.J1).emit('clientJoin', {"salle":nouvelle_salle,"cpt":cpt}); // On fait rejoindre le joueur 1
            cpt++;
            io.to(matchPop.J2).emit('clientJoin', {"salle":nouvelle_salle,"cpt":cpt}); // On fait rejoindre le joueur 2
            matchmaking.pop(matchPop);
            console.log(salles);
        }
    });

    // Socket pour rejoindre une partie crée par le matchmaking
    socket.on("joinRoom", (data) => {
        console.log("connexion à la salle",data);
        console.log("cpt :",data.cpt);
        socket.join(data.salle.nom);
        // La suite correspond au compteur précédent utilisé afin de ne pas lancer deux fois la partie, combiné avec etatP
        if(data.cpt == 0) {
            if(!etatP){
                io.to(data.salle.nom).emit('lancementR');
                etatP = true;
                console.log("cpt:0, etatP:false");
            }else{
                io.to(data.salle).emit('affichagePartie');
                etatP = false;
                console.log("cpt:0, etatP:true");
            }
        }
        if(data.cpt == 1){
            if(!etatP){
                io.to(data.salle.nom).emit('lancementR');
                etatP = true;
                console.log("cpt:1, etatP:false");
            }else{
                io.to(data.salle).emit('affichagePartie');
                etatP = false;
                console.log("cpt:1, etatP:true");
            }
        }
    });

    socket.on('ClickHexRed', (data) => {
        const position = data.position;
        console.log('Position reçue du client :', position);
        let indicesAutour = determinerIndicesAutour(data.position);
        console.log('indicesAutour envoie au serveur :', indicesAutour);

        // Envoyer les instructions pour activer les hexagones autour
        socket.emit('instructionsRedActivation', { 'position': position, 'indices': indicesAutour });
    });

    socket.on("EnvoiPoserPionPlateau", (data) => {
        //console.log(data);
        parcoursDesSalles:
        for(salle of salles){
            for(joueur of salle.listeJoueurs){
                if(joueur[1] == socket.id && joueur[2][data["pion"]] > 0){
                    const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);
                    //check si c'est le tour du joueur
                    if(salle.tour == indexJoueur){
                        let peutPlacer = true;
                        for(let p of salle.etatPlateau){
                            //console.log("position : ",  p.position, "c :", data.case);
                            if(p.position == data.case){
                                console.log("cas où la case est déjà prise");
                                peutPlacer = false;
                                io.to(socket.id).emit("caseDejaPrise");
                                break;
                            }
                        }
                        //check si le pion est joué autour d'un pion de sa couleur
                        if(salle.compteurTour >= 2){
                            let indice = data.case.replace("h", "");
                            console.log("indice : ",indice);
                            peutPlacer = peutPlacer && checkPeutPlacer(indice, salle.etatPlateau, indexJoueur, salle.compteurTour);
                        }
                        if(salle.compteurTour >= 3 && data.pion != "pionAbeille" && joueur[2]["pionAbeille"] != 0){
                            peutPlacer = false;
                            io.to(socket.id).emit("placerAbeille");
                        }
                        if(peutPlacer){
                            //gestion pions restants
                            joueur[2][data["pion"]] --;
                            io.to(joueur[1]).emit('envoiNombrePionsRestants', joueur[2]);
                            //gestion pour révéler le plateau
                            io.to(salle.nom).emit('instructionsActivation', { 'indices': determinerIndicesAutour(data.case.replace("h", ""))});
                            //gestion pour poser pion
                            data.couleur = ["white", "black"][indexJoueur];
                            data.joueur = joueur[0];
                            stockePion = {"position" : data.case, "pion" : data.pion, "couleur" : data.couleur, "jeton" : data.jeton};
                            salle.etatPlateau.push(stockePion);
                            //console.log("Etat du plateau stocké sur le serveur :",etatPlateau);
                            io.to(socket.id).emit("UnhighlightCases");
                            io.to(salle.nom).emit("ReceptPoserPionPlateau", data);
                            let joueurGagnant = victoire(salle.etatPlateau);
                            console.log("gagnant : ",joueurGagnant);
                            if(joueurGagnant != false){ // Si la fonction de victoire() renvoie autre chose que false.
                                console.log("Toujours la ?");
                                if(joueurGagnant == "egalite"){ // Si on a une égalité
                                    io.to(salle.nom).emit("victoire", {
                                        "egalite1" : salle.listeJoueurs[0],
                                        "egalite2" : salle.listeJoueurs[1]
                                    });
                                    let g = joueurGagnant ;
                                    let un = salle.listeJoueurs[0];
                                    let deux = salle.listeJoueurs[1];
                                    let plat = salle.etatPlateau;
                                    declareWin(g,un,deux,plat);
                                    console.log("Equalité");
                                }else{ //  Si on a un gagnant et un perdant, si 'white' -> gagnant J1, si 'black' -> gagnant J2
                                    console.log(salle.listeJoueurs[0],"\n",salle.listeJoueurs[1]);
                                    io.to(salle.nom).emit("victoire", {
                                        "gagnant" : joueurGagnant == "white" ? salle.listeJoueurs[0] : salle.listeJoueurs[1],
                                        "perdant" : joueurGagnant == "white" ? salle.listeJoueurs[1] : salle.listeJoueurs[0]
                                    });
                                    let g = joueurGagnant == "white" ? salle.listeJoueurs[0] : salle.listeJoueurs[1];
                                    let un = salle.listeJoueurs[0];
                                    let deux = salle.listeJoueurs[1];
                                    let plat = salle.etatPlateau;
                                    declareWin(g,un,deux,plat);
                                    console.log("Victoire/Défaite");
                                }
                                // Après avoir annoncé la victoire on retire les joueurs de la salle.
                                for (let i = 0; i < salle.listeJoueurs.length+1; i++) {
                                    console.log("i :",i);
                                    let index = salle.listeJoueurs.indexOf(salle.listeJoueurs[i]);
                                    console.log(index);
                                    if (index !== -1) {
                                        console.log(salle.listeJoueurs.splice(index, 1));
                                        salle.listeJoueurs.splice(index, 1);
                                        socket.leave(salle.nom);
                                    }
                                    console.log(salle.listeJoueurs);
                                }
                                console.log(salles);
                                salles.splice(salle,1); // On retire la salle une fois tout le monde parti.
                                console.log(salles);
                            }
                            //gestion tour
                            salle.tour = 1-indexJoueur;
                            salle.compteurTour += 0.5;
                            io.to(salle.nom).emit("infosTour", {"tour" : salle.tour, "compteurTour" : Math.floor(salle.compteurTour), "joueur" : salle.listeJoueurs[salle.tour][0]});
                        }
                        else{
                            console.log("le pion n'a pas pu être placé");
                        }
                    }
                    else if(salle.tour != indexJoueur){
                        io.to(socket.id).emit("pasTonTour");
                    }
                    break parcoursDesSalles;
                }
            }
        }
    });

    socket.on("afficheCasesJouables", () => {
        parcoursDesSalles:
        for(let salle of salles){
            for(let joueur of salle.listeJoueurs){
                if(joueur[1] == socket.id){
                    const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);
                    if(indexJoueur == salle.tour){
                        console.log("plateau : ", salle.etatPlateau);
                        let listeCasesVides = [];
                        if(salle.compteurTour != 1){
                            for(let p of salle.etatPlateau){
                                let indice = p.position.replace("h", "");
                                let voisins = determinerIndicesAutour(indice);
                                for(let v of voisins){
                                    let estUnPionPlace = false;
                                    for(c of salle.etatPlateau){
                                        if(c.position == "h"+v){
                                            estUnPionPlace = true;
                                            break;
                                        }
                                    }
                                    if(!estUnPionPlace){
                                        peutPlacer = checkPeutPlacer(v, salle.etatPlateau, indexJoueur, salle.compteurTour);
                                        if(!listeCasesVides.includes(v) && peutPlacer){
                                            listeCasesVides.push(v);
                                        }
                                    }
                                }
                            }
                        }
                        else{listeCasesVides = [820];}
                        // console.log("liste des cases jouables :", listeCasesVides);
                        io.to(socket.id).emit("HighlightCasesJouables", listeCasesVides);
                        break parcoursDesSalles;
                    }
                }
        }}
    });

    socket.on("highlightDeplacement", (data) => {
        parcoursDesSalles:
        for(let salle of salles){
            for(let joueur of salle.listeJoueurs){
                if(joueur[1] == socket.id){
                    const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);
                    //console.log(indexJoueur);
                    if(indexJoueur == salle.tour){
                        //console.log("plateau :", salle.etatPlateau);
                        let couleurs = {};
                        let bonneCouleur = true;
                        for(p of salle.etatPlateau){
                            if(data.casesDisponibles.toString().includes(p.position.replace("h", ""))){
                                couleurs[p.position] = p.couleur;
                                //console.log("J'ai trouvé le pion, sa couleur est : ", p.couleur)
                            }
                            if(p.position == data.pionOrigine && p.couleur != ["white", "black"][indexJoueur]){
                                bonneCouleur = false;
                            }
                        }
                        if(bonneCouleur){
                            console.log("couleurs :",couleurs)
                            io.to(socket.id).emit("recupHighlightDeplacement", {"cases" : data.casesDisponibles, "couleurs" : couleurs});
                        }
                        else{
                            io.to(socket.id).emit("pasTonPion");
                        }
                    }
                    else{
                        io.to(socket.id).emit("pasTonTour");
                    }
                    break parcoursDesSalles;
                }
            }
        }
    });

    socket.on("deplacerPion", (data) => {
        //console.log("entrée dans le socket deplacerPion")
        //if(validerDeplacementJeton(data.damier,data.caseOrigine,data.caseArrivee,data.typePion)){
        console.log("Validation mouvement du pion");
        parcoursDesSalles:
        for(let salle of salles){
            for(let joueur of salle.listeJoueurs){
                if(joueur[1] == socket.id){
                    const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);
                    if(indexJoueur == salle.tour){
                        console.log("plateau :", salle.etatPlateau);
                        console.log("Case d'origine :", data.caseOrigine);
                        bouclePilePions:
                        for(pion of salle.etatPlateau){
                            if(pion.position == data.caseArrivee){
                                for(p of salle.etatPlateau){ //pour récupérer les données du pion à déplacer
                                    if(p.position == data.caseOrigine){
                                        console.log("cas où on fait une pile de pion");
                                        if(Object.keys(salle.pilesDePions).includes(pion.position)){
                                            salle.pilesDePions[pion.position].push();
                                        }
                                        else{
                                            salle.pilesDePions[pion.position] = [pion, p] //liste des pions du plut bas au plus haut
                                        }
                                        break bouclePilePions;
                                    }
                                }
                            }
                        }
                        for(pion of salle.etatPlateau){
                            if(data.caseOrigine == pion.position){
                                if(salle.compteurTour >= 3 && pion.pion != "pionAbeille" && joueur[2]["pionAbeille"] != 0){
                                    io.to(socket.id).emit("placerAbeille");
                                }else{
                                    console.log("keys des piles : ", salle.pilesDePions, "pion.position : ", pion.position);
                                    if(!Object.keys(salle.pilesDePions).includes(pion.position)){
                                        console.log("j'ai trouvé le pion à changer")
                                        pion.position = data.caseArrivee;
                                        salle.tour = 1 - indexJoueur;
                                        salle.compteurTour += 0.5;
                                        io.to(salle.nom).emit("ReceptDeplacerPion", {"caseOrigine" : data.caseOrigine, "caseArrivee" : data.caseArrivee, "pionDeplace" : pion.pion, "couleurPionDeplace" : pion.couleur, "pionEnDessous" : null, "couleurPionEnDessous" : "none", "joueur" : joueur[0]});
                                        io.to(salle.nom).emit("infosTour", {"tour" : salle.tour, "compteurTour" : Math.floor(salle.compteurTour), "joueur" : salle.listeJoueurs[salle.tour][0]});
                                        let joueurGagnant = victoire(salle.etatPlateau);
                                        console.log("gagnant :", joueurGagnant);
                                        if(joueurGagnant != false){ // Si la fonction de victoire() renvoie autre chose que false.
                                            console.log("Toujours la ?");
                                            if(joueurGagnant == "egalite"){ // Si on a une égalité
                                                io.to(salle.nom).emit("victoire", {
                                                    "egalite1" : salle.listeJoueurs[0],
                                                    "egalite2" : salle.listeJoueurs[1]
                                                });
                                                let g = joueurGagnant ;
                                                let un = salle.listeJoueurs[0];
                                                let deux = salle.listeJoueurs[1];
                                                let plat = salle.etatPlateau;
                                                declareWin(g,un,deux,plat);
                                                console.log("Equalité");
                                            }else{ //  Si on a un gagnant et un perdant, si 'white' -> gagnant J1, si 'black' -> gagnant J2
                                                console.log(salle.listeJoueurs[0],"\n",salle.listeJoueurs[1]);
                                                io.to(salle.nom).emit("victoire", {
                                                    "gagnant" : joueurGagnant == "white" ? salle.listeJoueurs[0] : salle.listeJoueurs[1],
                                                    "perdant" : joueurGagnant == "white" ? salle.listeJoueurs[1] : salle.listeJoueurs[0]
                                                });
                                                let g = joueurGagnant == "white" ? salle.listeJoueurs[0] : salle.listeJoueurs[1];
                                                let un = salle.listeJoueurs[0];
                                                let deux = salle.listeJoueurs[1];
                                                let plat = salle.etatPlateau;
                                                declareWin(g,un,deux,plat);
                                                console.log("Victoire/Défaite");
                                            }
                                            // Après avoir annoncé la victoire on retire les joueurs de la salle.
                                            for (let i = 0; i < salle.listeJoueurs.length+1; i++) {
                                                console.log("i :",i);
                                                let index = salle.listeJoueurs.indexOf(salle.listeJoueurs[i]);
                                                console.log(index);
                                                if (index !== -1) {
                                                    console.log(salle.listeJoueurs.splice(index, 1));
                                                    salle.listeJoueurs.splice(index, 1);
                                                    socket.leave(salle.nom);
                                                }
                                                console.log(salle.listeJoueurs);
                                            }
                                            console.log(salles);
                                            salles.splice(salle,1); // On retire la salle une fois tout le monde parti.
                                            console.log(salles);
                                        }
                                        break;
                                    }else{
                                        let pionEnHautDeLaPile = salle.pilesDePions[pion.position][(salle.pilesDePions[pion.position]).length - 1];
                                        console.log("en haut de la pile :", pionEnHautDeLaPile);
                                        if(pionEnHautDeLaPile.position == data.caseOrigine){
                                            console.log("j'ai trouvé le pion à changer 2")
                                            let pionDuDessous = salle.pilesDePions[pion.position][(salle.pilesDePions[pion.position]).length - 2];
                                            pion.position = data.caseArrivee;
                                            salle.tour = 1 - indexJoueur;
                                            salle.compteurTour += 0.5;
                                            io.to(salle.nom).emit("ReceptDeplacerPion", {"caseOrigine" : data.caseOrigine, "caseArrivee" : data.caseArrivee, "pionDeplace" : pionEnHautDeLaPile.pion, "couleurPionDeplace" : pionEnHautDeLaPile.couleur, "pionEnDessous" : pionDuDessous.pion, "couleurPionEnDessous" : pionDuDessous.couleur,"joueur" : joueur[0]});
                                            io.to(salle.nom).emit("infosTour", {"tour" : salle.tour, "compteurTour" : Math.floor(salle.compteurTour), "joueur" : salle.listeJoueurs[salle.tour][0]});
                                            let joueurGagnant = victoire(salle.etatPlateau);
                                            console.log("gagnant :", joueurGagnant);
                                            if(joueurGagnant != false){ // Si la fonction de victoire() renvoie autre chose que false.
                                                console.log("Toujours la ?");
                                                if(joueurGagnant == "egalite"){ // Si on a une égalité
                                                    io.to(salle.nom).emit("victoire", {
                                                        "egalite1" : salle.listeJoueurs[0],
                                                        "egalite2" : salle.listeJoueurs[1]
                                                    });
                                                    let g = joueurGagnant ;
                                                    let un = salle.listeJoueurs[0];
                                                    let deux = salle.listeJoueurs[1];
                                                    let plat = salle.etatPlateau;
                                                    declareWin(g,un,deux,plat);
                                                    console.log("Equalité");
                                                }else{ //  Si on a un gagnant et un perdant, si 'white' -> gagnant J1, si 'black' -> gagnant J2
                                                    console.log(salle.listeJoueurs[0],"\n",salle.listeJoueurs[1]);
                                                    io.to(salle.nom).emit("victoire", {
                                                        "gagnant" : joueurGagnant == "white" ? salle.listeJoueurs[0] : salle.listeJoueurs[1],
                                                        "perdant" : joueurGagnant == "white" ? salle.listeJoueurs[1] : salle.listeJoueurs[0]
                                                        
                                                    });
                                                    let g = joueurGagnant == "white" ? salle.listeJoueurs[0] : salle.listeJoueurs[1];
                                                    let un = salle.listeJoueurs[0];
                                                    let deux = salle.listeJoueurs[1];
                                                    let plat = salle.etatPlateau;
                                                    declareWin(g,un,deux,plat);
                                                    console.log("Victoire/Défaite");
                                                }
                                                // Après avoir annoncé la victoire on retire les joueurs de la salle.
                                                for (let i = 0; i < salle.listeJoueurs.length+1; i++) {
                                                    console.log("i :",i);
                                                    let index = salle.listeJoueurs.indexOf(salle.listeJoueurs[i]);
                                                    console.log(index);
                                                    if (index !== -1) {
                                                        console.log(salle.listeJoueurs.splice(index, 1));
                                                        salle.listeJoueurs.splice(index, 1);
                                                        socket.leave(salle.nom);
                                                    }
                                                    console.log(salle.listeJoueurs);
                                                }
                                                console.log(salles);
                                                salles.splice(salle,1); // On retire la salle une fois tout le monde parti.
                                                console.log(salles);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }else{
                        io.to(socket.id).emit("pasTonTour");
                    }
                    break parcoursDesSalles;
                }
            }
        }
    //}
    });

    // Socket de réception lorsqu'un joueur envoie un message dans le chat textuel
    socket.on('envoieMessage',(data) => {
        for(const salle of salles){
            const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);
            data.idJ = indexJoueur;
            console.log(indexJoueur);
            if(indexJoueur != -1){
                console.log("j'envoie le message à la salle :",salle.nom);
                io.to(salle.nom).emit('recoitMessage',data); // On renvoit le message à tout les joueurs de la salle
            }
        }
    });
});

// Générateur de nom de salle aléatoire
function generateRandomText() {
    let text = "";
    const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < 10; i++) { // On met 10 caractères afin d'éviter qu'une salle est le même nom qu'une autre
        const randomIndex = Math.floor(Math.random() * possibleChars.length); // Le risque 0 n'existe pas néanmoins
        text += possibleChars.charAt(randomIndex);
    }
    return text;
}

// Fonction principale qui calcule si un joueur gagne la partie
function victoire(plateau){
    let victoireWhite = false;
    let victoireBlack = false;
    for(pion of plateau){
        if(pion.pion == "pionAbeille"){
            let abeilleEntouree = true;
            for(let c of determinerIndicesAutour(pion.position.replace("h", ""))){
                // console.log("c :", c);
                let caseTrouvee = false;
                for(p of plateau){ //check si chaque case autour est bien remplie
                    if(p.position == "h"+c){
                        caseTrouvee = true;
                    }
                }
                abeilleEntouree = abeilleEntouree && caseTrouvee;
            }
            if(abeilleEntouree){
                (pion.couleur == "white") ? victoireBlack = true : victoireWhite = true;
            }
        }
    }
    if(victoireBlack && victoireWhite) return "egalite"; // Envoyer égalité
    if(victoireBlack) return "black"; // Envoyer victoire black
    if(victoireWhite) return "white"; // envoyer victoire white
    return false;
}

function declareWin(g,un,deux,plat){
    (async () => {
        try {
            await mongoose.connect("mongodb://127.0.0.1:27017/local"); //connection
            // await mongoose.connect("mongodb://localhost:27017/local"); // ancienne version problématique
            console.log("Connexion réussi avec MongoDB");
            const Win = new Historique({ // nouveau tuple
                Joueur_1 : un[0],
                Joueur_2 : deux[0],
                Winner : g == "egalite" ? "Egalité": g[0] ,
                Plateau : plat
            });
            console.log("winbyff créer avec succés");
            const resultat = await Win.save() // insert
            console.log(resultat);
        }catch(error){
            console.log(error);
        }
        })();
}

function determinerIndicesAutour(position) {
    // rend toutes les cases autour de la position
    let indicesAutour = [];
    let nbColonnes = 40;

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

function determinerIndicesADistance(position, distance) { 
    // rend toutes les cases exterieur du rayon distance
    // n'est normalement plus utilisé mais peux servir
    let indices = [];
    const nbColonnes = 40; // Nombre de colonnes dans le damier
    const nbLignes = 40; // Nombre de lignes dans le damier

    // Convertir la position en coordonnées de ligne et de colonne
    const ligne = Math.floor(position / nbColonnes);
    const colonne = position % nbColonnes;

    // Coordonnées des voisins relatifs jusqu'à la distance donnée
    for (let i = -distance; i <= distance; i++) {
        for (let j = -distance; j <= distance; j++) {
            // Vérifier si les coordonnées sont dans les limites du damier
            if (ligne + i >= 0 && ligne + i < nbLignes && colonne + j >= 0 && colonne + j < nbColonnes) {
                // Calculer l'indice de la case et l'ajouter au tableau
                const indice = (ligne + i) * nbColonnes + (colonne + j);
                indices.push(indice);
            }
        }
    }

    return indices;
}

function checkPeutPlacer(casePossible, pionsPlateau, indexJoueur, tour){
    let peutPlacer = true;
    const c = JSON.parse(JSON.stringify(casePossible));
    let casesVoisines = determinerIndicesAutour(c);
    
    checkCouleurAutour:
    for(let vi of casesVoisines){
        for(let p of pionsPlateau){
            if(p.position == "h"+vi && ["white", "black"][1-indexJoueur] == p.couleur && tour >= 2){
                peutPlacer = false;
                break checkCouleurAutour;
            }
            else if(tour < 2) peutPlacer = true;
        }
    }
    return peutPlacer;
}

function determinerIndicesLigne(positionDepart, positionArrive) {
    // rend une liste de liste contenant les position des cases sur la ligne et diagonales (HG, HD, BG, BD)
    let indices = [];

    // pour détérminer les cases de la ligne 
    let indiLigne = [];
    if(position%40==0){
        for(i of range(39))
        indiLigne.push(position+i);
    }
    else{
        let posTemp = position;
        let i = 1;
        while(posTemp%40!=0){
            indiLigne.push(posTemp-i);
            i+=1;
        }
        indiLigne.push(posTemp-i);
    }
    indices.push(indiLigne);

    // pour détérminer les cases des colonnes
    let posTempCol = position;
    while(posTempCol%40!=0){
        posTempCol-=1;
    }
    if(posTempCol%80==0){lignePairBase = true}
    else{lignePairBase = false}

    // case en haut a gauche
    let indiHG = [];
    let lignePair = lignePairBase;
    let addHG;
    if(lignePair) addHG = position - 41;
    else addHG = position - 40;
    while(addHG >= 0){
        if(lignePair){
            indiHG.push(addHG);
            addHG - 40;
            lignePair = !lignePair;
        }
        else{
            indiHG.push(addHG);
            addHG - 41;
            lignePair = !lignePair;
        }
    }
    indices.push(indiHG);

    // case en haut a droite
    let indiHD = [];
    lignePair = lignePairBase;
    let addHD;
    if(lignePair) addHD = position - 40;
    else addHD = position - 39;
    while(addHD >= 0){
        if(lignePair){
            indices.push(addHD);
            addHD - 39;
            lignePair = !lignePair;
        }
        else{
            indices.push(addHD);
            addHD - 40;
            lignePair = !lignePair;
        }
    }
    indices.push(indiHD);

    // case en bas a gauche
    let indiBG = [];
    lignePair = lignePairBase;
    let addBG;
    if(lignePair) addBG = position + 39;
    else addBG = position + 40;
    while(addBG >= 0){
        if(lignePair){
            indices.push(addBG);
            addBG + 40;
            lignePair = !lignePair;
        }
        else{
            indices.push(addBG);
            addBG + 39;
            lignePair = !lignePair;
        }
    }
    indices.push(indiBG);

    // case en bas a droite
    let indiBD = [];
    lignePair = lignePairBase;
    let addBD;
    if(lignePair) addBD = position + 40;
    else addBD = position + 41;
    while(addBD >= 0){
        if(lignePair){
            indices.push(addBD);
            addBD + 41;
            lignePair = !lignePair;
        }
        else{
            indices.push(addBD);
            addBD + 40;
            lignePair = !lignePair;
        }
    }
    indices.push(indiBD);

    return indices;
}

function validerDeplacementJeton(damier, positionActuelle1, positionCible1, typeJeton) {
    console.log("entrée dans la fonction validerDeplacementJeton")
    console.log("damier : " + damier);
    console.log("positionActuelle1 : " + positionActuelle1 + " positionCible1 : " + positionCible1);
    let positionActuelle = positionActuelle1.substring(1);
    let positionCible = positionCible1.substring(1);
    console.log("positionActuelle : " + positionActuelle + " positionCible : " + positionCible);
    let indicesAutour = determinerIndicesAutour(positionActuelle);
    let indiceAutourCible = determinerIndicesAutour(positionCible);
    for(position of positionCible){
        if(position == positionActuelle){
            indiceAutourCible.pop(positionActuelle);
        }
    }
    console.log("typeJeton début fonction valider déplacement : " + typeJeton);
    console.log("typeof : " + typeof typeJeton);
    switch (typeJeton){
        case 'Abeille' :
            console.log("dans l'abeille");
            console.log("indicesAutour : " + indicesAutour);
            for(position of indicesAutour){
                console.log("positionCible == position : "+ positionCible + "==" + position + " ? " + positionCible == position );
                if(positionCible == position ){
                    console.log("damier[positionCible] : " + damier[positionCible]);
                    for (var prop in damier[positionCible]) {
                        console.log("prop : " + prop);
                        if (prop === 'jeton') {
                            var jeton = damier[positionCible].jeton;
                            console.log("jeton : " +jeton);
                            break;
                        }
                    }
                    console.log("Abeille premier if valider ! \n damier[positionCible].attr('jeton') == 'vide' : " + damier[positionCible].attr('jeton'));
                    if(damier[positionCible].attr('jeton') == "vide"){
                        console.log("On a trouvé la positionCible aux alentours ! " + position + " attendu : " + positionCible);
                        indiceAutourCible.pop(positionActuelle);
                        for(indice of indiceAutourCible){
                            console.log("Abeille dernière étape ! Pitié qqn a côté ? " + damier[indice].attr('jeton'));
                            if(damier[indice].attr('jeton') != "vide"){
                                return true;
                            }
                        }
                    }
                }
            }
            return false
        
        case 'Araignee' :
            let casesAutourAraignee1 = [];
            let casesAutourAraignee2 = [];
            let casesAutourAraigneeFinal = [];
            if(damier[positionCible].attr('jeton') == "vide"){
                for(indice1 of indicesAutour){
                    if(damier[indice1].attr('jeton') == "vide"){
                        casesAutourAraignee1.push(indice1);
                    }
                }
                for(indice2 of casesAutourAraignee1){
                    let casesAutourTemp2 = determinerIndicesAutour(indice2);
                    for(indiceTemp2 of casesAutourTemp2){
                        if(damier[indiceTemp2].attr('jeton') == "vide"){
                            casesAutourAraignee2.push(indiceTemp2);
                        }
                    }
                }

                for(indicef of casesAutourAraignee2){
                    let casesAutourTempf = determinerIndicesAutour(indicef);
                    for(indiceTempf of casesAutourTempf){
                        if(damier[indiceTempf].attr('jeton') == "vide"){
                            casesAutourAraigneeFinal.push(indiceTempf);
                        }
                    }
                }

                for(indiceFinal of casesAutourAraigneeFinal){
                    if(indiceFinal == positionCible) return true;
                }
            }
            return false;

        case 'Coccinelle' :
            let casesAutourCocinelle1 = [];
            let casesAutourCocinelle2 = [];
            let casesAutourCocinelleFinal = [];
            if(damier[positionCible].attr('jeton') == "vide"){
                for(indice1 of indicesAutour){
                    if(damier[indice1].attr('jeton') =! "vide"){
                        casesAutourCocinelle1.push(indice1);
                    }
                }
                for(indice2 of casesAutourCocinelle1){
                    let casesAutourTemp2 = determinerIndicesAutour(indice2);
                    for(indiceTemp2 of casesAutourTemp2){
                        if(damier[indiceTemp2].attr('jeton') =! "vide"){
                            casesAutourCocinelle2.push(indiceTemp2);
                        }
                    }
                }

                for(indicef of casesAutourCocinelle2){
                    let casesAutourTempf = determinerIndicesAutour(indicef);
                    for(indiceTempf of casesAutourTempf){
                        if(damier[indiceTempf].attr('jeton') == "vide"){
                            casesAutourCocinelleFinal.push(indiceTempf);
                        }
                    }
                }

                for(indiceFinal of casesAutourCocinelleFinal){
                    if(indiceFinal == positionCible) return true;
                }
            }
            return false;

        case 'Fourmi' :
            if(damier[positionCible].attr('jeton') == "vide"){
                if(indiceAutourCible.includes(positionActuelle)) indiceAutourCible.pop(positionActuelle);
                for(indice of indiceAutourCible){
                    if(damier[indice].attr('jeton') != "vide"){
                        return true;
                    }
                }
            }
            return false;
        
        case 'Moustique' :
            let listeMoustique = [];
            for(indice of indicesAutour){
                if(damier[indice].attr('jeton') != "vide" && !listeMoustique.includes(damier[indice].attr('jeton')))
                listeMoustique.push(damier[indice].attr('jeton'));
            }
            for(pionMoustique of listeMoustique){
                if(validerDeplacementJeton(damier, positionActuelle, positionCible, pionMoustique))
                return true;
            }
            return false;

        case 'Sauterelle' :
            if(damier[positionCible].attr('jeton') == "vide"){
                if(indiceAutourCible.includes(positionActuelle)) indiceAutourCible.pop(positionActuelle);

                let indicesSauterelle = determinerIndicesLigne(positionActuelle);
                for(ligne of indicesSauterelle){
                    if(damier[ligne[0]].attr('jeton') != "vide"){
                    for(indiceCheck of ligne){
                        if(damier[indiceCheck].attr('jeton') == "vide" && indiceCheck == positionCible )
                            return true;
                        }
                    }
                }
            }
            return false;

        case 'Scarabee' :
            for(indiceD of indicesAutour){
                if(positionCible == indice){
                    for(indiceC of indiceAutourCible){
                        if(damier[indiceC].attr('jeton') != "vide"){
                            return true;
                        }
                    }
                }
            }
            return false;
    }
    return false;
}
