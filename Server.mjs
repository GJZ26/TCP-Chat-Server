console.clear()
import net from 'net'
import { networkInterfaces } from "os";


const server = net.createServer()

let host

const port = 3000
const users = {}
const userconf = {}

networkInterfaces()['Wi-Fi'].map((network)=>{
    if(network.family === 'IPv4') host = network.address
})

if(host == undefined) host = "127.0.0.1"

server.on('connection', (client) => {

    users[client.remoteAddress] = client
    // client.setTimeout(15000)
    client.write("Hola desde el server\n")
    console.log("Nuevo usuario conectado")

    client.on('data',(data)=>{

        for(const cli in users){
            if(cli == client.remoteAddress) continue

            users[cli].write(data)
        }

        console.log(`${client.remoteAddress} say: ${data.toString().trim()}`)
    })

    client.once('data',(data)=>{
        console.log("Sola una vez", data.toString().trim())
    })

    client.on('error', (err) => {
    })

    client.on('close', () => {
        console.log("Usuario ha finalizado sesión")
        delete users[client.remoteAddress]
    })

    client.on('timeout',()=>{
        console.log(`User ${client.remoteAddress} has been kicked due inactivity`)
        delete users[client.remoteAddress]
        client.destroy()
    })

})

server.on('close', () => {
    console.log(`\nServer TCP finalizado`)
    process.exit(1)
})

server.on('error', (err) => {
    console.error(`Error al levantar el servidor:\n ${err}`)
})

server.listen(port, host, () => {
    console.log(`Server a la escucha
      IP: ${server.address().address}
    PORT: ${server.address().port}\n`,
        "\nEscriba un mensaje a todos los usuarios o teclee -q para cerrar el servidor")
})

function list(){
    console.table(users)
}

server.on('listening',()=>{
    process.stdin.on('data',(data)=>{
        if(data.toString().trim() === "-l")
            list()
    })
})