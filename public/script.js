// --------------------------------------------------------------------------------------------------------
// ----------------------------------------- Socket de démarrage ------------------------------------------
// --------------------------------------------------------------------------------------------------------

socket.on("Salut c'est le serveur ! :)", () => {
    console.log("socket io connecté");
    $("#creer").hide();
    $("#rejoindre").hide();
    $("#rechercher").hide();
    $("#matchTrouve").hide();
    $("#lobby").hide();
    $("#jeu").hide();
});

// --------------------------------------------------------------------------------------------------------
// ----------------------------------------- Variables ----------------------------------------------------
// --------------------------------------------------------------------------------------------------------

const select = new Audio('public/sons/select.mp3');
const win = new Audio('public/sons/win.mp3');
const erreur = new Audio('public/sons/erreur.mp3');
const notif = new Audio('public/sons/notif.mp3');
const ambiant = new Audio('public/sons/ambiant.mp3');
const file = new Audio('public/sons/file.mp3');
const found = new Audio('public/sons/found.mp3');
const miss = new Audio('public/sons/miss.mp3');

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

// --------------------------------------------------------------------------------------------------------
// ----------------------------------------- Sockets du client --------------------------------------------
// --------------------------------------------------------------------------------------------------------

// Actualisation de salle correspondante
socket.on('majSalle', (data) => {
    // $("#lobby").show();
    $("#lobby").fadeIn(300);
    document.getElementById('nomCodeSalle').innerHTML = data.nom + ' : ' + data.code;
    
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
    const joueurActuel = data.listeJoueurs.find(joueur => joueur[1] == socket.id);
    console.log(joueurActuel);
    console.log("je suis le joueur ",socket.id);
    if(joueurActuel){
        console.log("Ok je rafraichie la page pour afficher le jeu");
        clear();
        initPartie();
    }
});

