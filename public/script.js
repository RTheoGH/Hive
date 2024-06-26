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
const deplacementAudio = new Audio('public/sons/deplacement.mp3');
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
let deplacementPionOrigine = null;
let modeSelectionDeplacement = false;
var caseDisponiblePourDeplacer = [];
var messageEnCours = false;

// -----------------------------------
// ----- Sockets pour les salles -----
// -----------------------------------

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

// Socket de lancement d'une partie matchmaking
socket.on('lancementR',() => {
    debutPartie();
})

// Fonction qui affiche la victoire d'un joueur dans une partie
function affichageDeLaVictoire(){
    let w = window.innerWidth;
    console.log(w);
    if (w >= 1920) {
        $("#tablier").css("background-image", 'url("images/fonds/hive-1920-1080.png")');
    } else if (w < 1920 && w >= 1680) {
        $("#tablier").css("background-image", 'url("images/fonds/hive-1680-1050.png")');
    } else if (w < 1680 && w >= 1540) {
        $("#tablier").css("background-image", 'url("images/fonds/hive-1540-870.png")');
    } else if (w < 1540 && w >= 1440) {
        $("#tablier").css("background-image", 'url("images/fonds/hive-1440-900.png")');
    } else if (w < 1440 && w >= 1280) {
        $("#tablier").css("background-image", 'url("images/fonds/hive-1280-800.png")');
    } else if (w < 1280 && w >= 1024) {
        $("#tablier").css("background-image", 'url("images/fonds/hive-1024-768.png")');
    }
    
    $("#actions").hide();
    $("#menuPions").hide();
    $("#chat").hide();
    $(".hive").hide();
    $("#VNW").text("Nouvelle Partie !");
    ambiant.pause();
    ambiant.currentTime = 0;
    $("#lancer").prop("disabled",true);
}

