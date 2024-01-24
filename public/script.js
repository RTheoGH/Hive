/* fonction pour "clear" la page web afin d'afficher le jeu */

function debutPartie(){
    clear();
    genereDamier(25,100,100);
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

    d3.select("#tablier").append("svg").attr("width", (nbLignes*2)*rayon).attr("height",nbLignes*1.5*rayon);
    var hexagone = creeHexagone(rayon);
    console.log(hexagone)
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
                .attr("id", "h"+(ligne*nbLignes+colonne)) // car un id doit commencer par une lettre pour pouvoir être utilisé
                .on("click", function() {
                    //let position=d3.select(this).attr('id').substring(1);
                    //let typePion = document.querySelector('input[name="swap"]:checked').id;
                    //console.log("typePion : "+typePion)
                    //console.log(position);
                    //socket.emit('pion',{'typePion':typePion,'position':position,'numJoueur':jeton});
                    //console.log("typePion hexagone apres emit : "+typePion);
                    // if(typePion=="pion")
                    d3.select(this).attr('fill', "red");
                });
            }
            

    }

    // Créer un nouvel élément SVG pour tous les éléments ayant comme classe "pion"
    var svgPions = d3.selectAll(".pion").append("svg").attr("width", 100).attr("height", 100);

    var d2 = "";
    for (h in hexagone) {
        x = hexagone[h][0]+rayon;
        y = hexagone[h][1]+rayon;
        if (h == 0) d2 += "M" + x + "," + y + " L";
        else d2 += x + "," + y + " ";
    }
    d2 += "Z";

    // Ajouter l'hexagone à l'élément SVG dans #menuPions
    svgPions.append("path")
        .attr("d", d2)
        .attr("stroke", "black")
        .attr("fill", "white")
        .attr("id", "pionAbeille")
        .attr("xlink:href", "/image/abeille.png");

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
}