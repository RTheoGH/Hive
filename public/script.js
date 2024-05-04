// --------------------------------------------------------------------------------------------------------
// ----------------------------------------- Socket de démarrage ------------------------------------------
// --------------------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    $("#creer").hide();
    $("#rejoindre").hide();
    $("#rechercher").hide();
    $("#matchTrouve").hide();
    $("#regles").hide();
    $("#lobby").hide();
    $("#jeu").hide();

    // Informations sur les pions sur la page des règles
    var imageDetail = document.querySelectorAll(".image");

    imageDetail.forEach(e => {
        const image = e.querySelector(".tailleRImg");
        const detail = e.querySelector(".detail");
        const text = image.getAttribute("data-text");
        detail.innerText = text;
    });
});

socket.on("Salut c'est le serveur ! :)", () => {
    console.log("socket io connecté");
});

// --------------------------------------------------------------------------------------------------------
// ----------------------------------------- Variables ----------------------------------------------------
// --------------------------------------------------------------------------------------------------------

// Sons -------------
const select = new Audio('public/sons/select.mp3');
const win = new Audio('public/sons/win.mp3');
const erreur = new Audio('public/sons/erreur.mp3');
const notif = new Audio('public/sons/notif.mp3');
const ambiant = new Audio('public/sons/ambiant.mp3');
const found = new Audio('public/sons/found.mp3');
const miss = new Audio('public/sons/miss.mp3');
const pose = new Audio('public/sons/pose.mp3');
const deplacement = new Audio('public/sons/deplacement.mp3');
const defaite = new Audio('public/sons/defaite.mp3');
// -------------------

var color = ['white','black'];
var nomJoueur="";
var salle="";
var code="";
var logosPions = {
    'pionAbeille' : '/public/insectes/abeille.png',
    'pionFourmi' : '/public/insectes/fourmi.png',
    'pionScarabee' : '/public/insectes/scarabee.png',
    'pionCoccinelle' : '/public/insectes/coccinelle.png',
    'pionAraignee' : '/public/insectes/araignee.png',
    'pionSauterelle' : '/public/insectes/sauterelle.png',
    'pionMoustique' : '/public/insectes/moustique.png'
}
let timerElement;
let timerSeconds = 0;
let timerInterval;
let recherche = false;
let accepter = false;
let matchID = "";
let casesHighlight = []
let modeChoisi = "";

// --------------------------------------------------------------------------------------------------------
// ----------------------------------------- Sockets du client --------------------------------------------
// --------------------------------------------------------------------------------------------------------

// Actualisation de salle correspondante
socket.on('majSalle', (data) => {
    // $("#lobby").show();
    $("#lobby").fadeIn(300);
    document.getElementById('lobbyNom').innerHTML = 'Salle : ' + data.nom;
    document.getElementById('lobbyCode').innerHTML = data.code;
    
    const joueurActuel = data.listeJoueurs.find(joueur => joueur[1] == socket.id);
    if(joueurActuel){
        if(data.listeJoueurs.length > 0){
                document.getElementById('J1').innerHTML = data.listeJoueurs[0][0]; // Mettre à jour le joueur 1
            }else{
                document.getElementById('J1').innerHTML = '';
            }
            if(data.listeJoueurs.length > 1){
                document.getElementById('J2').innerHTML = data.listeJoueurs[1][0]; // Mettre à jour le joueur 2
            }else{
                document.getElementById('J2').innerHTML = '';
            }
        }
    else{
        $("#lobby").hide();
    }
});

// Vérification du nombre de joueur >2
socket.on('lancerDispo', () => {
    $("#lancer").prop("disabled",false);
});

// Vérification du nombre de joueur <2
socket.on('lancerPlusDispo', () => {
    $("#lancer").prop("disabled",true);
});

// Affichage de la partie lorqu'un joueur la lance
socket.on('affichagePartie', (data) => {
    const joueurActuel = data.salle.listeJoueurs.find(joueur => joueur[1] == socket.id);
    console.log(joueurActuel);
    console.log("je suis le joueur ",socket.id);
    switch(data.extension){
        case 'classique' :
            $("#divMoustique").hide();
            $("#divCoccinelle").hide();
            break;
        case 'extension1' :
            $("#divMoustique").hide();
            $("#divCoccinelle").show();
            break;
        case 'extension2' :
            $("#divMoustique").show();
            $("#divCoccinelle").show();
            break;
    }
    if(joueurActuel){
        console.log("Ok je rafraichie la page pour afficher le jeu");
        clear();
        initPartie();
        found.pause();
        found.currentTime = 0;
    }
});

socket.on('lancementR',() => {
    debutPartie();
})

// Actualisation de la partie en cours
socket.on('majPartie', (data) => {
    const joueurActuel = data.listeJoueurs.find(joueur => joueur[1] == socket.id);
    console.log(joueurActuel);
    socket.emit("sortieDePartie",data);
    if(joueurActuel){
        // Annonce de la victoire si on est le joueur qui reste encore dans la partie
        var victoire ="<div class='victoire'><div class='textVictoire'>Vous remportez la partie !\
            <br/><button class='bouton'\
            onClick='window.location.reload()'>Nouvelle Partie</button></div></div>";
        $("body").append(victoire);
        ambiant.pause();
        ambiant.currentTime = 0;
        win.play();
        $("#lancer").prop("disabled",true);
    }
});

