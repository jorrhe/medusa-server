import App from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import mongoose from 'mongoose';

// Controladores
import Criptodivisas from './controlador/criptodivisas.js';

// Funcionamiento de la comunicación por socket
import Socket from './controlador/socket.js';

// Rutas
import Login from './rutas/login.js';

// DB
mongoose.connect(process.env.MONGO_DB_URL, {useNewUrlParser: true,useUnifiedTopology:true});

// Express
const app = App();

app.use(helmet());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use('/login',Login);

const PORT = process.env.PORT || process.env.MEDUSA_SERVER_PORT

const server = app.listen(PORT,()=>{
    console.log("Escuchando en: "+PORT)
});

// Cargamos el controlador y el socket
let controladorCripto = new Criptodivisas();

Socket(server,controladorCripto);

controladorCripto.init().catch(err => {
    console.log(err);
});

setInterval(()=>{
    controladorCripto.precioActual().catch(err => {
        console.log(err);
    });
},30000);