import Usuario from "../modelo/usuario.js";
import DIVISAS from '../modelo/criptodivisas.js';
import Eliminado from "../modelo/eliminado.js";

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

        let eliminado = await Eliminado.find({id_google:datos.id_google})

        if(eliminado.length > 0){
            datos.resets = eliminado[0].resets;
        }

        let nuevoUsuario = new Usuario(datos);

        await nuevoUsuario.save();

    },

    async borrar(id){

        let usuario = await Usuario.findById(id);

        const query = { id_google: usuario.id_google };
        const update = { $set: { id_google: usuario.id_google, resets: usuario.resets+1 }};

        await Eliminado.updateOne(query, update, { upsert: true });

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

    async getRankingUsuarios(criptodivisas){

        let ranking = await Usuario.aggregate([
            {
                $project: {
                    item: 1,
                    nombre:'$nombre',
                    resets:'$resets',
                    cartera: { $objectToArray: "$cartera" },
                }
            },
            {
                $unset:'cartera.v.transacciones'
            },
            {
                $unwind:'$cartera'
            },
            {
                $match:{
                    'cartera.v.cantidad':{
                        $ne:0
                    }
                }
            },
            {
                $group:{
                    _id:'$_id',
                    nombre: {$first:'$nombre'},
                    resets:{$first:'$resets'},
                    cartera:{
                        $addToSet:'$cartera'
                    }
                }
            }
        ]);

        let usuarios = ranking.map(datosUsuario=>{

            let usuario = {
                nombre: datosUsuario.nombre,
                resets: datosUsuario.resets
            }

            usuario.total = datosUsuario.cartera.reduce((acu,divisa)=>{

                let precio = criptodivisas.getPrecioValor(divisa.k),
                    cantidad = divisa.v.cantidad;

                return acu + (precio*cantidad);

            },0);

            return usuario;

        });

        usuarios.sort((a,b)=>b.total-a.total);

        return usuarios.splice(0,10);

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
