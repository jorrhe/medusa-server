const CoinGecko = require('coingecko-api');

const coinGeckoClient = new CoinGecko();

const moment = require('moment');

const DIVISAS = require('../modelo/divisas');

module.exports.DIVISAS = DIVISAS;

module.exports = {

    async init(funcionesSocket){

        funcionesSocket.setDivisas(DIVISAS);

        let ids = Object.keys(DIVISAS);

        for(let i = 0; i < ids.length; i++){
            let id = ids[i];
            let precios = await this.getUltimas24H(id);

            if(precios !== false){
                let emitirAviso = (i+1)===ids.length;
                funcionesSocket.setPrecios(id,precios,emitirAviso);
            }
            //todo hacer algo cuando es false

        }

        console.log("Carga inicial API completada");

        let precioActual = ()=>{

            this.getAhora(ids).then((precios)=>{

                if(precios!==false){
                    funcionesSocket.actualizarPrecios(precios);
                }
                //todo hacer algo para cuando ha ocurrido un error
            }).catch(err => {
                console.log("ERROR API COINGECKO catch");
                console.log(err);
            });

        };

        precioActual();

        setInterval(precioActual,30000);

    },

    async getUltimas24H(id){

        let respuesta = await coinGeckoClient.coins.fetchMarketChartRange(id, {
            from: moment().subtract(1,"days",).unix(),
            to: moment().unix(),
            vs_currency: 'eur'
        });

        if(respuesta.success && respuesta.code === 200){
            return respuesta.data.prices;
        }

        console.log("ERROR API COINGECKO getUltimas24H");
        console.log(respuesta);

        return false;

    },

    async getAhora(idsDivisas){

        let respuesta = await coinGeckoClient.simple.price({
            ids:idsDivisas,
            vs_currencies:'eur',
            include_last_updated_at:true,
            include_24hr_change: true
        });

        if(respuesta.success && respuesta.code === 200){
            return respuesta.data;
        }

        console.log("ERROR API COINGECKO getAhora");
        console.log(respuesta);

        return false;

    }

}