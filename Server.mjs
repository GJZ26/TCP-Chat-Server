import net from 'net'
import { networkInterfaces } from 'os'

// Configuración del servidor
const server = net.createServer()
const port = 3000
let host

// Asignación de la IP del servidor
if (networkInterfaces()['Wi-Fi']) {
    networkInterfaces()['Wi-Fi'].map((network) => {
        if (network.family === 'IPv4') host = network.address
    })
}

if (host == undefined) {
    host = "127.0.0.1" // En caso de no estar conectado, asigna localhost
}

// Lista de usuarios
const users = {}
const user_preferences = {}
let banned_users = []
let freecolorindex = 1;

console.clear()

/**##   SERVER LISTENERS   ##**/
server.on('connection', (client) => {
    if (firewall(client)) return

    users[client.remoteAddress] = client
    client.setTimeout(60 * 1000)

    // Asignamos la IP como nickname en caso de ser nuevo usuario
    if (user_preferences[client.remoteAddress] === undefined) {
        user_preferences[client.remoteAddress] = { nickname: client.remoteAddress, color: `\x1b[3${freecolorindex}m` }
        freecolorindex++
        if (freecolorindex == 3) freecolorindex = 4
        if (freecolorindex > 7) {
            freecolorindex = 0
        }
    }

    // Informamos la llegada de un nuevo usuario
    sayToEveryone(`${printName(client)} ${serverSay("ha ingresado al servidor")}`,
        `${client.remoteAddress} [${printName(client)}] ha ingresado al servidor`,
        client.remoteAddress)

    client.write("\n\x1b[33mBienvenido a TCP Chat Server\n\nPara cambiar tu nickname escribe:\n -n: [NICKNAME]\nPara ver los comandos disponibles escribe -h\n\x1b[0m")

    client.on('data', (data) => {
        if (userCommands(data, client)) return
        if (data.toString().trim() == "") return

        sayToEveryone(`${printName(client)}: ${data.toString().trim()}`,
            `${client.remoteAddress} [${printName(client)}]: ${data.toString().trim()}`,
            client.remoteAddress)

        client.write(`${printName(client,"Tu:")} ${data.toString().trim()}`)

    })

    client.on('error', (err) => {
        if (err.errno == -4077) {
            delete users[client.remoteAddress]
            client.destroy()
            return
        }
        console.error(err)
    })

    client.on('close', () => {
        if (user_preferences[client.remoteAddress] != undefined)
            sayToEveryone(`${printName(client)} ${serverSay("salió del servidor")}`)

    })

    client.on('timeout', () => {
        sayToEveryone(`${serverSay("El usuario")} ${printName(client)} ${serverSay("ha sido eliminado por inactividad")}`,
            `${serverSay("El usuario")} ${client.remoteAddress} [${printName(client)}] ${serverSay("ha sido eliminado por inactividad")}`)

        kick(client.remoteAddress, true)

    })

})

/*   UTILITY FUNCTIONS   */
function sayToEveryone(messageclient, messageserver = messageclient, except) {
    for (const key in users) {
        if (users[key].remoteAddress === except) continue
        users[key].write("\x1b[0m" + messageclient + "\n")
    }
    console.log("\x1b[0m" + messageserver.trim())
}

function userCommands(message, client) {

    const commands = ["-q", "-n:", "-h"]
    const firstWords = message.toString().trim().split(" ", 2)

    return firstWords.some((phrase, index, line) => {

        if (commands.includes(phrase) && index == 1) return false

        if (phrase == "-q" && index == 0) {
            delete users[client.remoteAddress]
            client.destroy()
        }

        if (phrase == "-n:" && index == 0 && line.length == 2) {

            for (const key in user_preferences) {
                if (user_preferences[key].nickname == line[1]) {
                    client.write(serverSay("Este nickname ya ha sido tomado por otro usuario"))
                    return true
                }
            }

            sayToEveryone(`${printName(client)} ${serverSay("ha cambiado su apodo a")} ${printName(client, line[1])}`,
                `${client.remoteAddress} [${printName(client)}] ha cambiado su apodo a ${printName(client, line[1])}`)

            user_preferences[client.remoteAddress].nickname = line[1]
        }

        if (phrase == "-h" && index == 0) {
            client.write(
                `\nLista de comandos
    -q : Salir del servidor
    -n: [NICKNAME] : Cambia tu apodo actual
    -h: Muestra este mensaje de ayuda\n\n`
            )
        }

        return commands.includes(phrase)
    })

}

