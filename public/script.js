socket.on("Salut c'est le serveur ! :)", () => {
    console.log("socket io connecté");
    $("#creer").hide();
    $("#rejoindre").hide();
    $("#lobby").hide();
    $("#jeu").hide();
});

var nomJoueur="";
var salle="";
var code="";

/* fonction pour "clear" la page web afin d'afficher le jeu */
function debutPartie(){
    clear();
    $("#jeu").show();
    genereDamier(40,40,40);
}

function clear(){                    
    $(".menu").hide();
}

function creer(){
    $("#accueil").hide();
    $("#creer").show();
}

function rejoindre(){
    $("#accueil").hide();
    $("#rejoindre").show();
}

function retour(){
    $("#accueil").show();
    $("#rejoindre").hide();
    $("#creer").hide();
}

function validerCreation(){
    $("#creer").hide();
    $("#lobby").show();
    const nomSalle = document.querySelector("input[name='nomSalle']").value;
    const codeSalle = document.querySelector("input[name='codeSalle']").value;
    const pseudo = document.querySelector("input[name='pseudo']").value;
    const typeListe = document.querySelectorAll("input[name='Type']");
    let typeChoix;
    for (const type of typeListe) {
        if (type.checked) {
            typeChoix = type.value;
            break;
        }
    }
    const modeListe = document.querySelectorAll("input[name='Mode']");
    let modeChoix;
    for (const mode of modeListe) {
        if (mode.checked) {
            modeChoix = mode.value;
            break;
        }
    }
    nomJoueur = pseudo.trim().replace(/[^a-zA-Z0-9 ]/g,'');
    salle = nomSalle.trim().replace(/[^a-zA-Z0-9 ]/g,'');
    code = codeSalle.trim().replace(/[^a-zA-Z0-9 ]/g,'');
    document.getElementById('nomCodeSalle').innerHTML = salle+' : '+code;
    document.getElementById('J1').innerHTML += nomJoueur;
    socket.emit('paramNewSalle',{'nomSalle':nomSalle,'codeSalle':codeSalle,'pseudo':pseudo,'typeChoix':typeChoix,'modeChoix':modeChoix});
}

function validerRejoindre(){
    $("#rejoindre").hide();
    $("#lobby").show();
}

function quitter(){
    $("#lobby").hide();
    $("#jeu").hide();
    $(".menu").show();
    $("#accueil").show();
}

function hideHex(position){
    console.log('fonction hideHex sur : '+ position);
    d3.select('#h'+position).attr("stroke", "black");
}

socket.on('hide', (data) => {
    console.log('chemin hide client : '+ position);
    hideHex(data.position);
})

/* fonction pour envoyer un message */
function send(){
    let message = $('#message').val().trim().replace(/[^a-zA-Z0-9 ]/g,'');
    if (!message==""){
        console.log(message);
        socket.emit('envoieMessage',{'auteur':nomJoueur,'message':message});
    }
    $('#message').val("");
}

