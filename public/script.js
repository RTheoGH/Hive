$(document).ready(() => {
    $("#creer").hide();
    $("#rejoindre").hide();
    $("#lobby").hide();
})

/* fonction pour "clear" la page web afin d'afficher le jeu */
function debutPartie(){
    clear();
    genereDamier(15,22);
}

function clear(){                    
    $(".menu").remove();
    $("body").removeClass();
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

//idée : nbHexa = 0
// for tailleCote :
//  for tailleCote :
//    ajouter nbHexa à gauche
//    if nHexa


function genereDamier(rayon, tailleCote) {
    if(tailleCote==9 && tailleCote==9){  /* augmente la taille globale du damier*/
        rayon=rayon+5;
    };
    if(tailleCote==19 && tailleCote==19){  /* reduire la taille globale du damier*/
        rayon=rayon-5;
    };
    var i=0;
    distance =  rayon - (Math.sin(1 * Math.PI / 3) * rayon);  // plus grande distance entre l'hexagone et le cercle circonscrit

    d3.select("#tablier").append("svg").attr("width", (tailleCote*2)*2*rayon).attr("height",tailleCote*2*rayon);
    var hexagone = creeHexagone(rayon);
    console.log(hexagone)
    var nbHexagoneLigne = 0
    for (var ligne=0; ligne < tailleCote; ligne++) {
        i++;
        for (var colonne=0; colonne < tailleCote + nbHexagoneLigne; colonne++) {
            var d = "";
            var x, y;
            for (h in hexagone) {
                x = hexagone[h][0]+(rayon-distance)*(2+2*colonne-i)+(tailleCote*15);
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
                .attr("id", "h"+(ligne*tailleCote+colonne)) // car un id doit commencer par une lettre pour pouvoir être utilisé
                //.on("click", function(d) {
                    //let position=d3.select(this).attr('id').substring(1);
                    //let typePion = document.querySelector('input[name="swap"]:checked').id;
                    //console.log("typePion : "+typePion)
                    //console.log(position);
                    //socket.emit('pion',{'typePion':typePion,'position':position,'numJoueur':jeton});
                    //console.log("typePion hexagone apres emit : "+typePion);
                    // if(typePion=="pion")
                    // d3.select(this).attr('fill', couleursJoueurs[jeton]);
                //});
            }
        nbHexagoneLigne +=1
    }
}