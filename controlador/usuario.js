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

    async reset(id){

        let usuario = await Usuario.findById(id);

        Object.keys(usuario.cartera).forEach(divisa => {
            usuario.cartera[divisa] = {
                cantidad: 0,
                transacciones: []
            };
        });

        usuario.cartera.fiat = {
            cantidad: 10000,
            transacciones: [{
                cantidad:10000,
                precio:1,
                detalles:"Dinero inicial"
            }]
        };

        usuario.resets++;

        usuario.save();

        return usuario;
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

        let precioTotal = truncarDecimales(transaccion.cantidad * transaccion.precio);

        let carteraCripto = usuario.cartera[transaccion.divisa],
            carteraFiat = usuario.cartera['fiat'];

        let comision = truncarDecimales(precioTotal * 0.01);

        if(comision<1)
            comision = 1;

        if (
            (tipo==='compra' && carteraFiat.cantidad >= (precioTotal + comision)) ||
            (tipo==='venta' && carteraCripto.cantidad >= transaccion.cantidad)
        ){

            let transaccionFiat = {
                tipo:tipo==='compra' ? 'venta' : 'compra',
                precio:1,
                cantidad:precioTotal,
                fecha: new Date(),
                comision: comision,
                detalles:transaccion.divisa
            };

            let transaccionCripto = {
                tipo,
                precio: transaccion.precio,
                fecha: new Date(),
                cantidad: transaccion.cantidad,
                comision: comision,
                detalles:''
            }

            carteraCripto.cantidad += (tipo==='compra' ? 1 : -1) * transaccion.cantidad;
            carteraCripto.transacciones.push(transaccionCripto);

            if(carteraCripto.cantidad * transaccion.precio < 0.1){
                transaccionCripto.cantidad+=carteraCripto.cantidad;
                carteraCripto.cantidad = 0;
            }

            carteraFiat.cantidad += (tipo==='compra' ? -1 : 1) * precioTotal;
            carteraFiat.cantidad -= comision;
            carteraFiat.transacciones.push(transaccionFiat);

            await usuario.save();

            return {
                fiat:transaccionFiat,
                [transaccion.divisa]:transaccionCripto
            }

        }else{
            console.log("Error al generar transaccion");
            console.log("FIAT: ",carteraFiat.cantidad,precioTotal,comision,precioTotal+comision)
            console.log("DIVI: ",carteraCripto.cantidad,transaccion.cantidad)
        }

        return false;

    }

};

function truncarDecimales(numero, dec = 2) {
    const decimales = Math.pow(10, dec);
    return Math.trunc(numero * decimales)/decimales;
}