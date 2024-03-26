const express = require('express')
const app = express()

const port = 3000

const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);

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
    socket.on('paramNewSalle', (data) =>{
        console.log(data.nomSalle);
        console.log(data.codeSalle);
        console.log(data.pseudo);
        console.log(data.typeChoix);
        console.log(data.modeChoix);
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

function determinerIndicesADistance(position, distance) {
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

function determinerIndicesLigne(positionDepart, positionArrive) {
    let indices = [];
    const nbColonnes = 40; // Nombre de colonnes dans le damier
    const nbLignes = 40; // Nombre de lignes dans le damier

    // Convertir la position en coordonnées de ligne et de colonne
    const ligne = Math.floor(position / nbColonnes);
    const colonne = position % nbColonnes;

    if(positionDepart == positionArrive) return indices;

    // à finir

    return indices;
}


// le serveur ne connaît pas l'état de la partie ?
function validerDeplacementJeton(damier, positionActuelle, positionCible, typeJeton) {
    const indicesAutour = determinerIndicesAutour(positionActuelle);
    const indiceAutourCible = determinerIndicesAutour(positionCible);
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
            const indicesAutour3 = determinerIndicesADistance(positionActuelle,3)
            for(position in indicesAutour3){
                if(positionCible == position ){
                    if(damier[positionCible].attr('jeton') == "vide"){
                        for(indice in indiceAutourCible){
                            if(damier[indice].attr('jeton') != "vide"){
                                return true;
                            }
                        }
                    }
                }
            }
            return false;

        case 'Coccinelle' :
        
        case 'Fourmi' :
            if(damier[positionCible].attr('jeton') == "vide"){
                indiceAutourCible.pop(positionActuelle);
                for(indice in indiceAutourCible){
                    if(damier[indice].attr('jeton') != "vide"){
                        return true;
                    }
                }
            }
            return false;
        
        case 'Moustique' :

        case 'Sauterelle' :
            // fonction non fini

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
