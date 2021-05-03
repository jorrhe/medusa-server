import CoinGecko from 'coingecko-api';
import moment from 'moment';

export default class ApiCoingecko{

    constructor() {
        CoinGecko.TIMEOUT = 10000;
        this.coinGeckoClient = new CoinGecko();
    }

    async getUltimosPrecios(id,numero = 1){
        while (true) {
            try {

                let respuesta = await this.coinGeckoClient.coins.fetchMarketChartRange(id, {
                    from: moment().subtract(numero, "days",).unix(),
                    to: moment().unix(),
                    vs_currency: 'eur'
                });

                if (respuesta.success && respuesta.code === 200) {
                    return respuesta.data.prices;
                }

                console.log(respuesta);


            }catch (e){
                console.log("ERROR CON LA API, REINTENTANDO")
                console.log(e);
            }

        }

    }

    async getAhora(idsDivisas){

        for(let i = 0; i < 2; i++){
            try {

                let respuesta = await this.coinGeckoClient.simple.price({
                    ids: idsDivisas,
                    vs_currencies: 'eur',
                    include_last_updated_at: true,
                    include_24hr_change: true
                });

                if (respuesta.success && respuesta.code === 200) {
                    return respuesta.data;
                }

                console.log(respuesta);
            }catch (e){
                console.log("Reintentando getAhora");
            }

        }
        throw new Error("ERROR API COINGECKO getAhora");

    }

}