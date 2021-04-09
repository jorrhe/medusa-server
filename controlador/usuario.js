import Usuario from "../modelo/usuario.js";
import DIVISAS from '../modelo/criptodivisas.js';

export default {

    async nuevo(datos){

        datos.cartera = {};

        Object.keys(DIVISAS).forEach(divisa => {
            datos.cartera[divisa] = {
                cantidad: 0,
                transacciones: []
            };
        });

        datos.cartera.fiat = {
            cantidad: 10000,
            transacciones: [{
                cantidad:10000,
                precio:1,
                detalles:"Dinero inicial"
            }]
        };

        let nuevoUsuario = new Usuario(datos);

        await nuevoUsuario.save();

    },

    async borrar(id){
        return Usuario.deleteOne({_id:id});
    },

    async getUsuario(idGoogle){
        return Usuario.find({id_google: idGoogle},{_v:false});
    },

    // Funciones para comprobar
    async existeNombre(nombre){

        // Regex para que no discrimine por mayúsculas y minúsculas
        let regexMin = new RegExp(`\b${nombre}\b`, "i");

        return await Usuario.exists({nombre:regexMin});

    },

    async existeUsuarioDeGoogle(idGoogle){

        let resultado = await Usuario.find({id_google:idGoogle});

        return resultado.length > 0;

    },

    async getRankingUsuarios(){

    },

    async nuevaTransaccion(guid,tipo,transaccion){

        let usuario = await Usuario.findById(guid).exec();

        let precioTotal = transaccion.cantidad * transaccion.precio;

        let carteraCripto = usuario.cartera[transaccion.divisa],
            carteraFiat = usuario.cartera['fiat'];

        if (carteraFiat.cantidad > precioTotal && carteraCripto){

            let transaccionFiat = {
                tipo:tipo==='compra' ? 'venta' : 'compra',
                precio:1,
                cantidad:precioTotal,
                fecha: new Date(),
                detalles:transaccion.divisa
            };

            let transaccionCripto = {
                tipo,
                precio: transaccion.precio,
                fecha: new Date(),
                cantidad: transaccion.cantidad,
                detalles:''
            }

            carteraCripto.cantidad += (tipo==='compra' ? 1 : -1) * transaccion.cantidad;
            carteraCripto.transacciones.push(transaccionCripto);

            carteraFiat.cantidad += (tipo==='compra' ? -1 : 1) * precioTotal;
            carteraFiat.transacciones.push(transaccionFiat);

            await usuario.save();

            return {
                fiat:transaccionFiat,
                [transaccion.divisa]:transaccionCripto
            }

        }

        return false;

    }

};
