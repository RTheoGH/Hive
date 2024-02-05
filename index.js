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


