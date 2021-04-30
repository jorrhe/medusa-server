import DIVISAS from '../modelo/criptodivisas.js';
import ApiCoingecko from '../api/coingecko.js';

export default class Criptodivisas{

    constructor(){

        this.listeners = {
            cambioPrecio:()=>{},
            ultPrecios:()=>{}
        };

        this.divisas = DIVISAS;

        this.ids = Object.keys(DIVISAS);

        this.apiCoingecko = new ApiCoingecko();

        this.iniciado = false;

    }

    async init(){
        // Cargamos los precios de las últimas 24h de todas las divisas
        for(let i = 0; i < this.ids.length; i++){
            let id = this.ids[i];

            let preciosDia = await this.apiCoingecko.getUltimosPrecios(id,1);
            let preciosSemana = await this.apiCoingecko.getUltimosPrecios(id,7);
            let preciosMes = await this.apiCoingecko.getUltimosPrecios(id,30);

            if(preciosDia !== false && preciosSemana !== false && preciosMes !== false){

                this.divisas[id].precios = {
                    dia: preciosDia,
                    semana: preciosSemana,
                    mes: preciosMes
                };

                let ultimoPrecio = preciosDia[preciosDia.length-1]

                this.divisas[id].precio = {
                    fecha: 0,
                    valor: ultimoPrecio[1]
                }

            }
            //todo hacer algo cuando es false

        }

        this.listeners.ultPrecios(this.divisas);

        await this.precioActual();

        console.log("Carga inicial API completada");

        this.iniciado = true;
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

            let preciosDia = divisa.precios.dia;
            let preciosSemana = divisa.precios.semana;
            let preciosMes = divisa.precios.mes;

            let ultFechaDia = preciosDia[preciosDia.length-1][0];
            let ultFechaSemana = preciosSemana[preciosSemana.length-1][0];
            let ultFechaMes = preciosMes[preciosMes.length-1][0];

            // Eliminamos el primer valor del array si hay una diferencia de más de ~4 minutos
            // Esto lo hacemos para que en el array que tiene el servidor con los último precios,
            // solo estén las últimas 24h
            if(fechaNueva-ultFechaDia > 250000){
                preciosDia.splice(0,1);
                preciosDia.push([fechaNueva,precioNuevo.eur]);
            }

            if(fechaNueva-ultFechaSemana > 3570000){
                preciosSemana.splice(0,1);
                preciosSemana.push([fechaNueva,precioNuevo.eur]);
            }


            if(fechaNueva-ultFechaMes > 3583600){
                preciosMes.splice(0,1);
                preciosMes.push([fechaNueva,precioNuevo.eur]);
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

        let preciosDia = divisa.precios.dia;

        let penultimoPrecio = preciosDia[preciosDia.length-2].valor;

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

    getPrecioValor(idDivisa){
        if(idDivisa==='fiat'){
            return 1;
        }

        return this.divisas[idDivisa].precio.valor;
    }

}
