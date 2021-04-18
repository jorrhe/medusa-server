import {Server,Socket} from "socket.io";
import socketioJwt from 'socketio-jwt';


const EMITIR = {
    INICIO:"INICIO",
    NUEVO_PRECIO:"PRECIO",
    DIVISAS:"DIVISAS",
    DESCONECTAR:"desconectar"
};

const ON = {
    TRANSACCION: "TRANSACCION",
    BORRAR_CUENTA: "borrar-cuenta",
    RANKING:"RANKING"
};

import controladorUsuario from './usuario.js';

/**
 *
 * @param {Express} server
 * @param {Criptodivisas} criptodivisas
 * @returns {Server<DefaultEventsMap, DefaultEventsMap>}
 */
export default (server,criptodivisas) => {

    const io = new Server(server,{
        cors: {
            origin: process.env.MEDUSA_APP_URL,
            methods: ["GET", "POST"],
            credentials:true
        }
    });

    io.use(socketioJwt.authorize({
        secret: process.env.APP_SECRET,
        handshake: true
    }));

    io.on('connection', socket => {

        controladorUsuario.getUsuario(socket.decoded_token.id).then(resultado => {

            if(resultado.length > 0){

                let usuario = resultado[0];

                socket.usuario = usuario._id;
                socket.room = usuario._id.toString();

                socket.join(socket.room);

                funcionesSocket(socket,usuario,criptodivisas);

            }else{

                console.log("No se encuentra el usuario");
                console.log(resultado);
                socket.emit(EMITIR.DESCONECTAR);
                socket.disconnect();

            }

        }).catch(err => {
            console.log(err);
        });

    });

    // Listeners de criptodivisas

    criptodivisas.on("cambioPrecio",(id,precio) => {
        io.emit(EMITIR.NUEVO_PRECIO,id,precio)
    });

    criptodivisas.on('ult24h',(divisas) => {
        io.emit(EMITIR.DIVISAS,divisas);
    });

    return io;

}
/**
 *
 * @param {Socket} socket
 * @param {Usuario} usuario
 * @param {Criptodivisas} criptodivisas
 */
function funcionesSocket(socket,usuario,criptodivisas){

    socket.emit(EMITIR.INICIO, {
        usuario:usuario,
        divisas:criptodivisas.divisas
    });

    socket.on(ON.TRANSACCION,(transaccion,callback)=>{

        if(!criptodivisas.esTransaccionValida(transaccion)){
            callback(true,'Error con la transaccion');
            return;
        }

        let idUsuario = socket.usuario;

        let tipo = 'compra';

        if(transaccion.tipo === 'vender'){
            tipo = 'venta';
        }

        controladorUsuario.nuevaTransaccion(idUsuario,tipo,transaccion).then(resultado => {

            if(resultado===false){
                callback(true);
            }else{

                socket.to(socket.room).emit(ON.TRANSACCION,resultado);
                console.log(idUsuario)

                callback(false,resultado);

            }

        }).catch(err => {

            console.log(err);

            callback(true,'Ha ocurrido un error con la BD');

        });

    });

    socket.on(ON.RANKING,callback=>{

        controladorUsuario.getRankingUsuarios(criptodivisas).then(resultado=>{

            callback(false,resultado);

        }).catch(err => {

            console.log(err);
            callback(true,'Ha ocurrido un error con la BD');

        })

    });

    socket.on(ON.BORRAR_CUENTA,()=>{
        controladorUsuario.borrar(socket.usuario).then(resultado => {

            if(resultado.deletedCount === 1){

                socket.to(socket.room).emit(EMITIR.DESCONECTAR);
                socket.emit(EMITIR.DESCONECTAR);

            }

        }).catch(err => {
            console.log(err);
            //todo informar al usuario del error
        });
    });

    console.log(`hello!`);
}