/* reception des messages */
socket.on('recoitMessage', (data) => {
    $("#messages").append("<li>"+data.auteur+": "+data.message+"</li>");
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



function genereDamier(rayon, nbLignes, nbColonnes) {
    if(nbLignes==9 && nbColonnes==9){  /* augmente la taille globale du damier*/
        rayon=rayon+5;
    };
    if(nbLignes==19 && nbColonnes==19){  /* reduire la taille globale du damier*/
        rayon=rayon-5;
    };
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
            d3.select("svg")
                .append("path")
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
                        d3.select(this).attr('fill', "red");
                        // d3.select(this).attr('fill', couleursJoueurs[jeton]);
                    }
                });
            }
            

    }


    // Créer un nouvel élément SVG pour tous les éléments ayant comme classe "pion"
    var svgPions = d3.selectAll(".pion")
                    .append("svg")
                    .attr("width", 100)
                    .attr("height", 100);

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
    
    //Pour mettre les images sur les pions du menu :
    
    var pionAb = d3.select('#pionAbeille')
    pionAb.select('svg').append('image')
        .attr('href', 'https://cdn.discordapp.com/attachments/1173320346372411485/1200083491887513642/abeille.png?ex=65c4e3d8&is=65b26ed8&hm=c3a5878cf857a8c4290650b43e743b82eecb5b953ee5d903b2121e8be1104b62&')
        .attr('x', 10)  
        .attr('y', 10)  
        .attr('width', rayon*1.3)  
        .attr('height', rayon*1.3);

    var pionAr = d3.select('#pionAraignee')
    pionAr.select('svg').append('image')
        .attr('href', 'https://cdn.discordapp.com/attachments/1173320346372411485/1200083492164345976/araignee.png?ex=65c4e3d9&is=65b26ed9&hm=ff1c12d7ad6b268da2cc0fdc5060b1f7d7f7fe4c046c61e1fb153fb3ac79793d&')
        .attr('x', 10)  
        .attr('y', 10)  
        .attr('width', rayon*1.3)  
        .attr('height', rayon*1.3);

    var pionCo = d3.select('#pionCoccinelle')
    pionCo.select('svg').append('image')
        .attr('href', 'https://cdn.discordapp.com/attachments/1173320346372411485/1200083492424384672/coccinelle.png?ex=65c4e3d9&is=65b26ed9&hm=7ee727fe64fafdb8b90c1ab6c52958debe59d15b9939e2f94f2c2fe6cb192f42&')
        .attr('x', 10)  
        .attr('y', 10)  
        .attr('width', rayon*1.3)  
        .attr('height', rayon*1.3);
    
    var pionFo = d3.select('#pionFourmi')
    pionFo.select('svg').append('image')
        .attr('href', 'https://cdn.discordapp.com/attachments/1173320346372411485/1200083492755742800/fourmi.png?ex=65c4e3d9&is=65b26ed9&hm=6a385770c2fde61c2803090fb2ba4547db12abfa4cb0c88ed539d8698a498856&')
        .attr('x', 10)  
        .attr('y', 10)  
        .attr('width', rayon*1.3)  
        .attr('height', rayon*1.3);

    var pionMo = d3.select('#pionMoustique')
    pionMo.select('svg').append('image')
        .attr('href', 'https://cdn.discordapp.com/attachments/1173320346372411485/1200083492994814012/moustique.png?ex=65c4e3d9&is=65b26ed9&hm=0818af4e00bf1abdfb89f2a4d363db90c18e46f88faea801b44a93bfeb4394ed&')
        .attr('x', 10)  
        .attr('y', 10)  
        .attr('width', rayon*1.3)  
        .attr('height', rayon*1.3);

    var pionSa = d3.select('#pionSauterelle')
    pionSa.select('svg').append('image')
        .attr('href', 'https://cdn.discordapp.com/attachments/1173320346372411485/1200083493225496636/sauterelle.png?ex=65c4e3d9&is=65b26ed9&hm=82cbd9cb1cc8362d85c0f38cabe98eb076b9769ebac5548ebc15312535097a28&')
        .attr('x', 10)  
        .attr('y', 10)  
        .attr('width', rayon*1.3)  
        .attr('height', rayon*1.3);

    var pionSc = d3.select('#pionScarabee')
    pionSc.select('svg').append('image')
        .attr('href', 'https://cdn.discordapp.com/attachments/1173320346372411485/1200083493556850758/scarabee.png?ex=65c4e3d9&is=65b26ed9&hm=2131d68f3b5b2b2ce4c06e679ae90111accdb11d123d6c1479f3d2fc539db1c5&')
        .attr('x', 10)  
        .attr('y', 10)  
        .attr('width', rayon*1.3)  
        .attr('height', rayon*1.3);
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


var selectionPion = false;

$(document).on('click', '.pion', function(){
    selectionPion = true;
});