// Actualisation de la partie en cours
socket.on('majPartie', (data) => {
    const joueurActuel = data.listeJoueurs.find(joueur => joueur[1] == socket.id);
    console.log(joueurActuel);
    socket.emit("sortieDePartie",data);
    if(joueurActuel){
        affichageDeLaVictoire();
        win.play();
        $("#tourJoueur").text(joueurActuel[0]+" a remporté la partie !");
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

// -----------------------------------------
// ------- Fonctions pour les salles -------
// -----------------------------------------

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

// Fonction raccourci pour envoyer un message
function fsend(event){
    if (event.keyCode === 13) { // Touche 'Entrer'
        send();
    }
}

// ------------------------------------------------------
// Fin des fonctions principales pour les salles
// ------------------------------------------------------

// ------------------------------------------------------
// Début des fonctions principales pour jouer à Hive
// ------------------------------------------------------

function hideHex(position){
    console.log('fonction hideHex sur : '+ position);
    d3.select('#h'+position).attr("stroke", "black");
}

socket.on('hide', (data) => {
    console.log('chemin hide client : '+ position);
    hideHex(data.position);
});

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
    console.log("J'essaie d'active l'hexagone " + indiceHexagone);
    var hexagone = d3.select('#h' + indiceHexagone);

    // Vérifier la couleur de remplissage actuelle
    var couleurRemplissage = hexagone.attr("fill");
    
    // Si la couleur de remplissage n'est pas rouge, rendre transparent et cliquable
    if (hexagone.attr('jeton') == 'vide'
     && couleurRemplissage != "white"
     && couleurRemplissage != "black") {
        console.log("l'hexagone est actif ! " + indiceHexagone);
        hexagone
            .classed("desactive", false)
            .classed("hexagoneReactive", true)
            .attr("fill", "transparent")
            .attr("stroke", "black")
            .style("pointer-events", "auto")
            .style("display", "block");
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

socket.on('instructionsRedActivation', (data) => {
    // Activer les hexagones autour selon les instructions du serveur
    toggleHexagone(data);
});

var rayonGlobal = 0

//fonction pour supprimer l'image ajoutée à la case "elemCase" désignée par la balise path
function supprimerImageDeCase(elemCase) {
    var svgElement = elemCase.closest('svg')[0];
    var image = d3.select(svgElement).select('image');
    image.remove();
}


//fonction pour poser le pion "pion" sur la case "elemCase" désignée par la balise path
function posePionSurCase(elemCase, pion, couleur, joueur, type){
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
        if(type == "poser"){
            $("#actions_action").append("<li>"+joueur+" a posé "+dicoPionHistorique[pion]+"</li>");
        }
        else{
            $("#actions_action").append("<li>"+joueur+" a déplacé "+dicoPionHistorique[pion]+"</li>");
        }
    }
}

function indiceFourmiRec(damier, liste){
    let indicesAutour = [];
    let ListeIndiceRec = liste;
     // Version récursive si la boucle for extensive pose problème
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
}

function determinerIndicesLigne(position) { 
    // Rend une liste de listes contenant les positions des cases sur la ligne et diagonales (HG, HD, BG, BD)
    let indices = [];
    console.log("determinerIndicesLigne start");

    // Pour déterminer les cases des colonnes à gauche et à droite de la case spécifiée
    let colonne = position % 40;

    // Cases à gauche de la case spécifiée
    let indiGauche = [];
    for (let i = colonne - 1; i >= 0; i--) {
        indiGauche.push(position - (colonne - i));
    }

    // Cases à droite de la case spécifiée
    let indiDroite = [];
    let indiplus = colonne;
    let i = 0;
    while(indiplus%40 != 0){
        indiDroite.push(parseInt(position) + i);
        i++;
        indiplus++;
    }
    indiDroite.pop(parseInt(position));
    console.log("indiGauche " + indiGauche);
    console.log("indiDroite " + indiDroite);
    indices.push(indiGauche);
    indices.push(indiDroite);


    console.log("determinerIndicesLigne partie ligne");


    // Pour déterminer les cases des diagonales
    let posTempCol = position;
    while (posTempCol % 40 != 0) {
        posTempCol--;
    }
    let lignePairBase = posTempCol % 80 == 0 ? false : true;
    // Case en haut à gauche (HG)
    let indiHG = [];
    let lignePair = lignePairBase;
    let addHG;
    if (lignePair) addHG = position - 41;
    else addHG = position - 40;
    while (addHG >= 0) {
        indiHG.push(addHG);
        if (lignePair) {
            addHG -= 40;
            lignePair = !lignePair;
        } else {
            addHG -= 41;
            lignePair = !lignePair;
        }
    }
    indices.push(indiHG);

    console.log("determinerIndicesLigne HG");

    // Case en haut à droite (HD)
    let indiHD = [];
    lignePair = lignePairBase;
    let addHD;
    if (lignePair) addHD = parseInt(position) - 40;
    else addHD = parseInt(position) - 39;
    while (addHD >= 0) {
        indiHD.push(addHD);
        if (lignePair) {
            addHD -= 39;
            lignePair = !lignePair;
        } else {
            addHD -= 40;
            lignePair = !lignePair;
        }
    }
    indices.push(indiHD);

    console.log("determinerIndicesLigne HD");

    // Case en bas à gauche (BG)
    let indiBG = [];
    lignePair = lignePairBase;
    let addBG;
    if (lignePair) addBG = parseInt(position) + 39;
    else addBG = parseInt(position) + 40;
    console.log("while : " + addBG < 1600)
    while (addBG < 1600) {
        indiBG.push(addBG);
        console.log("indiBG.push(addBG); ---" + addBG + " : ", indiBG);
        if (lignePair) {
            addBG += 40;
            lignePair = !lignePair;
        } else {
            addBG += 39;
            lignePair = !lignePair;
        }
    }
    indices.push(indiBG);

    console.log("determinerIndicesLigne BG" + indiBG);


    // Case en bas à droite (BD)
    let indiBD = [];
    lignePair = lignePairBase;
    let addBD;
    if (lignePair) addBD = parseInt(position) + 40;
    else addBD = parseInt(position) + 41;
    while (addBD < 1600) {
        indiBD.push(addBD);
        if (lignePair) {
            addBD += 41;
            lignePair = !lignePair;
        } else {
            addBD += 40;
            lignePair = !lignePair;
        }
    }
    indices.push(indiBD);

    console.log("determinerIndicesLigne BD" + indiBD);


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

// Calcul des déplacements effectués par chaque pion
function CasesDeplacementJeton(damier, positionActuelle, typeJeton) {
    let indicesAutour = determinerIndicesAutour(positionActuelle);
    let indiceRetour = [];
    console.log("indicesAutour" + indicesAutour);
    switch (typeJeton){
        case 'Abeille' :
            for(position of indicesAutour){
                // console.log(position);
                // console.log(damier[position].attr('jeton'));
                if(damier[position].attr('jeton') == "vide")
                    indiceRetour.push(position);
                    console.log("indiceRetour :" + indiceRetour);
            }
            break;
    
        case 'Araignee' :
            let casesAutourAraignee1 = [];
            let casesAutourAraignee2 = [];
            for(indice1 in indicesAutour){
                //console.log("indice1 : " + indice1 + "\n damier[indice1] :" + damier[indice1] + "\n indicesAutour[indice1] :" + indicesAutour[indice1] + "\n damier[indice1].attr('jeton') :" + damier[indice1].attr('jeton'));
                if(damier[indicesAutour[indice1]].attr('jeton') == "vide"){
                    casesAutourAraignee1.push(indicesAutour[indice1]);
                }
            }

            for(indice2 in casesAutourAraignee1){
                let casesAutourTemp2 = determinerIndicesAutour(casesAutourAraignee1[indice2]);
                for(indiceTemp2 in casesAutourTemp2){
                    //console.log("indiceTemp2 : " + indiceTemp2 + "\n damier[indiceTemp2] :" + damier[indiceTemp2] + "\n damier[indiceTemp2].attr('jeton') :" + damier[indiceTemp2].attr('jeton'));
                    if(damier[casesAutourTemp2[indiceTemp2]].attr('jeton') == "vide"){
                        casesAutourAraignee2.push(casesAutourTemp2[indiceTemp2]);
                    }
                }
            }

            for(indicef in casesAutourAraignee2){
                let casesAutourTempf = determinerIndicesAutour(casesAutourAraignee2[indicef]);
                for(indiceTempf in casesAutourTempf){
                    //console.log("indiceTempf : " + indiceTempf + "\n damier[indiceTempf] :" + damier[indiceTempf] + "\n damier[indiceTempf].attr('jeton') :" + damier[indiceTempf].attr('jeton'));
                    if(damier[casesAutourTempf[indiceTempf]].attr('jeton') == "vide"){
                        indiceRetour.push(casesAutourTempf[indiceTempf]);
                    }
                }
            }
        break;

        case 'Coccinelle' :
            let casesAutourCocinelle1 = [];
            let casesAutourCocinelle2 = [];


            for(indice1 of indicesAutour){
                // console.log("indice1 : " + indice1 + "\n damier[indice1] :" + damier[indice1] 
                // + "\n damier[indice1].attr('jeton') :" + damier[indice1].attr('jeton'));
                if(damier[indice1].attr('jeton') != "vide"){
                    casesAutourCocinelle1.push(indice1);
                }
            }

            console.log("casesAutourCocinelle1 : " + casesAutourCocinelle1);

            for(indice2 of casesAutourCocinelle1){
                // console.log("indice2 : " + indice2 + "\n damier[indice2] :" + damier[indice2] 
                // + "\n damier[indice2].attr('jeton') :" + damier[indice2].attr('jeton'));
                let casesAutourTemp2 = determinerIndicesAutour(indice2);
                for(indiceTemp2 of casesAutourTemp2){
                    if(damier[indiceTemp2].attr('jeton') != "vide"){
                        casesAutourCocinelle2.push(indiceTemp2);
                    }
                }
            }

            for(indicef of casesAutourCocinelle2){
                let casesAutourTempf = determinerIndicesAutour(indicef);
                for(indiceTempf of casesAutourTempf){
                    if(damier[indiceTempf].attr('jeton') == "vide"){
                        indiceRetour.push(indiceTempf);
                    }
                }
            }
        break;

        case 'Fourmi' :
            let reponse = [];
            let damierActif = [];
            for(let caseActive=0;caseActive<=(40*40)-1;caseActive++){
                let caseAutourActive = determinerIndicesAutour(caseActive);
                let conditionClearDamier = false;
                //console.log(caseAutourActive);
                for(caseRF of caseAutourActive){
                    if(caseRF<1600 && caseRF >= 0)
                    if(damier[caseRF].attr("jeton") != "vide") conditionClearDamier = true;
                }
                if(conditionClearDamier){
                    damierActif.push(caseRF);
                }
            }

            // console.log("damierActif.length : "+ damierActif.length);
            // console.log("damierActif : " +damierActif);

            let damierFourmi = []; // /!\ ptite triche en attendant /!\
            for(hexa of damier){
                if(hexa.attr("jeton")=="vide" && parseInt(hexa.attr("id").substring(1)) < 1600 && parseInt(hexa.attr("id").substring(1)) >= 0){
                    damierFourmi.push(hexa.attr("id").substring(1));
                }
            }


            console.log("damierActif.length : "+ damierActif.length);
            console.log("damierActif : " +damierActif);

            damierActif.pop(positionActuelle);
            let caseAutourPosAct = determinerIndicesAutour(positionActuelle);
            for(indiceAPA of caseAutourPosAct){
                if(damierActif.includes(indiceAPA)){
                    if(damier[indiceAPA].attr("jeton") == "vide"){
                        let autourIndAPA = determinerIndicesAutour(indiceAPA);
                        let is_alone = true;
                        for(indiceAPArec of autourIndAPA){
                            if(damierActif.includes(indiceAPArec))
                            if(damier[indiceAPArec].attr("jeton") != "vide"){
                                is_alone = false;
                            }
                        }
                        if(is_alone) damierActif.pop(indiceAPA);
                    }
                }
            }

            
            for(caseDispoFourmi of indicesAutour){
                if(damier[caseDispoFourmi].attr("jeton") == "vide"
                && !reponse.includes(caseDispoFourmi)){
                    reponse.push(caseDispoFourmi);
                }
            }
            let tailleFin = -1;
            while(tailleFin < reponse.length){
                //console.log("Nouvelle entree boucle while");
                for(i of reponse){
                    //console.log("Nouvelle entree boucle for 1, i :" + i);
                    tailleFin = reponse.length;
                    indicesAutour = determinerIndicesAutour(i);
                    for(caseDispoFourmi of indicesAutour){
                        //console.log("Nouvelle entree boucle for 2, caseDispoFourmi :" + caseDispoFourmi);
                        if(damierActif.includes(caseDispoFourmi)){
                            if(damier[caseDispoFourmi].attr("jeton") == "vide"
                            && !reponse.includes(caseDispoFourmi)){
                                //console.log("Nouvelle entree boucle if");
                                reponse.push(caseDispoFourmi);
                            }
                        }
                    }
                }
            }
            

            //console.log("reponse "+reponse);
            reponse.pop(positionActuelle)
            //console.log("indiceFinalFourmi" + indiceFinalFourmi);
            indiceRetour = [...new Set(reponse)];
            //console.log("indiceRetour : " + indiceRetour);
            indiceRetour = damierFourmi; // A retirer !
        break;
        
        case 'Moustique' :
            let listeMoustique = [];
            let listeAddMoustique = []
            for(indice of indicesAutour){
                if(damier[indice].attr('jeton') != "vide" && !listeMoustique.includes(damier[indice].attr('jeton')))
                listeMoustique.push(damier[indice].attr('jeton'));
            }
            for(pionMoustique of listeMoustique){
                listeAddMoustique = CasesDeplacementJeton(damier, positionActuelle, pionMoustique)
                for(indiceMoustique of listeAddMoustique){
                    if(!indiceRetour.includes(indiceMoustique))
                        indiceRetour.push(indiceMoustique);
                }
            }
            break;

        case 'Sauterelle' :
            let indicesSauterelle = determinerIndicesLigne(positionActuelle);
            console.log("indicesSauterelle :", indicesSauterelle);
            for(ligne of indicesSauterelle){
                if(ligne[0] == positionActuelle){
                    ligne = ligne.filter(element => element !== positionActuelle);
                }
                if(damier[ligne[0]].attr('jeton') != "vide"){
                    interne : for(caseSaut of ligne){
                        console.log("interne for");
                        if(damier[caseSaut].attr('jeton') == "vide"){
                            indiceRetour.push(caseSaut);
                            console.log(caseSaut);
                            break interne;
                        }
                    }
                }
            }
        break;

        case 'Scarabee' :
            return determinerIndicesAutour(positionActuelle);
    }
    for(ind of indicesAutour){
        let verifCasesSeul = determinerIndicesAutour(ind);
        let seul = true;
        for(CaseInd of verifCasesSeul){
            if(damier[CaseInd].attr("jeton") != "vide" && CaseInd != positionActuelle) seul = false;
        }
        if(seul){
            console.log("indiceRetour avant filtre : " + indiceRetour);
            console.log("élément a retirer : " + ind);
            indiceRetour = indiceRetour.filter(element => element !== ind);
            console.log("indiceRetour Après filtre : " + indiceRetour);
        }
    }
    console.log("indiceRetour :" + indiceRetour);
    let listeSansDoublons = [...new Set(indiceRetour)];
    console.log("listeSansDoublons" + listeSansDoublons); 
    return listeSansDoublons;
}


// Fonction principale gérant le plateau et les pions dans son ensemble
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
                    let pionActuel = d3.select(this).attr("id");
                    console.log("pion cliqué : ", pionActuel);
                    console.log("pion origine : ", deplacementPionOrigine);

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
                        console.log(d3.select(this).attr("jeton"));
                        if(!modeSelectionDeplacement){
                            caseDisponiblePourDeplacer = [];
                        }
                        if (d3.select(this).attr("jeton") != "vide"){
                            let listeCase = [];
                            console.log(modeSelectionDeplacement);
                            if(modeSelectionDeplacement){
                                if(pionActuel == deplacementPionOrigine){
                                    deplacementPionOrigine = null;
                                }
                                modeSelectionDeplacement = false;
                                unhighlight();
                            }else{
                                modeSelectionDeplacement = true;
                                deplacementPionOrigine = pionActuel;
                            }
                            
                            for (let i = 0; i < nbLignes * nbColonnes; i++) {
                                listeCase.push(d3.select('#h' + i));
                            }
                            

                            let caseAutourDeplacement = determinerIndicesAutour(position);
                            let is_movement_allowed = true;
                            let nb_pion = 0;
                            for(caseDeplacement of caseAutourDeplacement){
                                if(d3.select("#h" + caseDeplacement).attr("jeton") != "vide") nb_pion++;
                                let caseAutourDeplacementRec = determinerIndicesAutour(caseDeplacement);
                                let need_allow = false;
                                // console.log("caseAutourDeplacementRec avant suppression :", caseAutourDeplacementRec);
                                // console.log("élément à supprimer :", position);
                                position = parseInt(position, 10); // Convertir position en nombre
                                caseAutourDeplacementRec = caseAutourDeplacementRec.filter(element => element !== position);
                                //console.log("caseAutourDeplacementRec après suppression :", caseAutourDeplacementRec);                                
                                if(d3.select("#h" + caseDeplacement).attr("jeton") != "vide"){
                                    for(caseAllow of caseAutourDeplacementRec){
                                        console.log("d3.select('#h' + caseAllow).attr('jeton') :"+d3.select("#h" + caseAllow).attr("jeton"));
                                        if(d3.select("#h" + caseAllow).attr("jeton") != "vide"){
                                            need_allow = true;
                                            console.log("trouvé");
                                        }
                                    }
                                    if(!need_allow){
                                        is_movement_allowed = false;
                                    }
                                }
                            }
                            console.log("movement allowed :", is_movement_allowed);
                            if(is_movement_allowed || nb_pion == 1){
                                // console.log(listeCase);
                                // console.log(listeCase[0].attr("jeton"));
                                caseDisponiblePourDeplacer = CasesDeplacementJeton(listeCase, position, d3.select(this).attr("jeton"));
                                //console.log(caseDisponiblePourDeplacer);

                                // Sélectionner uniquement les cases disponibles
                                //console.log("cases disponibles :",caseDisponiblePourDeplacer);
                                if(deplacementPionOrigine != null && modeSelectionDeplacement){
                                    socket.emit("highlightDeplacement", {"casesDisponibles" : caseDisponiblePourDeplacer, "pionOrigine" : deplacementPionOrigine});
                                }
                            }
                        }
                        caseDisponiblePourDeplacer = caseDisponiblePourDeplacer.map(function (x) { 
                            return parseInt(x); 
                        });
                        console.log(parseInt(pionActuel.replace("h", "")));
                        if(caseDisponiblePourDeplacer.includes(parseInt(pionActuel.replace("h", "")))){
                            console.log("cas où on veut déplacer le pion à cet emplacement");
                            let listeCase = [];
                            for (let i = 0; i < nbLignes * nbColonnes; i++) {
                                listeCase.push(d3.select('#h' + i));
                            }
                            console.log(listeCase);
                            console.log(deplacementPionOrigine);
                            let tPion = d3.select("#"+deplacementPionOrigine).attr("jeton");
                            console.log(tPion);
                            socket.emit("deplacerPion", {"caseOrigine" : deplacementPionOrigine, "caseArrivee" : pionActuel, "damier" : listeCase, "typePion" : tPion });
                        }
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
        posePionSurCase(path, data.pion, data.couleur, data.joueur, "poser");
        selectionPion = null;
        pose.play();
    });

    socket.on("ReceptDeplacerPion", (data) => {
        let pathOrigine = $('path#' + data.caseOrigine);
        let pathArrivee = $('path#' + data.caseArrivee);
        console.log("data.caseOrigine : ", data.caseOrigine);
        caseOrigine = data.caseOrigine;
        caseArrivee = data.caseArrivee;
        console.log("d3.select('#'+data.caseOrigine) : ", d3.select('#'+data.caseOrigine));
        console.log("caseOrigine.substring(1) : "+caseOrigine.substring(1));
        let caseAcote = determinerIndicesAutour(caseOrigine.substring(1));
        console.log("caseAcote : "+caseAcote);
        for(caseDiscover of caseAcote){
            let seul = true;
            console.log("reception 2, caseDiscover : " + caseDiscover);
            let caseAcoteDiscover = determinerIndicesAutour(caseDiscover);
            console.log("caseAcoteDiscover avant filtre : " + caseAcoteDiscover);
            console.log("nombre a filtrer : " + data.caseOrigine.substring(1));
            caseAcoteDiscover = caseAcoteDiscover.filter(element => element != caseOrigine.substring(1));
            console.log("caseAcoteDiscover apres filtre : " + caseAcoteDiscover);
            for(verifSeul of caseAcoteDiscover){
                console.log("reception 3, verifSeul : " + verifSeul);
                console.log("d3.select('#h'+verifSeul).attr('jeton')!='vide' : " + d3.select('#h'+verifSeul).attr('jeton')!='vide');
                if(d3.select('#h'+verifSeul).attr('jeton')!='vide'){
                    console.log("Il n'est pas seul !");
                    seul = false;
                }
            }
            if(seul){
                console.log("Seul ! " + '#h'+ caseDiscover + " existe ? " + d3.select('#h'+caseDiscover));
                console.log("d3.select('#h'+caseDiscover).classed(desactive, true) : " + d3.select('#h'+caseDiscover).classed("desactive", true));
                d3.select('#h'+caseDiscover).classed("desactive", true)
                .style("display", "none")
                .style("pointer-events", "none");
                
            }
        }
        let caseAcoteArivee = determinerIndicesAutour(caseArrivee.substring(1));
        console.log("case a activer : " + caseAcoteArivee);
        for(caseApparition of caseAcoteArivee){
                //toggleHexagone({ 'position': caseApparition, 'indices': determinerIndicesAutour(caseApparition) });
                activerHexagone(caseApparition);
                /*
                d3.select('#h'+caseApparition).classed("desactive", false)
                    .classed("hexagoneWhiteBorder", true)
                    .attr("stroke", "black")
                    .style("pointer-events", "auto");
                */
        }
        /* 
                        d3.select('#h'+caseDiscover).classed("desactive", false)
                .classed("hexagoneWhiteBorder", true)
                .style.pointerEvents = "auto";
         */
        d3.select("#"+data.caseOrigine).attr("jeton", "vide");
        d3.select("#"+data.caseArrivee).attr("jeton", data.pionDeplace.replace("pion", ""));
        casesHighlight[data.caseOrigine.replace("h", "")] = "none";
        unhighlight();
        supprimerImageDeCase(pathOrigine);
        posePionSurCase(pathArrivee, data.pionDeplace, data.couleurPionDeplace, data.joueur, "déplacer");
        deplacementAudio.play();
        if(data.pionEnDessous != null){
            supprimerImageDeCase(pathOrigine);
            posePionSurCase(pathOrigine, data.pionEnDessous, data.couleurPionEnDessous, data.joueur);
        }
    });

    // Affiche un message d'erreur à la manière d'un alert()
    function messageErreurEnJeu(message){
        if(!messageEnCours){
            messageEnCours = true;
            var zoneErreur ="<div id='zoneErreur' class='jeuErreur'><div class='texteJErreur'>"+message+"</div></div>";
            $("body").append(zoneErreur);
            $('#zoneErreur').delay(2000).fadeOut(300).delay(0).queue(() => {
                $('#zoneErreur').remove(); // Après 2s, le texte commence à disparaitre puis une fois qu'on ne voit plus, il est supprimé
                messageEnCours = false;
            });
        }
    }
    
    // Socket de réception indiquant à un joueur qui souhaite joué que ce n'est pas son tour
    socket.on("pasTonTour", () => {
        console.log("C'est le tour du joueur adverse");
        messageErreurEnJeu("Ce n'est pas votre tour.");
    });

    // Socket de réception indiquant à un joueur qui souhaite joué que ce n'est pas son pion
    socket.on("pasTonPion", () => {
        console.log("C'est un pion adverse, vous ne pouvez pas le déplacer");
        messageErreurEnJeu("Ce n'est pas votre pion.");
    });

    // Socket de réception indiquant à un joueur qui souhaite joué que la case n'est pas disponible
    socket.on("caseDejaPrise", () => {
        console.log("La case est déjà prise");
        messageErreurEnJeu("Cette case est déjà occupée.");
    });

    // Socket mettant à jour le compteur de tour en haut de l'écran
    socket.on("infosTour", (data) => { 
        console.log("C'est au tour du joueur", data.tour, " de jouer");
        console.log("Tour n°"+data.compteurTour);
        if(data.compteurTour == 3){
            $("#cptTourActuel").text("Tour : "+data.compteurTour+" - N'oubliez pas de poser votre reine !");
        }else{
            $("#cptTourActuel").text("Tour : "+data.compteurTour);
        }
        $("#tourJoueur").text(data.joueur+" doit poser ou déplacer une pièce");
    })

    // Socket de réception indiquant à un joueur qui souhaite joué qu'il doit poser son abeille
    socket.on("placerAbeille", () => {
        console.log("Il faut placer l'abeille");
        messageErreurEnJeu("Vous devez placer votre abeille.");
    })

    // Socket de réception en cas de détection d'une victoire
    socket.on("victoire", (data) =>{
        // console.log("Ma data :\n",data);
        affichageDeLaVictoire(); // Affichage de la page de victoire
        socket.emit("sortieDePartie",data);
        if(data.egalite1 && data.egalite2){ // En cas d'égalité
            defaite.play();
            $("#tourJoueur").text("Egalité ! - Personne ne gagne !");
        }
        if(data.gagnant && data.perdant){ // Si on a un gagnant et un perdant
            if(socket.id === data.gagnant[1]){ // Si vous êtes le gagnant
                win.play();
                $("#tourJoueur").text(data.gagnant[0]+" a remporté la partie ! - Vous avez gagné !");
            }
            if(socket.id === data.perdant[1]){ // Si vous êtes le perdant
                defaite.play();
                $("#tourJoueur").text(data.gagnant[0]+" a remporté la partie ! - Vous avez perdu...");
            }
        }
    });

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
        if(selectionPion != this.id){
            selectionPion = this.id;
            deplacementPionOrigine = null;
            unhighlight();
            socket.emit("afficheCasesJouables");
        }else{
            selectionPion = null;
            unhighlight();
        }
    }
});

