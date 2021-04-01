import mongoose from 'mongoose';

import DIVISAS from './criptodivisas.js';

let cartera = {};

Object.keys(DIVISAS).concat('fiat').forEach((divisa)=>{
    cartera[divisa] = {
        cantidad:Number,
        transacciones: [{
            _id: false,
            cantidad:Number,
            fecha:Date,
            precio:Number,
            tipo: {
                type:String,
                enum: ['compra','venta'],
                default: 'compra'
            },
            detalles:String
        }]
    }
})

const Usuario = new mongoose.Schema ({
    id_google:{ type: String, required: true },
    nombre: { type: String, required: true },
    email: { type: String, required: true },

    cartera:cartera

});

Usuario.methods.getCantidad = (id) => this.cartera[id].cantidad;


export default mongoose.model('Usuario', Usuario);