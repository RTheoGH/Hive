const express = require('express')
const app = express()
const port = 3000

app.get('/',(req,res) => {
    res.sendFile('public/index.html',{root: __dirname})
})

app.get('/public/:nomFichier', (req,res) => {       // chemin permettant d'utiliser les fichiers
    res.sendFile("public/"+req.params.nomFichier,{root: __dirname});
});

app.listen(port,() => {
    console.log(`Serveur sur le port : ${port}`)
})