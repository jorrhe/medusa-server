const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DIVISAS = require('./divisas');

let cartera = {};


Object.keys(DIVISAS).concat('euros').forEach((divisa)=>{
    cartera[divisa] = {
        cantidad:Number,
        transacciones: [{
            _id: false,
            cantidad:Number,
            fecha:Date,
            precio_compra:Number
        }]
    }
})

const Usuario = new Schema ({
    id_google:{ type: String, required: true },
    nombre: { type: String, required: true },
    email: { type: String, required: true },

    cartera:cartera

});

module.exports = mongoose.model('Usuario', Usuario)