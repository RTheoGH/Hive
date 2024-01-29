const express = require('express')
const app = express()

const port = 3000

const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server);

server.listen(port, () => {
    console.log(`Serveur écoutant sur le port ${port}`);
});



app.get('/',(req,res) => {
    res.sendFile('public/index.html',{root: __dirname})
})

io.on('connection', (socket) => {
    console.log("socket");
    socket.emit("hello from server");
});

app.get('/public/:nomFichier', (req,res) => {       // chemin permettant d'utiliser les fichiers
    res.sendFile("public/"+req.params.nomFichier,{root: __dirname});
});

app.get('/discover/:position',(request,response)=>{
    console.log("position : "+request.params.position);
})