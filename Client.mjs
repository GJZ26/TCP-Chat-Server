/*
    El client no es tan importante, de hecho puedes conectarte
    al servidor mediante telnet.
*/

import net from 'net'

/* Asegúrate que sean las mismas que el servidor */
const port = 3000
const host = "127.0.0.1"

const client = new net.Socket() // Añadimos un nuevo socket, el que se conectará al servidor

// Hacemos conexión al servidor
client.connect(port, host)

client.on('data', (data) => { // Al igual que el servidor, este se ejecuta cuando recibe información
    /* 
        En el lado del cliente solo hace falta convertir el mensaje
        de Buffer a String con el método toString() y eliminar el enter con trim()
     */
    console.log(data.toString().trim())
})

client.on('connect', () => {
    /*
        Este evento se ejecuta cuando se estableción una conexión exitosa con el servidor
    */

    /*
        Ahora...
        NodeJS incluye de forma nativa métodos para leer lo que el usuario escribe por terminal
        este se encuentre en process.stdin

        process.stdin, al igual que net, posee un método on() que sirve para escuchar eventos.

        Uno de los eventos es el 'data', que ocurre cuando el usuario presiona la tecla enter
        dentro de la terminal, esta información es pasada a su callback como parámetro
        (que en este caso le pusimos el nombre de data), y al igual que el evento 'data' que
        hemos visto anteriormente, este parámetro es de tipo Buffer, por lo que tiene que ser convertido
        a string y eliminar los espacios.

        Al estar dentro del evento 'connect', stdin SIEMPRE estará a la escucha de lo que el
        usuario escriba en la terminal.
    */
    process.stdin.on('data', (data) => {
        client.write(data.toString().trim())
    })

})

client.on('error', (err) => {
    /*
        Se acuerdan lo que pasaba con el servidor cuando el cliente presionaba CTRL + C y
        cerraba de forma brusca el proceso? 

        Lo mismo pasa con el cliente cuando el servidor hace lo mismo, por ende, manejamos 
        este mismo error
    */
    if (err.errno == -4077) {
        console.log("Se ha perdido comunicación con el servidor")
    } else {
        console.error(err)
    }

    /*
        También recuerdan que stdin SIEMPRE quedaba a la escucha?
        
        Pues, con el evento client.on('error') evitamos que el programa colapse, pero quedará
        en un bucle infinito...

        Así que con process.exit(1) haremos que el programa finalice.

        ¿Por que 0?
        Por que es un codigo de salida
        0: Ha finalizado sin ningún problema
        1: Algo ha hecho que el programa se cierre (algún error)
    */
    process.exit(0)
})

/*
    Ya con eso debería de funcionar:)
*/