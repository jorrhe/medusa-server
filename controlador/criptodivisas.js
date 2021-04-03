import DIVISAS from '../modelo/criptodivisas.js';
import ApiCoingecko from '../api/coingecko.js';

export default class Criptodivisas{

    constructor(){

        this.listeners = {
            cambioPrecio:()=>{},
            ult24h:()=>{}
        };

        this.divisas = DIVISAS;

        this.ids = Object.keys(DIVISAS);

        this.apiCoingecko = new ApiCoingecko();

    }

    async init(){
        // Cargamos los precios de las últimas 24h de todas las divisas
        for(let i = 0; i < this.ids.length; i++){
            let id = this.ids[i];
            let precios = await this.apiCoingecko.getUltimas24H(id);

            if(precios !== false){

                this.divisas[id].precios = precios;

                let ultimoPrecio = precios[precios.length-1]

                this.divisas[id].precio = {
                    fecha: 0,
                    valor: ultimoPrecio[1]
                }

            }
            //todo hacer algo cuando es false

        }

        this.listeners.ult24h(this.divisas);

        await this.precioActual();

        console.log("Carga inicial API completada");

    }

    /**
     *
     * @param {('cambioPrecio'|'ult24h')} nombre
     * @param callback
     */
    on(nombre,callback){
        this.listeners[nombre] = callback;
    }

    async precioActual(){

        let precios = await this.apiCoingecko.getAhora(Object.keys(DIVISAS));

        if(precios ===false ){
            console.log("Error con precio actual");
            return;
        }

        Object.keys(precios).forEach(id => {

            let precioNuevo = precios[id];
            let fechaNueva = precioNuevo.last_updated_at * 1000;

            let divisa = this.divisas[id];

            if(divisa.precio.fecha >= fechaNueva)
                return;

            divisa.precio = {
                fecha: fechaNueva,
                valor: precioNuevo.eur,
                cambio: precioNuevo.eur_24h_change * 0.01
            }

            this.listeners.cambioPrecio(id,divisa.precio);

            let ultFecha = divisa.precios[divisa.precios.length-1][0];

            // Eliminamos el primer valor del array si hay una diferencia de más de ~4 minutos
            // Esto lo hacemos para que en el array que tiene el servidor con los último precios,
            // solo estén las últimas 24h
            if(fechaNueva-ultFecha > 250000){
                divisa.precios.splice(0,1).push([fechaNueva,precioNuevo.eur]);
            }

        });

    }

    esTransaccionValida(transaccion){

        if(!transaccion || !transaccion.cantidad || !transaccion.divisa || !transaccion.cantidad){
            console.log("Error con los valores de la transaccion");
            console.log(transaccion);
            return false;
        }

        let divisa = this.getDivisa(transaccion.divisa);

        if(!divisa){
            console.log("La divisa no existe");
            console.log(transaccion);
            return false;
        }

        let penultimoPrecio = divisa.precios[divisa.precios.length-2].valor;

        if(divisa.precio.valor !== transaccion.precio && penultimoPrecio !== transaccion.precio){
            console.log("Error con el precio de la transaccion");
            console.log(divisa.precio,penultimoPrecio);
            console.log(transaccion);
            return false;
        }

        return true;

    }

    getDivisa(idDivisa){
        return this.divisas[idDivisa];
    }

}
