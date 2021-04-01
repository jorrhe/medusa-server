import {OAuth2Client} from 'google-auth-library';

export default class ApiGoogle {

    constructor() {
        this.clienteAuth2 = new OAuth2Client(process.env.G_AUTH_ID)
    }

    async verificarToken(token){

        let ticket = await this.clienteAuth2.verifyIdToken({
            idToken: token,
            audience: process.env.G_AUTH_ID
        })

        return ticket.getPayload();

    }
}