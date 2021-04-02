import {Server,Socket} from "socket.io";
import socketioJwt from 'socketio-jwt';

const EMITIR = {
    INICIO:"inicio",
    NUEVO_PRECIO:"precio",
    DIVISAS:"divisas",
    DESCONECTAR:"desconectar",
    COMPRAR:"comprar",
    VENDER:"vender"
};

const ON = {
    TRANSACCION:"transaccion"
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

                socket.usuario = resultado[0];

                funcionesSocket(socket,criptodivisas);

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
 * @param {Criptodivisas} criptodivisas
 */
function funcionesSocket(socket,criptodivisas){

    socket.emit(EMITIR.INICIO, {
        usuario:socket.usuario,
        divisas:criptodivisas.divisas
    });

    socket.on(ON.TRANSACCION,(transaccion,callback)=>{

        if(!criptodivisas.esTransaccionValida(transaccion)){
            callback(true,'Error con la transaccion');
            return;
        }

        let usuario = socket.usuario;

        let tipo = 'compra';

        if(transaccion.tipo === 'vender'){
            tipo = 'venta';
        }

        controladorUsuario.nuevaTransaccion(usuario,tipo,transaccion).then(resultado => {

            if(resultado===false){
                callback(true);
            }else{
                callback(false,resultado);
            }

        }).catch(err => {

            console.log(err);

            callback(false,'Ha ocurrido un error con la BD');

        });

    });

    console.log(`hello!`);
}