const { range } = require('d3');
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
var etatP = false;

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

    socket.on("sortieDePartie", (data) => {
        socket.leave(data.nom);
    })

    socket.on('rejoindreFile', (data) => {
        console.log("Joueur en recherche :",data.joueur[1]);
        console.log("Niveau :",data.joueur[0]);
        file.push(data.joueur);
        console.log(file);
    });

    socket.on('quitterFile', (data) => {
        let joueurQuittant = data.joueur;
        console.log("Joueur qui souhaite quitter la recherche :",joueurQuittant[1]);
        let index = file.findIndex(joueur => joueur[0] === joueurQuittant[0] && joueur[1] === joueurQuittant[1]);
        if(index !== -1){
            file.splice(index,1);
            console.log("Le joueur quitte");
        }
        console.log(file);
    });

    socket.on("recherchePartie", () => {
        // console.log("recherche...");
        // console.log(file);
        if(file.length >= 2){
            // console.log("L>2");
            for(i=0;i<file.length;i++){
                for(j=0;j<file.length;j++){
                    if(file[i][0] == file[j][0] && file[i][1] != file[j][1]){
                        console.log(file[i][1],"VS",file[j][1],"?");
                        let matchID = generateRandomText();
                        console.log("Match :",matchID);
                        let match = {"J1":file[i],"J2":file[j],"MatchID":matchID,"accept":[false,false]};
                        matchmaking.push(match);
                        io.to(file[i]).emit("matchTrouve",match);
                        io.to(file[j]).emit("matchTrouve",match);
                        file.pop(file[i]);
                        file.pop(file[j]);

                        setTimeout(() => {
                            let leMatch = matchmaking.find(m => m.MatchID == match.MatchID);
                            if(leMatch != undefined){
                                console.log("Temps écoulé pour le match ",leMatch.MatchID);
                                matchmaking.pop(leMatch);
                                if(leMatch.accept[0]){
                                    console.log("J1 a accepté");
                                    file.push(leMatch.J1);
                                    io.to(leMatch.J1).emit("repriseSonFile");
                                    // console.log(file);
                                }
                                if(leMatch.accept[1]){
                                    console.log("J2 a accepté");
                                    file.push(leMatch.J2);
                                    io.to(leMatch.J2).emit("repriseSonFile");
                                }
                            }
                        }, 13000);
                    }
                }
            }
        }
    });

    socket.on('accepterMatch', (data) => {
        console.log(data.joueur[1],"accepte");
        matchmaking = matchmaking.map(match => {
            // Vérifier si l'id correspond à celui que nous voulons mettre à jour
            if (match.MatchID === data.matchID) {
                // Si la condition est remplie, mettre à jour la propriété accept
                if(data.joueur[2] == match.J1[2]){
                    match.accept[0] = true;
                }else{
                    match.accept[1] = true;
                }
            }
            // Retourner l'objet, modifié ou non
            return match;
        });
        console.log(matchmaking);
        let matchPop = matchmaking.find(match => match.MatchID == data.matchID);
        if(matchPop.accept[0] == true && matchPop.accept[1] == true){
            console.log(matchPop);
            const copiePions = JSON.parse(JSON.stringify(pions));
            let nouvelle_salle = {"nom":matchPop.MatchID,"code":"","listeJoueurs":[[matchPop.J1[1],matchPop.J1[2],copiePions],[matchPop.J2[1],matchPop.J2[2],copiePions]],"type":"VS","mode":"extension2"}
            salles.push(nouvelle_salle);
            let cpt = 0;
            // console.log("1-compteur à ",cpt);
            io.to(matchPop.J1).emit('clientJoin', {"salle":nouvelle_salle,"cpt":cpt});
            cpt++;
            // console.log("2-compteur à ",cpt);
            io.to(matchPop.J2).emit('clientJoin', {"salle":nouvelle_salle,"cpt":cpt});
            matchmaking.pop(matchPop);
            // console.log(matchmaking);
            console.log(salles);
        }
    });

    socket.on("joinRoom", (data) => {
        console.log("connexion à la salle",data);
        console.log("cpt :",data.cpt);
        socket.join(data.salle.nom);
        // let etatP = false;
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

    socket.on('discover', (data) => {
        const position = data.position;
        console.log('Position reçue du client :', position);
        let indicesAutour = determinerIndicesAutour(data.position);
        parcoursDesSalles:
        for(salle of salles){
            for(joueur of salle.listeJoueurs){
                if(joueur.includes(socket.id)){
                    // Envoyer les instructions pour activer les hexagones autour
                    io.to(salle.nom).emit('instructionsActivation', { 'indices': indicesAutour });
                    break parcoursDesSalles;
        }}}
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
        parcoursDesSalles:
        for(salle of salles){
            for(joueur of salle.listeJoueurs){
                if(joueur[1] == socket.id && joueur[2][data["pion"]] > 0){
                    joueur[2][data["pion"]] --;
                    console.log(joueur[2]);
                    io.to(joueur[1]).emit('envoiNombrePionsRestants', joueur[2]);
                    const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);
                    data.couleur = ["white", "black"][indexJoueur];
                    console.log("Pour le joueur", indexJoueur, ", la couleur est", data.couleur);
                    data.joueur = indexJoueur + 1;
                    io.to(salle.nom).emit("ReceptPoserPionPlateau", data);
                    break parcoursDesSalles;
                }
            }
        }
    });

    socket.on('envoieMessage',(data) => {
        for(const salle of salles){
            const indexJoueur = salle.listeJoueurs.findIndex(joueur => joueur[1] == socket.id);
            data.idJ = indexJoueur;
            console.log(indexJoueur);
            if(indexJoueur != -1){
                console.log("j'envoie le message à la salle :",salle.nom);
                io.to(salle.nom).emit('recoitMessage',data);
            }
        }
    });
});

