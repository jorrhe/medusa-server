require("../db");
const Usuario = require("../modelo/usuario");

const DIVISAS = require('../modelo/divisas')

module.exports = {

    async nuevo(datos){

        datos.cartera = {};

        Object.keys(DIVISAS).forEach(divisa => {
            datos.cartera[divisa] = {
                cantidad: 0,
                transacciones: []
            };
        });

        datos.cartera.euros = {
            cantidad: 10000,
            transacciones: [{
                cantidad:10000,
                fecha:new Date(),
                precio_compra:1
            }]
        };

        let nuevoUsuario = new Usuario(datos);

        await nuevoUsuario.save();

        console.log("Usuario Guardado")

    },

    async getUsuario(idGoogle){
        return Usuario.find({id_google: idGoogle},{_id:0,_v:0});
    },

    // Funciones para comprobar
    async existeNombre(nombre){

        let resultado = await Usuario.find({nombre:nombre},);

        return resultado.length > 0;

    },

    async existeUsuarioDeGoogle(idGoogle){

        let resultado = await Usuario.find({id_google:idGoogle});

        return resultado.length > 0;

    }

};