import {Router} from 'express';
import cors from 'cors';

// Generación de tokens
import jwt from 'jsonwebtoken';

// Controladores
import ApiGoogle from '../api/google.js';
import controladorUsuario from '../controlador/usuario.js';

let router = new Router(),
    apiGoogle = new ApiGoogle();

router.use(cors({
    origin:process.env.MEDUSA_APP_URL,optionsSuccessStatus: 200
}))


router.post('/google',async (req,res)=>{

    //todo verificar que el body contiene todo y es válido
    let tokenGoogle = false;

    if(req.body.google && req.body.google.uc){
        tokenGoogle = req.body.google.uc.id_token;
    }else if(req.body.google && req.body.google.tc){
        tokenGoogle = req.body.google.tc.id_token;
    }

    if(!tokenGoogle){
        console.log(req.body);
        res.send({
            error:true,
            mensaje:"Error con la petición"
        });
        return;
    }

    let payload;
    let existe;

    try{
        payload = await apiGoogle.verificarToken(tokenGoogle)

        existe = await controladorUsuario.existeUsuarioDeGoogle(payload.sub);
    }catch (err){
        console.log(err);
        res.send({
            error:true,
            mensaje:"Error con la autenticación"
        });
        return;
    }

    let token = firmarToken({
        email: payload.email,
        id:payload.sub,
        registrado:existe
    });

    res.send({
        error:false,
        token: token,
        registrado:existe
    });



})

router.post('/registro',async (req,res)=> {

    let body = req.body;

    console.log(body);

    if(!body.nombre || !body.token){
        return;
    }

    let token = jwt.decode(body.token);
    console.log(token)
    if(!token || token.registrado){
        res.send({
            error:true,
            mensaje:"Error con el token"
        });
        return
    }

    console.log("Login")

    let existe = await controladorUsuario.existeNombre(body.nombre);

    let existeGoogle = await controladorUsuario.existeUsuarioDeGoogle(token.id);

    if(!existe && !existeGoogle){

        try{
            await controladorUsuario.nuevo({
                id_google: token.id,
                nombre:body.nombre,
                email:token.email
            });

            res.send({
                error:false,
                token: firmarToken({
                    id:token.id,
                    email:token.email,
                    nombre:body.nombre
                })
            })

        }catch (err){
            console.log(err);
            res.send({
                error:true,
                mensaje:"Ha ocurrido un error con la BDD"
            });
        }

    }else{
        res.send({
            error:true,
            mensaje:"El nombre de usuario ya existe"
        });
    }

});

function firmarToken(datos){
    return jwt.sign(datos,
        process.env.APP_SECRET,
        {
            algorithm:"HS512",
            expiresIn: "365d"
        }
    );
}

export default router;