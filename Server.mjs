import net from 'net'

const server = net.createServer()

// Creamos un array para almacenar a todos los usuarios que se vayan conectando
const users = []

// Esta configuració  deberá ser la misma a la que se conectará el cliente
const port = 3000

/*
    En este caso el host hace referencia al localhost, en caso de que necesites que 
    tu servidor sea accesible para cualquier dispositivo en la red, usa tu IP privada.
    Puedes consultarla por terminal con ipconfig, asegúrate de usar la interfaz
    de red correcta (WiFi, Ethernet, VM Adapter, etc.)
*/
const host = "127.0.0.1"

// Agregamos un listener al servidor para cuando haya una conexión nueva
server.on('connection', (client) => {

    /*
        Esta función se ejecuta cada que servidor capta una nueva conexión.
        Pasa un sólo parámetro del tipo net.Socket que hace referencia al usuario
        que se conectó. El nombre queda a tu consideración, en este caso le puse "client"
     */

    users.push(client) // <- Agregamos al nuevo usuario a la lista
    console.log(`${client.remoteAddress} conectado`) // client.remoteAddress = IP del cliente

    /*
        Client, al igual que el servidor, posee listener de eventos, los cuales podemos usar para 
        hacer ciertas acciones según el evento escuchado
     */
    client.on('data', (data) => {
        /*
            Este evento se dispara cuando recibe un flujo de información del cliente.
            Su callback, pasa un parámetro de tipo buffer que contiene la información que el cliente envió
         */

        const remitente = client.remoteAddress
        const mensaje = data.toString().trim() // Al ser de tipo Buffer, se tiene que convertir a string
        // al enviar, se envía con una tabulación al final, cosa que elimina el método trim()

        users.map((un_usuario) => { // Recorremos la lista de usuarios activos y le enviamos el mensaje con la ip del remitente
            un_usuario.write(remitente + ":" + mensaje)
        })

        console.log(remitente + ":" + mensaje) // Imprimimos el mensaje en la consola del servidor

    })

    client.on('close', () => {
        /*
            Este evento se activa cuando el servidor pierde comunicación con el cliente.
         */
        users.map((un_usuario) => { // Le enviamos un mensaje a la lista de clientes diciendo que el usuario ha salido
            un_usuario.write(client.remoteAddress + " ha salido del servidor")
        })
    })

    client.on('error', (err) => {
        /*
            Este evento se ejecuta cuando hay un error en la interacción cliente-servidor.
            Su callback pasa un parámetro, la información del error ocurrido
            En caso de no manejarse este evento, el programa 'crashea'
        */
        if (err.errno == -4077) {
            // El parámetro recibido posee un atributo errno, que es el número de error
            // El error -4077 ocurre cuando el cliente termina la conexión con el servidor de manera brusca
            // (lo que pasa cuando cancelamos la ejecución con ctrl+c en la terminal)
            // por esto, solo avisamos a los usuarios que el cliente ha salido del servidor
            users.map((un_usuario) => {
                un_usuario.write(client.remoteAddress + " ha salido del servidor")
            })

            console.log(client.remoteAddress + " ha salido del servidor")
        } else {
            console.error(err)
        }
    })

})

/*
    Agregamos un listener al server para los errores, estos pueden ocurrir porque el puerto
    que se usará para el proyecto está ocupado, ingresaste un ip errónea, etc.
    
    Con este listener evitamos que el programa crashee
 */
server.on('error', (err) => {
    console.log(err)
})

/*
    Ponemos a la escucha el servidor y listo! :)
*/
server.listen(port, host, () => {
    console.log("Servidor a la escucha")
})