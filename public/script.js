$(document).ready(() => {
    $("#creer").hide();
    $("#rejoindre").hide();
    $("#lobby").hide();
    $("#jeu").hide();
})

const socket = io();

document.addEventListener('DOMContentLoaded', function () {
    // Code socket.io
    socket.on("hello from server", () => {
        console.log("Connecté au serveur Socket.IO");
    });
});
// Pour killian : En gros je connecte ici et le fait bien attention de le faire avant de charger les élément de la page pour éviter les conflits ^^

/*
socket.on("connexion", () => {

    console.log("Connecté au serveur Socket.IO");
});

socket.on("hello from server", () =>  {
    console.log("socket io connecté");
});
 */

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

function genereDamier(rayon, nbLignes, nbColonnes) {
    if(nbLignes==9 && nbColonnes==9){  /* augmente la taille globale du damier*/
        rayon=rayon+5;
    };
    if(nbLignes==19 && nbColonnes==19){  /* reduire la taille globale du damier*/
        rayon=rayon-5;
    };
    var i=0;
    distance =  rayon - (Math.sin(1 * Math.PI / 3) * rayon);  // plus grande distance entre l'hexagone et le cercle circonscrit

    d3.select("#tablier").append("svg").attr("width", (nbLignes*2)*rayon).attr("height",nbLignes*1.5*rayon);
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

                .attr("fill", "burlywood")
                .attr("class", function() {
                    return "hexagone" + (ligne * nbLignes + colonne);
                })
                .attr("id", "h"+(ligne*nbLignes+colonne)) // car un id doit commencer par une lettre pour pouvoir être utilisé
                .on("click", function(d) {
                    let position=d3.select(this).attr('id').substring(1);
                    socket.emit('discover',{'position':position});
                    //let position=d3.select(this).attr('id').substring(1);
                    //let typePion = document.querySelector('input[name="swap"]:checked').id;
                    //console.log("typePion : "+typePion)
                    //console.log(position);
                    //socket.emit('pion',{'typePion':typePion,'position':position,'numJoueur':jeton});
                    //console.log("typePion hexagone apres emit : "+typePion);
                    // if(typePion=="pion")
                    d3.select(this).attr('fill', "red");
                    // d3.select(this).attr('fill', couleursJoueurs[jeton]);
                });
            }
            

    }


    // Créer un nouvel élément SVG pour tous les éléments ayant comme classe "pion"
    var svgPions = d3.selectAll(".pion").append("svg").attr("width", 100).attr("height", 100);

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
    
    console.log(document.getElementById("pionAbeille"));
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

    //Quand la centaine est paire, il faut faire +1
    //Quand la centaine est impaire, il faut faire -1

    for(i of milieu) {
        console.log(milieu.includes(i),i);
        d3.select('#h'+i).attr("stroke", "black");
    }
    for(var i = 0; i < nbLignes * nbColonnes; i++){
        if(!milieu.includes(i))
            d3.select('#h'+i).classed("hexagoneWhiteBorder", true);
    }
}