/* ## FUNCIONES DE ESTILIZADO ## */
function printName(client, message) {
    if (message == undefined) message = user_preferences[client.remoteAddress].nickname
    return `${user_preferences[client.remoteAddress].color}\x1b[1m${message}\x1b[0m`
}

function serverSay(message) {
    return `\x1b[33m\x1b[1m${message}\x1b[0m`
}

function kick(ip, silentMode = true) {

    if (ip == undefined) {
        console.log("No se ha proporcionado una IP para kickear")
        return false
    }

    if (user_preferences[ip] === undefined) {
        console.log(`No hay ningún usuario con la ip [${ip}]`)
        return false
    }

    if (!silentMode)
        sayToEveryone(`${serverSay("El usuario")} ${printName(users[ip])} ${serverSay("ha sido removido por el servidor")}`)

    users[ip].destroy()

    delete users[ip]
    return true
}

function kickAll() {

    if (Object.keys(users).length > 0) {
        for (const key in users) {
            kick(key)
            console.log(`${key} ha sido kickeado`)
        }
        return
    }

    console.log("Todos los usuarios han sido eliminados")
}

function quit() {
    kickAll()
    server.close()
    console.log("Servidor finalizado")
    process.exit(0)
}

function ban(ip) {
    if (kick(ip)) {
        delete user_preferences[ip]
        banned_users.push(ip)
        sayToEveryone(`\x1b[31m\x1b[1m${ip} ha sido baneado del servidor\x1b[0m`)
    }

}

function unban(ip) {
    if (ip === undefined) {
        console.log("Asigne un IP para remover de la lista negra")
        return;
    }
    if (!banned_users.includes(ip)) {
        console.log(`No hay ningún usuario con IP [${ip}] en la lista negra del servidor`)
        return
    }

    banned_users = banned_users.filter((banned) => {
        if (banned === ip) {
            console.log(`El usuario con IP [${ip}] ha sido perdonado`)
            return
        }
        return banned
    })

}

function listBanned() {
    console.table(banned_users)
}

function firewall(user) {
    if (banned_users.includes(user.remoteAddress)) {
        user.write(`\x1b[31m\x1b[1mHas sido baneado de este servidor\x1b[0m`)
        user.destroy()
        return true
    }
    return false
}

/* ## SERVER LAUNCH ## */

server.on('listening', () => {
    process.stdin.on('data', (raw) => {
        let data = raw.toString().trim().split(" ")
        switch (data[0]) {
            case "-l":
                console.table(user_preferences)
                break;
            case "-ka":
                kickAll()
                break;
            case "-q": quit()
                break;
            case "-k": kick(data[1], false)
                break;
            case "-b": ban(data[1])
                break;
            case "-ub": unban(data[1])
                break
            case "-lb": listBanned()
                break;
            case "-h":
                console.log("Lista de comandos",
                    "\n\t-l: Lista a los usuarios registrados",
                    "\n\t-lb: Lista a los usuarios baneados",
                    "\n\t-ka: Remueve a todos los usuarios del servidor",
                    "\n\t-k: [IP] Remueve al usuario de la IP dada",
                    "\n\t-b: [IP] Remueve y restrínge el acceso al servidor al usuario de la IP dada",
                    "\n\t-ub: [IP] Remueve de la lista negra del servidor al usuario de la IP dada",
                    "\n\t-q: Remueve a todos los usuarios conectados y apaga el servidor",
                    "\n\t-h: Muestra este mensaje de error\n",
                )
                break;
            default: console.log("Comando no encontrado")
                break;
        }
    })
})

server.listen(port, host, () => {
    console.info(`
[SERVIDOR TCP/IP A LA ESCUCHA]
    IP: ${server.address().address}
  PORT: ${server.address().port}

Presione -h para ver la lista de comandos
`)
})