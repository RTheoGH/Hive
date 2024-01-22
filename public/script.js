/* fonction pour "clear" la page web afin d'afficher le jeu */

function debutPartie(){
    clear();
    genereDamier(50,10,10);
}

function clear(){                    
    $(".menu").remove();
    $("body").removeClass();
    // faut jquery
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

    d3.select("#tablier").append("svg").attr("width", (nbLignes*2)*2*rayon).attr("height",nbLignes*2*rayon);
    var hexagone = creeHexagone(rayon);
    for (var ligne=0; ligne < nbLignes; ligne++) {
        i++;
        for (var colonne=0; colonne < nbColonnes; colonne++) {
            var d = "";
            var x, y;
            for (h in hexagone) {
                x = hexagone[h][0]+(rayon-distance)*(2+i+2*colonne);
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
                .attr("id", "h"+(ligne*nbLignes+colonne)) // car un id doit commencer par une lettre pour pouvoir être utilisé
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
    }
}