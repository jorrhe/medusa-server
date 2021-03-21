// Para el uso de la api de google
const {OAuth2Client} = require('google-auth-library');
let clienteAuth2 = new OAuth2Client(process.env.G_AUTH_ID);

module.exports = {
    async verificarToken(token){

        let ticket = await clienteAuth2.verifyIdToken({
            idToken: token,
            audience: process.env.G_AUTH_ID
        })

        return ticket.getPayload();

    }
}