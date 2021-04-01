import CoinGecko from 'coingecko-api';
import moment from 'moment';

export default class ApiCoingecko{

    constructor() {
        this.coinGeckoClient = new CoinGecko();
    }

    async getUltimas24H(id){

        let respuesta = await this.coinGeckoClient.coins.fetchMarketChartRange(id, {
            from: moment().subtract(1,"days",).unix(),
            to: moment().unix(),
            vs_currency: 'eur'
        });

        if(respuesta.success && respuesta.code === 200){
            return respuesta.data.prices;
        }

        console.log(respuesta);

        throw new Error("ERROR API COINGECKO getUltimas24H")

    }

    async getAhora(idsDivisas){

        let respuesta = await this.coinGeckoClient.simple.price({
            ids:idsDivisas,
            vs_currencies:'eur',
            include_last_updated_at:true,
            include_24hr_change: true
        });

        if(respuesta.success && respuesta.code === 200){
            return respuesta.data;
        }

        console.log(respuesta);

        throw new Error("ERROR API COINGECKO getAhora");

    }

}