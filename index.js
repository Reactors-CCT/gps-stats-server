const express = require('express');
const app = express();
const serv = require('http').Server(app);
const io = require('socket.io')(serv,{});

//single route on index
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.use('public',express.static(__dirname + '/public'));

var SOCKET_LIST = [];
var stats = [];

io.on('connection',socket => {

    SOCKET_LIST.push(socket);
    console.log('New access to site. Currently: ' + SOCKET_LIST.length + " active")
    socket.emit('newStats',stats);

    socket.on('sendData',({loc})=>{   
        let found = false;
        if(stats.length>0){
            for(var i=0; i< stats.length; i++){                
                if(stats[i].location == loc){
                    stats[i].counter = stats[i].counter+1;
                    found = true;
                    break;
                } else { 
                    found = false;
                }
            }
            if(!found){
                stats.push({location: loc, counter: 1});
            }
        } else {
            stats.push({location: loc, counter: 1});
        }
        socket.emit('newStats',stats);
    });
});

setInterval(()=>{
    for(var i=0; i<SOCKET_LIST.length; i++){
        SOCKET_LIST[i].emit('newUser',stats);
    }
});

const ip = '0.0.0.0' || '127.0.0.1';
const port = process.env.PORT || 3000;

serv.listen(port, ip, function(){
    console.log("Server Started on ip: " + ip + " and port " + port);
});


