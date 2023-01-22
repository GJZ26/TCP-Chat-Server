import { networkInterfaces } from "os";

let host

networkInterfaces()['Wi-Fi'].map((network)=>{
    if(network.family === 'IPv4') host = network.address
    if(host == undefined) host = "127.0.0.1"
})

console.log(host)