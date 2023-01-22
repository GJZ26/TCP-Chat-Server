console.clear()

import net from 'net'

const client = new net.Socket()

const port = 3000
const host = "192.168.1.68"
client.connect(port,host)

client.on('data',(data)=>{
    console.log(data.toString().trim())
})