// Actualisation de la partie en cours
socket.on('majPartie', (data) => {
    const joueurActuel = data.listeJoueurs.find(joueur => joueur[1] == socket.id);
    console.log(joueurActuel);
    if(joueurActuel){
        // Annonce de la victoire si on est le joueur qui reste encore dans la partie
        var victoire ="<div class='victoire'><div class='textVictoire'>Vous remportez la partie !\
            <br/><button class='newGameButton'\
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
    document.getElementById("message_erreur").innerHTML += "Ce nom de salle est déja pris.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si la salle est pleine
socket.on('sallePleine', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Cette salle est pleine.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si le pseudonyme choisi est déjà pris par quelqu'un dans la salle
socket.on('pseudoPris', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Ce nom de joueur est déjà pris.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si la salle n'est pas trouvé
socket.on('salleIntrouvable', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Cette salle n'existe pas.";
    $("#accueil").show();
    erreur.play();
});

// Message d'erreur si le code entré par le joueur n'est pas celui de la salle
socket.on('codeFaux', () => {
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Code faux pour cette salle.";
    $("#accueil").show();
    erreur.play();
});

// Socket de réception des messages
socket.on('recoitMessage', (data) => {
    let puce = ["○", "●"][data.idJ];
    $("#messages").append("<li>"+puce+" <span style='font-weight:bold'>"+data.auteur+"</span>: "+data.message+"</li>");
    notif.play();
});

socket.on('nomVide', () => {
    $("#creer").hide();
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Nom de salle vide.";
    $("#accueil").show();
    erreur.play();
});

socket.on('codeVide', () => {
    $("#creer").hide();
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Code de salle vide.";
    $("#accueil").show();
    erreur.play();
});

socket.on('joueurVide', () => {
    $("#creer").hide();
    $("#lobby").hide();
    document.getElementById("message_erreur").innerHTML += "Nom de joueur vide.";
    $("#accueil").show();
    erreur.play();
});

socket.on('matchTrouve', (data) => {
    matchID = data.MatchID;
    $("#rechercher").hide();
    $("#accepterM").prop("disabled",false);
    $("#matchTrouve").fadeIn(300);
    recherche = false;
    let progress = 100;
    bar1.set(progress);
    let chrono = setInterval(() => {
        progress = progress - 0.769;
        bar1.set(progress);
        // if(accepter && progress > 0){
        //     // Si le joueur a accepté
        //     // Il faut vérifier que l'autre joueur a bien cliqué sur accepter aussi
        // }else 
        if(progress <= 0){
            clearInterval(chrono);
            // progress = 100;
            found.pause();
            found.currentTime = 0
            $("#matchTrouve").hide();
            $("#rechercher").fadeIn(300);
            if(!accepter){
                // accepter = false;
                miss.play();
                $("#pseudoM").prop("disabled",false);
                $("#niveau-match").prop("disabled",false);
                $("#boutonRecherche").prop("disabled",false);
                // nomJoueur = document.getElementById("pseudoM").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');
                // let niveau = document.getElementById("niveau-match").value;
                // console.log(nomJoueur,"n'a pas accepté la partie.");
                // socket.emit("quitterMatchmaking",{"joueur":[niveau,nomJoueur,socket.id,null]});
                clearInterval(timerInterval);
                timerInterval = undefined;
                timerSeconds = 0; // Réinitialiser le compteur de secondes
                if (timerElement) {
                    timerElement.textContent = "";
                    timerElement = undefined; // Effacer le contenu du timerElement
                }
            }else{
                accepter = false;
                console.log("reprise de la file");
                file.play();
                file.addEventListener('timeupdate', function(){
                    if(this.currentTime >= 72){
                        this.currentTime = 0;
                    }
                });
            }
        }
    },100);
    found.play();
    file.pause();
    file.currentTime = 0;
});

// --------------------------------------------------------------------------------------------------------
// -------------------------------------------- Fonctions -------------------------------------------------
// --------------------------------------------------------------------------------------------------------

// Redirection vers la page des règles
function ouvrirRegles() {
    window.location.href = '/regles';
}

// Redirection vers l'accueil
function fermerRegles() {
    window.location.href = '/';
}

function initPartie(){
    genereDamier(40,40,40);
    ambiant.currentTime = 0;
    ambiant.play();
    ambiant.addEventListener('timeupdate', function(){
        if(this.currentTime >= 59){
            this.currentTime = 0;
        }
    });
}

// fonction de début de partie
function debutPartie(){
    document.getElementById("message_erreur").innerHTML = "";
    clear();
    console.log('Je lance la partie');
    socket.emit('lancementPartie');
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

function rechercher(){
    document.getElementById("message_erreur").innerHTML = "";
    $("#accueil").hide();
    $("#pseudoM").prop("disabled",false);
    $("#niveau-match").prop("disabled",false);
    $("#boutonRecherche").prop("disabled",false);
    select.play();
    $("#rechercher").fadeIn(300);
}

// Fonction pour formater le temps au format mm:ss
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

async function recherchePartie() {
    recherche = true;
    while(recherche){
        socket.emit("recherchePartie");
        await attente(1000);
    }
}

function attente(temps){
    return new Promise(resolve => setTimeout(resolve,temps));
}

function lancerRecherche(){
    nomJoueur = document.getElementById("pseudoM").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');
    let niveau = document.getElementById("niveau-match").value;
    console.log("Je lance la file :",nomJoueur);
    socket.emit("rejoindreFile",{"joueur":[niveau,nomJoueur,socket.id,null]});
    if (!timerElement) {
        timerElement = document.getElementById('tempsDAttente');
    }
    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 1000); // Appelle updateTimer() toutes les 1000 ms (1 seconde)
    }
    file.play();
    file.addEventListener('timeupdate', function(){
        if(this.currentTime >= 72){
            this.currentTime = 0;
        }
    });
    $("#pseudoM").prop("disabled",true);
    $("#niveau-match").prop("disabled",true);
    $("#boutonRecherche").prop("disabled",true);
    recherchePartie();
}

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
    file.pause();
    file.currentTime = 0;
    select.play();
    $("#accueil").fadeIn(300);
    nomJoueur = document.getElementById("pseudoM").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');
    console.log(nomJoueur);
    let niveau = document.getElementById("niveau-match").value;
    console.log(niveau);
    socket.emit("quitterMatchmaking",{"joueur":[niveau,nomJoueur,socket.id,null]});
}

function accepterMatch(){
    accepter = true;
    console.log("Accepter :",accepter);
    nomJoueur = document.getElementById("pseudoM").value.trim().replace(/[^a-zA-Z0-9 'çàéèù]/g,'');
    let niveau = document.getElementById("niveau-match").value;
    $("#accepterM").prop("disabled",true);
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

    const typeListe = document.querySelectorAll("input[name='Type']");       // Recup si Duel ou IA
    let typeChoix;
    for (const type of typeListe) {
        if (type.checked) {
            typeChoix = type.value;
            break;
        }
    }
    salle.type=typeChoix;
    const modeListe = document.querySelectorAll("input[name='Mode']");       // Recup si classique/ext1/ext2/ext3
    let modeChoix;
    for (const mode of modeListe) {
        if (mode.checked) {
            modeChoix = mode.value;
            break;
        }
    }
    salle.mode=modeChoix;

    document.getElementById('nomCodeSalle').innerHTML = salle.nom+' : '+salle.code; // Affichage du nom de la salle et du code pour rejoindre
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
    retourAccueil();
    console.log("Je quitte la salle");
    socket.emit('quittePartie');
    $("#lancer").prop("disabled",true);
}

// fonction qui permet de quitter la partie en cours pour retourner à l'accueil
function quitterPartieEnCours(){
    select.play();
    console.log("Je quitte la partie");
    socket.emit('quittePartieEnCours');
    $("#jeu").hide();
    retourAccueil();
    ambiant.pause();
    ambiant.currentTime = 0;
    $("#lancer").prop("disabled",true);
}

function hideHex(position){
    console.log('fonction hideHex sur : '+ position);
    d3.select('#h'+position).attr("stroke", "black");
}

socket.on('hide', (data) => {
    console.log('chemin hide client : '+ position);
    hideHex(data.position);
})

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
    if (couleurRemplissage !== "red") {
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

    if (couleurRemplissage === "red") {
        console.log(data.position + " est rouge.");
        // Hexagone rouge, le désactive et désactive les hexagones autour
        hexagone
            .attr("fill", "none")
        // passer a vide

        // Récupérer les indices des hexagones autour
        var indicesAutour = data.indices;

        // Désactiver les hexagones autour s'ils ne sont pas rouges ou n'ont pas un autre hexagone rouge autour d'eux
        for(indiceR of indicesAutour) {
            console.log(indiceR + " est rouge ou border ?");
            /*
            var hexVoisin = d3.select('#h' + indice);
            var couleurVoisin = hexVoisin.attr("fill");

            // Vérifier si l'hexagone voisin est rouge ou a un hexagone rouge autour de lui
            var indicesVoisinAutour = determinerIndicesAutour(indice);
            let rouge = false;
            for(indiceRed of indicesVoisinAutour){
                if(d3.select('#h' + indiceRed).attr("fill")==="red"){
                    rouge = true;
                }
            }
            var voisinAHexRouge = indicesVoisinAutour.some(function (voisinIndice) {
                var voisinHex = d3.select('#h' + voisinIndice);
                return voisinHex.attr("fill") === "red";
            });
            */
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
function posePionSurCase(elemCase, pion){

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

        d3.select(svgElement).append('image')
            .attr('xlink:href', logosPions[pion])
            .attr('x', x-26)
            .attr('y', y+14)
            .attr('width', rayonGlobal * 1.3)
            .attr('height', rayonGlobal * 1.3);
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

                .attr("fill", "white")
                .attr("class", function() {
                    return "hexagone" + (ligne * nbLignes + colonne);
                })
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
                        }
                        else {
                            socket.emit('discover', {'position': position});
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
        .attr("fill", "white");
    

    // Poser le pion sélectionné sur une case
    $(document).on('click', '.svgHexa', function() {
        if (selectionPion != null) {
            var path = $(this).find('path');   // On sélectionne le path à l'intérieur du svg
            socket.emit("EnvoiPoserPionPlateau", {'case' : path.attr("id"), 'pion' : selectionPion});
        }
    });

    socket.on("ReceptPoserPionPlateau", (data) => {
        var path = $('path#' + data.case);
        posePionSurCase(path, data.pion);
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
    

    
/*
    d3.select('#h5250').attr('fill', 'red')
    d3.select('#h5249').attr('fill', 'green')
    d3.select('#h5251').attr('fill', 'green')
    d3.select('#h5150').attr('fill', 'green')
    d3.select('#h5151').attr('fill', 'green')
    d3.select('#h5350').attr('fill', 'green')
    d3.select('#h5351').attr('fill', 'green')

    d3.select('#h5325').attr('fill', 'orange')
    d3.select('#h5326').attr('fill', 'blue')
    d3.select('#h5324').attr('fill', 'blue')
    d3.select('#h5225').attr('fill', 'blue')
    d3.select('#h5226').attr('fill', 'blue')
    d3.select('#h5425').attr('fill', 'blue')
    d3.select('#h5426').attr('fill', 'blue')
*/
    //Quand la centaine est paire, il faut faire +1
    //Quand la centaine est impaire, il faut faire -1

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
    console.log(data); //affiche le nombre de pions restantss    
});

var selectionPion = null;

$(document).on('click', '.pion', function(){
    selectionPion = this.id;
    // console.log("Pion sélectionné : ", this.id);
});