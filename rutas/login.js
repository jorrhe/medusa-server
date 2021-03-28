const express = require('express');
const router = express.Router();
const cors = require('cors');

// Generación de tokens
const jwt = require('jsonwebtoken');

// Controladores
const controladorGoogle = require('../controlador/api-google.js');
const controladorUsuario = require('../controlador/usuario');


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

    if(tokenGoogle){

        let payload;
        let existe;

        try{
            payload = await controladorGoogle.verificarToken(tokenGoogle)

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

    }else{
        console.log(req.body);
        res.send({
            error:true,
            mensaje:"Error con la petición"
        });
    }

})

router.post('/registro',async (req,res)=> {

    let body = req.body;

    if(body.nombre && body.token){

        let token = jwt.decode(body.token);

        if(token && token.registrado === false){
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
        }else{
            res.send({
                error:true,
                mensaje:"Error con el token"
            });
        }

        console.log(token);

    }

    console.log(req.body);

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

module.exports = router;