// Fonction qui met en surbrillance verte une case possible
function highlight(cases, couleurs){
    //couleurs = {"h820" : "black", "h721" = "white"} par exemple
    console.log("couleurs : ", couleurs);
    for(c of cases){
        d3.select("#h"+c)
            .attr("fill", "green")
            .attr("opacity", 0.3)
            .attr("stroke", "green");
        if(Object.keys(couleurs).includes("h"+c)){
            casesHighlight[c] = couleurs["h"+c];
        }
        else{
            casesHighlight[c] = "none";
        }
    }
}

// Fonction qui retire la surbrillance verte
function unhighlight(){
    console.log("casesHighlight : ", casesHighlight);
    for(c in casesHighlight){
        d3.select("#h"+c)
            .attr("fill", casesHighlight[c])
            .attr("opacity", 1)
            .attr("stroke", "black");
    }
    casesHighlight = {};
}

// Surbrillance des cases
socket.on("HighlightCasesJouables", (cases) => {
    highlight(cases, {});
});

// Enleve la surbrillance
socket.on("UnhighlightCases", () => {
    unhighlight();
});

// Surbrillance pour les déplacements
socket.on("recupHighlightDeplacement", (data) => {
    console.log("je vais highlight : ", data.couleurs);
    highlight(data.cases, data.couleurs);
});