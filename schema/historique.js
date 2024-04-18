const mongoose = require('mongoose');
//la table winner ( appeler schema) 
const HistoriqueSchema = mongoose.Schema({
    Joueur_1 : String,
    Joueur_2 : String,
    Winner : String,
    Plateau : []
});
//permet de pouvoir importer la table dans le projet / index.js
const model = mongoose.model("Historique", HistoriqueSchema);

module.exports = model;