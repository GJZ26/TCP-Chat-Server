console.clear()

import net from 'net'
import { stdin, stdout } from 'process'

const client = new net.Socket()

const port = 3000
const host = "192.168.1.68"
client.connect(port, host)

client.on('data', (data) => {
    let mensaje = data.toString().trim()
    if (mensaje.split(" ",2)[0].includes("Tu:")) {
        process.stdout.moveCursor(0, -1)
    }
    console.log(mensaje)
})

client.on('connect', () => {
    process.stdin.on('data', (data) => {
        client.write(data.toString().trim())
    })
})

client.on('error', (err) => {
    console.log("Ups, ha ocurrido un error con el servidor")
})

client.on('close', () => {
    console.log("Has abandonado la sesión")
    process.exit(0)
})