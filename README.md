<p align="center">
  <img src="https://github.com/beybo/medusa/raw/master/src/assets/img/LogoMedusa.svg" width="300"/>
</p>

<h1 align="center">Medusa Server</h1>

Servidor usado para la app de [medusa](https://github.com/beybo/medusa).

Es necesario que definas las siguientes variables de entorno:

|Nombre|Valor|
|------|-----|
|MONGO_DB_URL|Url para la conexión con MongoDB|
|G_AUTH_ID|ID de autorización de la APP de Google|
|APP_SECRET|Secreto que se va a usar para los token JWT|
|MEDUSA_APP_URL|Url donde se encuentra alojado el front|
|MEDUSA_SERVER_PORT|Puerto con el que se va a lanzar el servidor|