// Message d'erreur si le nom de la salle est déja pris
socket.on('sallePrise', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Erreur : Ce nom de salle est déja pris.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si la salle est pleine
socket.on('sallePleine', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Erreur : Cette salle est pleine.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si le pseudonyme choisi est déjà pris par quelqu'un dans la salle
socket.on('pseudoPris', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Erreur : Ce nom de joueur est déjà pris.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si la salle n'est pas trouvé
socket.on('salleIntrouvable', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Erreur : Cette salle n'existe pas.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si le code entré par le joueur n'est pas celui de la salle
socket.on('codeFaux', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Erreur : Code faux pour cette salle.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si le nom de la salle est vide
socket.on('nomVide', () => {
    $("#creer").hide();
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Erreur : Nom de salle vide.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si le code de la salle est vide
socket.on('codeVide', () => {
    $("#creer").hide();
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Erreur : Code de salle vide.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si le nom du joueur est vide
socket.on('joueurVide', () => {
    $("#creer").hide();
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Erreur : Nom de joueur vide.";
    $("#accueil").show();
    erreur.play();
});

// Socket de réception lorsqu'un match est trouvé via la fonction de recherche de partie
socket.on('matchTrouve', (data) => {
    matchID = data.MatchID;
    $("#rechercher").hide();
    $("#accepterM").prop("disabled",false);
    $("#matchTrouve").fadeIn(300);
    recherche = false;
    progress = 100; // On initialise la barre de progression à 100%
    updateProgressBar(); // On appelle la fonction une première fois

    let chrono = setInterval(() => {
        progress -= 0.769; // Réduire la progression
        updateProgressBar();

        if(progress <= 0){ // Si le chronometre arrive à 0
            clearInterval(chrono); // On arrete le chronometre
            found.pause();
            found.currentTime = 0
            $("#matchTrouve").hide();
            $("#rechercher").fadeIn(300);
            if(!accepter){ // Si le joueur n'a pas accepté, on affiche la page de recherche d'une partie
                miss.play();   // sans le remettre dans la file
                $("#pseudoM").prop("disabled",false);
                $("#niveau-match").prop("disabled",false);
                $("#boutonRecherche").prop("disabled",false);
                clearInterval(timerInterval);
                timerInterval = undefined;
                timerSeconds = 0;
                if (timerElement) {
                    timerElement.textContent = "";
                    timerElement = undefined;
                }
            }else{
                accepter = false;
            }
        }
    },100);
    found.play();
    ambiant.pause();
    ambiant.currentTime = 0;
});

// Met à jour la largeur de la barre de progression
function updateProgressBar() {
    progressElement.style.width = progress + '%'; 
}

// Socket de réception pour relancer la musique de la file
socket.on("repriseSonFile", () => {
    console.log("reprise de la file");
    ambiant.play();
    ambiant.addEventListener('timeupdate', function(){
        if(this.currentTime >= 59){
            this.currentTime = 0;
        }
    });
});

// Socket de réception d'une tentative de connexion à une salle
socket.on("clientJoin",(data) => {
    console.log(data);
    console.log("tentative de connexion à la salle",data.salle.nom);
    socket.emit("joinRoom",data);
});

// Socket de réception des messages
socket.on('recoitMessage', (data) => {
    let puce = ["○", "●"][data.idJ]; // La puce vide représente le joueur blanc et la puce pleine le joueur noir
    $("#messages").append("<li>"+puce+" <span style='font-weight:bold'>"+data.auteur+"</span>: "+data.message+"</li>");
    notif.play();
});

socket.on("recupMode",(data) => {
    modeChoisi = data;
    console.log("Ok le mode pour la partie est : ",modeChoisi);
})

// --------------------------------------------------------------------------------------------------------
// -------------------------------------------- Fonctions -------------------------------------------------
// --------------------------------------------------------------------------------------------------------

// Redirection vers la page des règles
function ouvrirRegles() {
    $("#accueil").hide();
    select.play();
    $("#regles").fadeIn(300); // Alternative à .show()
}

// Redirection vers l'accueil
function fermerRegles() {
    $("#regles").hide();
    select.play();
    $("#accueil").fadeIn(300);
}

// Fonction qui copie le code d'une salle via un bouton
function copierCode(){
    var copie = document.getElementById("lobbyCode").innerText;
    navigator.clipboard.writeText(copie) // API clipboard
    .then(() => {
        console.log('Code copier');
    })
    .catch(e => {
        console.error('Erreur lors de la copie dans le presse-papiers : ', e);
    });
}

// Fonction qui initialise la partie ainsi que le damier
function initPartie(){
    genereDamier(40,40,40);
}

// fonction de début de partie
function debutPartie(m){
    m = modeChoisi;
    console.log(m);
    document.getElementById("message_erreur").innerHTML = "";
    clear();
    console.log('Je lance la partie');
    let mDefaut = "extension2";
    console.log(mDefaut);
    if(m != "" && mDefaut != m) mDefaut = m;
    console.log("value :", mDefaut);
    socket.emit('lancementPartie', mDefaut);
}

// fonction qui affiche le jeu
function clear(){
    $(".menu").hide();
    $("#jeu").show();
}

// fonction qui affiche la page de création d'une partie
function creer(){
    document.getElementById("message_erreur").innerHTML = "";
    $("#accueil").hide();
    select.play();
    $("#creer").fadeIn(300);
}

// fonction qui affiche la page pour rejoindre une partie
function rejoindre(){
    document.getElementById("message_erreur").innerHTML = "";
    $("#accueil").hide();
    select.play();
    $("#rejoindre").fadeIn(300);
}

// Fonction d'affichage de la page rechercher
function rechercher(){
    document.getElementById("message_erreur").innerHTML = "";
    $("#accueil").hide();
    $("#pseudoM").prop("disabled",false);
    $("#niveau-match").prop("disabled",false);
    $("#boutonRecherche").prop("disabled",false);
    select.play();
    $("#rechercher").fadeIn(300);
}

// Fonction pour formater le temps au format mm:ss, exemple : 01:45 -> 1 minute et 45 secondes
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Fonction pour mettre à jour le timer chaque seconde
function updateTimer() {
    timerSeconds++;
    if (timerElement) {
        timerElement.textContent = formatTime(timerSeconds);
    }
}

// Fonction principale de la recherche
async function recherchePartie() {
    recherche = true;
    while(recherche){
        socket.emit("recherchePartie"); // Envoie chaque seconde le message au serveur si le joueur recherche une partie
        await attente(1000);
    }
}

function attente(temps){
    return new Promise(resolve => setTimeout(resolve,temps));
}

// Fonction pour lancer la recherche
function lancerRecherche(){
    nomJoueur = document.getElementById("pseudoM").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');
    let niveau = document.getElementById("niveau-match").value;
    console.log("Je lance la file :",nomJoueur);
    socket.emit("rejoindreFile",{"joueur":[niveau,nomJoueur,socket.id,null]}); // Le joueur rejoint la file
    if (!timerElement) {
        timerElement = document.getElementById('tempsDAttente');
    }
    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 1000); // Appelle updateTimer() toutes les 1000 ms (1 seconde)
    }
    select.play();
    ambiant.play();
    ambiant.addEventListener('timeupdate', function(){
        if(this.currentTime >= 59){
            this.currentTime = 0;
        }
    });
    $("#pseudoM").prop("disabled",true);
    $("#niveau-match").prop("disabled",true);
    $("#boutonRecherche").prop("disabled",true);
    recherchePartie(); // On lance la fonction de recherche une première fois
}

// Fonction pour annuler la recherche
function retourRecherche(){
    clearInterval(timerInterval);
    timerInterval = undefined;
    timerSeconds = 0; // Réinitialiser le compteur de secondes
    if (timerElement) {
        timerElement.textContent = "";
        timerElement = undefined; // Effacer le contenu du timerElement
    }
    document.getElementById("message_erreur").innerHTML = "";
    $("#rechercher").hide();
    ambiant.pause();
    ambiant.currentTime = 0;
    select.play();
    $("#accueil").fadeIn(300);
    nomJoueur = document.getElementById("pseudoM").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');
    console.log(nomJoueur);
    let niveau = document.getElementById("niveau-match").value;
    console.log(niveau);
    socket.emit("quitterMatchmaking",{"joueur":[niveau,nomJoueur,socket.id,null]}); // On retire le joueur de la file de recherche
}

// Fonction pour accepter un match lors de la recherche d'une partie
function accepterMatch(){
    accepter = true;
    console.log("Accepter :",accepter);
    nomJoueur = document.getElementById("pseudoM").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');
    let niveau = document.getElementById("niveau-match").value;
    $("#accepterM").prop("disabled",true);
    select.play();
    socket.emit("accepterMatch",{"joueur":[niveau,nomJoueur,socket.id,null],"matchID":matchID});
}

// fonction qui permet de retourner à l'accueil depuis la page de création ou rejoindre
function retour(){
    document.getElementById("message_erreur").innerHTML = "";
    $("#rejoindre").hide();
    $("#creer").hide();
    select.play();
    $("#accueil").fadeIn(300);
}

// fonction qui crée et valide une salle
function validerCreation(){
    $("#creer").hide();
    select.play();
    // $("#lobby").show();
    $("#lobby").fadeIn(300);

    var salle={
        nom: "",
        code: "",
        listeJoueurs: [],
        type: "",
        mode: ""
    }

    salle.nom = document.getElementById("nomSalle").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');   // Recup le nom de la salle
    salle.code = document.getElementById("codeSalle").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,''); // Recup le code de la salle
    nomJoueur = document.getElementById("pseudo").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');     // Recup le nom du créateur de la salle (J1)
    salle.listeJoueurs.push([nomJoueur,null, null]);

    var typeSelect = document.getElementById("Type"); // Recup si Duel ou IA
    salle.type = typeSelect.value;
    var modeSelect = document.getElementById("Mode"); // Recup si classique/ext1/ext2/ext3
    salle.mode = modeSelect.value;

    document.getElementById('lobbyNom').innerHTML = 'Salle  : ' + salle.nom; // Affichage du nom de la salle 
    document.getElementById('lobbyCode').innerHTML = salle.code;             // et du code pour rejoindre
    document.getElementById('J1').innerHTML = salle.listeJoueurs[0][0];
    console.log(salle);

    socket.emit('nouvelleSalle',salle);
}

// fonction qui valide la connexion d'un joueur dans une salle
function validerRejoindre(){
    $("#rejoindre").hide();
    select.play();

    var salle_rejoindre = document.getElementById("nomSalleR").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,''); // Recup du nom entré par le J2
    var code_rejoindre = document.getElementById("codeSalleR").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,''); // Recup du code entré par le J2
    console.log(salle_rejoindre);
    console.log(code_rejoindre);
    nomJoueur = document.getElementById("pseudoR").value.trim().replace(/[^a-zA-Z0-9 ]/g,'');             // J2
    socket.emit('tentativeRejoindre',{'nom':salle_rejoindre,'code':code_rejoindre,'joueur':[nomJoueur,null,null]});
    console.log(code_rejoindre);
    console.log(nomJoueur);
}

// fonction qui affiche l'accueil
function retourAccueil(){
    $("#lobby").hide();
    $(".menu").show();
    $("#accueil").show();
    window.location.reload();
}

// fonction qui permet de quitter la salle actuelle pour retourner à l'accueil
function quitter(){
    select.play();
    console.log("Je quitte la salle");
    socket.emit('quittePartie');
    retourAccueil();
    $("#lancer").prop("disabled",true);
}

// fonction qui permet de quitter la partie en cours pour retourner à l'accueil
function quitterPartieEnCours(){
    select.play();
    console.log("Je quitte la partie");
    socket.emit('quittePartieEnCours');
    $("#jeu").hide();
    retourAccueil();
    $("#lancer").prop("disabled",true);
}

// fonction pour envoyer un message dans le tchat
function send(){
    let message = $('#message').val().trim().replace(/[^a-zA-Z0-9 'çàéèù?.!]/g,'');
    if (!message==""){
        console.log(message);
        socket.emit('envoieMessage',{'auteur':nomJoueur,'message':message});
    }
    $('#message').val("");
}

// ------------------
// Fin des fonctions principales pour les salles
// ------------------

function hideHex(position){
    console.log('fonction hideHex sur : '+ position);
    d3.select('#h'+position).attr("stroke", "black");
}

socket.on('hide', (data) => {
    console.log('chemin hide client : '+ position);
    hideHex(data.position);
});

// Fonction raccourci pour envoyer un message
function fsend(event){
    if (event.keyCode === 13) { // Touche 'Entrer'
        send();
    }
}

// Fonction qui créé un hexagone
function creeHexagone(rayon) {
    var points = new Array();
    for (var i = 0; i < 6; ++i) {
        var angle = i * Math.PI / 3;
        var x = Math.sin(angle) * rayon;
        var y = -Math.cos(angle) * rayon;
        //console.log("x="+Math.round(x*100)/100+" y="+Math.round(y*100)/100);
        points.push([Math.round(x*100)/100, Math.round(y*100)/100]);
    }
    return points;
}

function desactiverHexagone(indiceHexagone) {
    d3.select('#h' + indiceHexagone)
        .classed("desactive", true);
}

function activerHexagone(indiceHexagone) {
    var hexagone = d3.select('#h' + indiceHexagone);

    // Vérifier la couleur de remplissage actuelle
    var couleurRemplissage = hexagone.attr("fill");
    
    // Si la couleur de remplissage n'est pas rouge, rendre transparent et cliquable
    if (couleurRemplissage !== "red"
     && couleurRemplissage != "white"
     && couleurRemplissage != "black") {
        hexagone
            .classed("desactive", false)
            .classed("hexagoneReactive", true)
            .attr("fill", "none")
            .style("pointer-events", "all");
    }
}

function toggleHexagone(data) {
    console.log('Avant sélection : ' + data.position);
    var hexagone = d3.select('#h' + data.position);
    console.log('Après sélection : ' + hexagone);

    if (!hexagone || hexagone.empty()) {
        console.error('Hexagone non trouvé pour l\'indice ' + data.position);
        return;
    }

    console.log('Propriétés de l\'hexagone :', hexagone.node());

    var couleurRemplissage = hexagone.attr("fill");
    console.log('Couleur de la case ' + data.position + ': ' + couleurRemplissage);

    // Récupérer les indices des hexagones autour
    var indicesAutour = data.indices;

    // A changer

    var PionPose = hexagone.attr('jeton') == "vide";
    if(!PionPose){
        console.log(data.position + " n'est pas vide")
        var autourNonVide = false;
        for(indiceR of indicesAutour){
            if(d3.select('#h' + indiceR).attr('jeton') == "vide") autourNonVide = true;
        }
        if(autourNonVide){
            hexagone
                .attr("fill", "transparent");
        }
        else{
            hexagone
                .classed("desactive", true)
                .classed("hexagoneReactive", false)
                .classed("hexagoneWhiteBorder", true)
                .attr("fill", "transparent")
                .style("pointer-events", "none");
        }
        for(indiceR of indicesAutour){
            var hexVoisin = d3.select('#h' + indiceR);
            var indicesVoisinAutour = determinerIndicesAutour(indiceR);
            let nonVide = false;
            if(d3.select('#h' + indiceR).attr('jeton') == "vide") nonVide = true;
            for(indiceRed of indicesVoisinAutour){
                if(d3.select('#h' + indiceRed).attr('jeton') == "vide") nonVide = true;
            }
            if (!nonVide) {
                hexVoisin
                    .classed("desactive", true)
                    .classed("hexagoneReactive", false)
                    .classed("hexagoneWhiteBorder", true)
                    .attr("fill", "none")
                    .style("pointer-events", "none");
            }
        }
    } else {
        // Hexagone non rouge, l'active
        console.log(data.position + " est vide");
    }
}

/*
    if (couleurRemplissage === "red") {
        console.log(data.position + " est rouge.");
        // Hexagone rouge, le désactive et désactive les hexagones autour
        var autourRouge = false
        for(indiceR of indicesAutour){
            if(d3.select('#h' + indiceR).attr("fill")==="red") autourRouge = true;
        }
        if(autourRouge){
            hexagone
                .attr("fill", "none")
        }
        else{
            hexagone
                .classed("desactive", true)
                .classed("hexagoneReactive", false)
                .classed("hexagoneWhiteBorder", true)
                .attr("fill", "none")
                .style("pointer-events", "none");
        }
        // passer a vide

        // Désactiver les hexagones autour s'ils ne sont pas rouges ou n'ont pas un autre hexagone rouge autour d'eux
        for(indiceR of indicesAutour) {
            console.log(indiceR + " est rouge ou border ?");
            //var hexVoisin = d3.select('#h' + indice);
            //var couleurVoisin = hexVoisin.attr("fill");

            // Vérifier si l'hexagone voisin est rouge ou a un hexagone rouge autour de lui
            //var indicesVoisinAutour = determinerIndicesAutour(indice);
            //let rouge = false;
            //for(indiceRed of indicesVoisinAutour){
            //    if(d3.select('#h' + indiceRed).attr("fill")==="red"){
            //        rouge = true;
            //    }
            //}
            //var voisinAHexRouge = indicesVoisinAutour.some(function (voisinIndice) {
            //    var voisinHex = d3.select('#h' + voisinIndice);
            //    return voisinHex.attr("fill") === "red";
            //});
            
            var hexVoisin = d3.select('#h' + indiceR);
            var indicesVoisinAutour = determinerIndicesAutour(indiceR);
            let rouge = false;
            if(d3.select('#h' + indiceR).attr("fill")==="red") rouge = true;
            for(indiceRed of indicesVoisinAutour){
                if(d3.select('#h' + indiceRed).attr("fill")==="red") rouge = true;
            }

            if (!rouge) {
                hexVoisin
                    .classed("desactive", true)
                    .classed("hexagoneReactive", false)
                    .classed("hexagoneWhiteBorder", true)
                    .attr("fill", "none")
                    .style("pointer-events", "none");
            }
        }
    } else {
        // Hexagone non rouge, l'active
        console.log(data.position + " n'est pas rouge");
    }
}
*/

function determinerIndicesAutour(position) {
    let indicesAutour = [];
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

        // Vérifier si le voisin est à l'intérieur des limites
        if (voisinLigne >= 0 && voisinLigne < nbColonnes && voisinColonne >= 0 && voisinColonne < nbColonnes) {
            // Calculer l'indice et l'ajouter au tableau
            let voisinIndice = voisinLigne * nbColonnes + voisinColonne;
            indicesAutour.push(voisinIndice);
        }
    }

    return indicesAutour;
}

socket.on('instructionsRedActivation', (data) => {
    // Activer les hexagones autour selon les instructions du serveur
    toggleHexagone(data);
});

var rayonGlobal = 0

//fonction pour poser le pion "pion" sur la case "elemCase" désignée par la balise path
function posePionSurCase(elemCase, pion, couleur, joueur){
    var svgElement = elemCase.closest('svg')[0];
    if (elemCase.length > 0) {            // Si on le trouve
        var d = elemCase.attr('d');       // On récupère son d
        // console.log(d);
        
        var valeurs = d.split(' ');   // On split par les espaces
        // console.log(valeurs);
    
        var coords = valeurs[0].substring(1).split(','); // Récupère x et y
        // console.log(coords);
        var x = parseFloat(coords[0]);
        var y = parseFloat(coords[1]);
        // console.log(x,y);
        elemCase.attr('fill', couleur);
        d3.select(svgElement).append('image')
            .attr('xlink:href', logosPions[pion])
            .attr('x', x-26)
            .attr('y', y+14)
            .attr('width', rayonGlobal * 1.3)
            .attr('height', rayonGlobal * 1.3)
            .style('pointer-events', 'none');
        const dicoPionHistorique = {
            'pionAbeille' : 'une abeille',
            'pionFourmi' : 'une fourmi',
            'pionScarabee' : 'un scarabée',
            'pionCoccinelle' : 'une coccinelle',
            'pionAraignee' : 'une araignée',
            'pionSauterelle' : 'une sauterelle',
            'pionMoustique' : 'un moustique'
        };
        $("#actions_action").append("<li>"+joueur+" a posé "+dicoPionHistorique[pion]+"</li>");
    }
}

function indiceFourmiRec(damier, liste){
    let indicesAutour = [];
    let ListeIndiceRec = liste;
    /*  Version récursive si la boucle for extensive pose problème
    for(indiceListe in liste){
        indicesAutour = determinerIndicesAutour(indiceListe);
        for(indice in indicesAutour){
            if(damier[indice].attr('jeton') != "vide" // si la case est vide
            && !damier[indice].classed("desactive") // et qu'elle est active
            && !indiceRetourDoublons.includes(indice)) // et que je l'ai pas déjà
            ListeIndiceRec.push(indice);
        }
    }
    if(ListeIndiceRec == liste)
        return ListeIndiceRec;
    else{ indiceFourmiRec(damier, liste) }
    */
    for(indiceListe in ListeIndiceRec){
        indicesAutour = determinerIndicesAutour(indiceListe);
        for(indice in indicesAutour){
            if(damier[indice].attr('jeton') != "vide" // si la case est vide
            && !damier[indice].classed("desactive") // et qu'elle est active
            && !indiceRetourDoublons.includes(indice)) // et que je l'ai pas déjà
            ListeIndiceRec.push(indice);
        }
    }
    return ListeIndiceRec;
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

function CasesDeplacementJeton(damier, positionActuelle, typeJeton) {
    let indicesAutour = determinerIndicesAutour(positionActuelle);
    let indiceRetour = [];
    switch (typeJeton){
        case 'Abeille' :
            for(position in indicesAutour){
                if(damier[position].attr('jeton') == "vide")
                indiceRetour.push(position);
            }
            break;
    
        case 'Araignee' :
            let casesAutourAraignee1 = [];
            let casesAutourAraignee2 = [];

            for(indice1 in indicesAutour){
                if(damier[indice1].attr('jeton') == "vide"){
                    casesAutourAraignee1.push(indice1);
                }
            }

            for(indice2 in casesAutourAraignee1){
                let casesAutourTemp2 = determinerIndicesAutour(indice2);
                for(indiceTemp2 in casesAutourTemp2){
                    if(damier[indiceTemp2].attr('jeton') == "vide"){
                        indiceRetour.push(indiceTemp2);
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
        break;

        case 'Coccinelle' :
            let casesAutourCocinelle1 = [];
            let casesAutourCocinelle2 = [];

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
                        indiceRetour.push(indiceTempf);
                    }
                }
            }
        break;

        case 'Fourmi' :
            let indiceRetourDoublons = indiceFourmiRec(damier, [positionActuelle])
            indiceRetourDoublons.pop(positionActuelle)
            indiceRetour = [...new Set(indiceRetourDoublons)]; // devrait enlever des doublons (même si il ne devrait pas y en avoir avec cette version)
            if(indiceRetour.includes(positionActuelle))
                indiceRetour.pop(positionActuelle);
        break;
        
        case 'Moustique' :
            let listeMoustique = [];
            let listeAddMoustique = []
            for(indice in indicesAutour){
                if(damier[indice].attr('jeton') != "vide" && !listeMoustique.includes(damier[indice].attr('jeton')))
                listeMoustique.push(damier[indice].attr('jeton'));
            }
            for(pionMoustique in listeMoustique){
                listeAddMoustique = CasesDeplacementJeton(damier, positionActuelle, pionMoustique)
                for(indiceMoustique in listeAddMoustique){
                    if(!indiceRetour.includes(indiceMoustique))
                        indiceRetour.push(indiceMoustique);
                }
            }
            break;

        case 'Sauterelle' :
            if(positionActuelle in indiceAutourCible) indiceAutourCible.pop(positionActuelle);
            let indicesSauterelle = determinerIndicesLigne(positionActuelle);
            for(ligne in indicesSauterelle){
                if(damier[ligne[0]].attr('jeton') != "vide"){
                for(indiceCheck in ligne){
                    if(damier[indiceCheck].attr('jeton') == "vide")
                        indiceRetour.push(indiceCheck);
                    break;
                    }
                }
            }
            break;

        case 'Scarabee' :
            return determinerIndicesAutour(positionActuelle);
    }
}

function genereDamier(rayon, nbLignes, nbColonnes) {
    if(nbLignes==9 && nbColonnes==9){  /* augmente la taille globale du damier*/
        rayon=rayon+5;
    };
    if(nbLignes==19 && nbColonnes==19){  /* reduire la taille globale du damier*/
        rayon=rayon-5;
    };
    rayonGlobal = rayon
    var i=0;
    distance =  rayon - (Math.sin(1 * Math.PI / 3) * rayon);  // plus grande distance entre l'hexagone et le cercle circonscrit

    d3.select("#tablier").append("svg").attr("width", (nbLignes*2)*rayon).attr("height",nbLignes*1.5*rayon).attr('id','ruche');
    
    let deplacement = false;
    let startX,startY,currentX,currentY;

    const tablier = document.getElementById('tablier');
    const ruche = document.getElementById('ruche');

    var centreH = (tablier.scrollWidth-tablier.clientWidth)/2;
    var centreV = (tablier.scrollHeight-tablier.clientHeight)/2;

    tablier.scrollLeft = centreH-100;
    tablier.scrollTop = centreV;

    ruche.addEventListener('mousedown', (e) => {
        deplacement = true;
        startX = e.clientX-tablier.getBoundingClientRect().left;
        startY = e.clientY-tablier.getBoundingClientRect().top;
        ruche.style.cursor = 'grabbing';
        //console.log('grab');
    });

    document.addEventListener('mousemove', (e) => {
        if (!deplacement) return;

        e.preventDefault();

        currentX = e.clientX - tablier.getBoundingClientRect().left;
        currentY = e.clientY - tablier.getBoundingClientRect().top;

        //console.log('on bouge');
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        tablier.scrollLeft -= deltaX;
        tablier.scrollTop -= deltaY;

        startX = currentX;
        startY = currentY;
    });

    document.addEventListener('mouseup', () => {
        //console.log('on lache');
        deplacement = false;
        ruche.style.cursor = 'grab';
    });
    
    var hexagone = creeHexagone(rayon);
    console.log(hexagone)
    var milieu = [];
    if (((nbLignes*nbColonnes)/2)%200 == 0){
        milieu.push((nbLignes*nbColonnes+nbLignes)/2)
        /*
        milieu.push(((nbLignes*nbColonnes+nbLignes)/2)-1)
        milieu.push(((nbLignes*nbColonnes+nbLignes)/2)+1)
        //milieu.push(((nbLignes*nbColonnes+nbLignes)/2)-(nbColonnes+1))
        milieu.push(((nbLignes*nbColonnes+nbLignes)/2)-(nbColonnes))
        milieu.push(((nbLignes*nbColonnes+nbLignes)/2)-(nbColonnes-1))
        //milieu.push(((nbLignes*nbColonnes+nbLignes)/2)+(nbColonnes-1))
        milieu.push(((nbLignes*nbColonnes+nbLignes)/2)+(nbColonnes))
        milieu.push(((nbLignes*nbColonnes+nbLignes)/2)+(nbColonnes+1))
        */

    }
    console.log(milieu);
    for (var ligne=0; ligne < nbLignes; ligne++) {
        i++;
        for (var colonne=0; colonne < nbColonnes; colonne++) {
            var d = "";
            var x, y;
            for (h in hexagone) {
                if(i%2==0){
                    x = hexagone[h][0]+(rayon-distance)*(2+2*colonne);
                }
                else{
                    (x = hexagone[h][0]+(rayon-distance)*(2+1+2*colonne))
                }
                y = distance*2 + hexagone[h][1]+(rayon-distance*2)*(1+2*ligne);
                if (h == 0) d += "M"+x+","+y+" L";
                else        d +=     x+","+y+" ";
            }
            d += "Z";
            svgHexa = d3.select("svg").append("svg")
            
            svgHexa.attr("class", "svgHexa")
            svgHexa.append("path")
                .attr("d", d)
                .attr("stroke", "black")
                .attr("fill", "transparent")
                .attr("class", function() {
                    return "hexagone" + (ligne * nbLignes + colonne);
                })
                .attr("jeton", "vide")
                .attr("id", "h"+(ligne*nbLignes+colonne)) // car un id doit commencer par une lettre pour pouvoir être utilisé
                .on("click", function(d) {

                    
                    // d3.select(this).selectAll("svg").remove();
                    // d3.select(this).append("svg").append('image')
                    //.attr("viewBox", "0 0 " + (rayon * 2) + " " + (rayon * 2))  // Ajout de la viewBox
                    //.attr('href', 'https://cdn.discordapp.com/attachments/1173320346372411485/1200083491887513642/abeille.png?ex=65c4e3d8&is=65b26ed8&hm=c3a5878cf857a8c4290650b43e743b82eecb5b953ee5d903b2121e8be1104b62&')
                    

                    //console.log(this)
                    if (!d3.select(this).classed("desactive")) {
                        let position = d3.select(this).attr('id').substring(1);
                        console.log('position' + position);
                        if (d3.select(this).attr("fill") === "red") {
                            socket.emit('ClickHexRed', {'position': position});
                        }else {
                            if (selectionPion != null){
                                socket.emit('discover', {'position': position});
                            }
                        }
                        if (d3.select(this).attr("jeton") != "vide"){
                            for(let caseI = 0; caseI < (nbLignes*nbColonnes)-1 ;caseI++ ){
                                if(d3.select(this).attr("fill") === "blue")
                                    d3.select(this).attr("fill") = "transparent";
                            }
                            let caseDisponible = CasesDeplacementJeton(d3.select("#tablier"),position,d3.select(this).attr("jeton"));
                            for(let caseD of caseDisponible){
                                d3.select(caseD).attr("fill") = "blue";
                            }
                        }
                        //let position=d3.select(this).attr('id').substring(1);
                        //let typePion = document.querySelector('input[name="swap"]:checked').id;
                        //console.log("typePion : "+typePion)
                        //console.log(position);
                        //socket.emit('pion',{'typePion':typePion,'position':position,'numJoueur':jeton});
                        //console.log("typePion hexagone apres emit : "+typePion);
                        // if(typePion=="pion")
                        //d3.select(this).attr('fill', "red");
                        // d3.select(this).attr('fill', couleursJoueurs[jeton]);
                    }
                });
            }
            
        
    }


    


    // Créer un nouvel élément SVG pour tous les éléments ayant comme classe "pion"
    var svgPions = d3.selectAll(".pion")
                    .attr("width", 75)
                    .attr("height", 79);
                    //.append('svg')

    var d2 = "";
    for (h in hexagone) {
        x = hexagone[h][0] + rayon;
        y = hexagone[h][1] + rayon;
        if (h == 0) d2 += "M" + x + "," + y + " L";
        else d2 += x + "," + y + " ";
    }
    d2 += "Z";
    
    // Ajouter l'hexagone à l'élément SVG dans #menuPions
    svgPions.append("path")
        .attr("d", d2)
        .attr("stroke", "black")
    

    // Poser le pion sélectionné sur une case
    $(document).on('click', '.svgHexa', function() {
        if (selectionPion != null) {
            var path = $(this).find('path');   // On sélectionne le path à l'intérieur du svg
            socket.emit("EnvoiPoserPionPlateau", {'case' : path.attr("id"), 'pion' : selectionPion});
        }
    });

    socket.on("ReceptPoserPionPlateau", (data) => {
        var path = $('path#' + data.case);
        d3.select("#"+data.case).attr("jeton", data.pion.replace("pion", ""));
        posePionSurCase(path, data.pion, data.couleur, data.joueur);
        selectionPion = null;
        pose.play();
    });
    
    socket.on("pasTonTour", () => {
        console.log("C'est le tour du joueur adverse");
    });

    socket.on("infosTour", (data) => { 
        console.log("C'est au tour du joueur", data.tour, " de jouer");
        console.log("Tour n°"+data.compteurTour);
        $("#tourJoueur").text(data.joueur+" doit poser ou déplacer une pièce");
    })

    //Pour mettre les images sur les pions du menu :
    
    d3.selectAll('.pion').each( function(){
        d3.select(this).append('image')//.append('svg')
            .attr('href', logosPions[d3.select(this).attr('id')])
            .attr('x', 14)  
            .attr('y', 14)  
            .attr('width', rayon*1.3)  
            .attr('height', rayon*1.3);
        });
    
    for(i of milieu) {
        console.log(milieu.includes(i),i);
        d3.select('#h'+i).attr("stroke", "black");
    }
    for(var i = 0; i < nbLignes * nbColonnes; i++){
        if(!milieu.includes(i))
            //desactiverHexagone(i);
            d3.select('#h'+i).classed("hexagoneWhiteBorder", true);
    }
}

socket.on('instructionsActivation', (data) => {
    // Activer les hexagones autour selon les instructions du serveur
    for (let indice of data.indices) {
        activerHexagone(indice);
    }
});

socket.on('envoiNombrePionsRestants', (data) => {
    $(".nombre").each(function() {
        var nbPionsRestants = $(this);
        // Vérifier si l'élément a un attribut "id"
        if (nbPionsRestants.attr("id")) {
            var idPion = nbPionsRestants.attr("id").replace("nb_", "");
            nbPionsRestants.text(data[idPion]);
        }
    });
});

//Affichage de la couleur du joueur pour les pions du menu
socket.on("genereCouleurJoueur", (couleurGeneree) =>{
    let couleurInverse = '';
    d3.selectAll('.pion').attr("fill", couleurGeneree);
    $(".nombre").each(function() {
        var couleurPion = $(this);
        // Vérifier si l'élément a un attribut "id"
        if (couleurPion.attr("id")) {
            if(couleurGeneree == 'white') couleurInverse = 'black';
            if(couleurGeneree == 'black') couleurInverse = 'white';
            couleurPion.css("color",couleurInverse);
        }
    });
});

var selectionPion = null;

$(document).on('click', '.pion', function(){
    if($("#nb_"+this.id).text() != 0){
        selectionPion = this.id;
        socket.emit("afficheCasesJouables");
    }
});

socket.on("HighlightCasesJouables", (casesVides) => {
    for(c of casesVides){
        d3.select("#h"+c)
            .attr("fill", "green")
            .attr("opacity", 0.3)
            .attr("stroke", "green");
    }
    casesHighlight = casesVides;
});

socket.on("UnhighlightCases", () => {
    for(c of casesHighlight){
        d3.select("#h"+c)
            .attr("fill", "none")
            .attr("opacity", 1)
            .attr("stroke", "black");
    }
});