function generateRandomText() {
    let text = "";
    const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * possibleChars.length);
        text += possibleChars.charAt(randomIndex);
    }
    return text;
}

function determinerIndicesAutour(position) {
    // rend toutes les cases autour de la position
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

function determinerIndicesLigne(position) { 
    // rend une liste de liste contenant les position des cases sur la ligne et diagonales (HG, HD, BG, BD)
    let indices = [];

    // pour détérminer les cases de la ligne 
    let indiLigne = [];
    if(position%40==0){
        for(i in range(39))
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


// le serveur ne connaît pas l'état de la partie ?
function validerDeplacementJeton(damier, positionActuelle, positionCible, typeJeton) {
    let indicesAutour = determinerIndicesAutour(positionActuelle);
    let indiceAutourCible = determinerIndicesAutour(positionCible);
    for(position in positionCible){
        if(position == positionActuelle){
            indiceAutourCible.pop(positionActuelle);
        }
    }
    switch (typeJeton){
        case 'abeille' :
            for(position in indicesAutour){
                if(positionCible == position ){
                    if(damier[positionCible].attr('jeton') == "vide"){
                        indiceAutourCible.pop(positionActuelle);
                        for(indice in indiceAutourCible){
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
                for(indice1 in indicesAutour){
                    if(damier[indice1].attr('jeton') == "vide"){
                        casesAutourAraignee1.push(indice1);
                    }
                }
                for(indice2 in casesAutourAraignee1){
                    let casesAutourTemp2 = determinerIndicesAutour(indice2);
                    for(indiceTemp2 in casesAutourTemp2){
                        if(damier[indiceTemp2].attr('jeton') == "vide"){
                            casesAutourAraignee2.push(indiceTemp2);
                        }
                    }
                }

                for(indicef in casesAutourAraignee2){
                    let casesAutourTempf = determinerIndicesAutour(indicef);
                    for(indiceTempf in casesAutourTempf){
                        if(damier[indiceTempf].attr('jeton') == "vide"){
                            casesAutourAraigneeFinal.push(indiceTempf);
                        }
                    }
                }

                for(indiceFinal in casesAutourAraigneeFinal){
                    if(indiceFinal == positionCible) return true;
                }
            }
            return false;

        case 'Coccinelle' :
            let casesAutourCocinelle1 = [];
            let casesAutourCocinelle2 = [];
            let casesAutourCocinelleFinal = [];
            if(damier[positionCible].attr('jeton') == "vide"){
                for(indice1 in indicesAutour){
                    if(damier[indice1].attr('jeton') =! "vide"){
                        casesAutourCocinelle1.push(indice1);
                    }
                }
                for(indice2 in casesAutourCocinelle1){
                    let casesAutourTemp2 = determinerIndicesAutour(indice2);
                    for(indiceTemp2 in casesAutourTemp2){
                        if(damier[indiceTemp2].attr('jeton') =! "vide"){
                            casesAutourCocinelle2.push(indiceTemp2);
                        }
                    }
                }

                for(indicef in casesAutourCocinelle2){
                    let casesAutourTempf = determinerIndicesAutour(indicef);
                    for(indiceTempf in casesAutourTempf){
                        if(damier[indiceTempf].attr('jeton') == "vide"){
                            casesAutourCocinelleFinal.push(indiceTempf);
                        }
                    }
                }

                for(indiceFinal in casesAutourCocinelleFinal){
                    if(indiceFinal == positionCible) return true;
                }
            }
            return false;

        case 'Fourmi' :
            if(damier[positionCible].attr('jeton') == "vide"){
                if(positionActuelle in indiceAutourCible) indiceAutourCible.pop(positionActuelle);
                for(indice in indiceAutourCible){
                    if(damier[indice].attr('jeton') != "vide"){
                        return true;
                    }
                }
            }
            return false;
        
        case 'Moustique' :
            let listeMoustique = [];
            for(indice in indicesAutour){
                if(damier[indice].attr('jeton') != "vide" && !listeMoustique.includes(damier[indice].attr('jeton')))
                listeMoustique.push(damier[indice].attr('jeton'));
            }
            for(pionMoustique in listeMoustique){
                if(validerDeplacementJeton(damier, positionActuelle, positionCible, pionMoustique))
                return true;
            }
            return false;

        case 'Sauterelle' :
            if(damier[positionCible].attr('jeton') == "vide"){
                if(positionActuelle in indiceAutourCible) indiceAutourCible.pop(positionActuelle);

                let indicesSauterelle = determinerIndicesLigne(positionActuelle);
                for(ligne in indicesSauterelle){
                    if(damier[ligne[0]].attr('jeton') != "vide"){
                    for(indiceCheck in ligne){
                        if(damier[indiceCheck].attr('jeton') == "vide" && indiceCheck == positionCible )
                            return true;
                        }
                    }
                }
            }
            return false;

        case 'Scarabee' :
            for(indiceD in indicesAutour){
                if(positionCible == indice){
                    for(indiceC in indiceAutourCible){
                        if(damier[indiceC].attr('jeton') != "vide"){
                            return true;
                        }
                    }
                }
            }
            return false;
    }
}
