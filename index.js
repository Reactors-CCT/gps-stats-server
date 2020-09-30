const express = require('express');
const app = express();
const serv = require('http').Server(app);
const io = require('socket.io')(serv,{});

//single route on index
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.use('public',express.static(__dirname + '/public'));

var SOCKET_LIST = {};
var stats = [];

io.on('connection',socket => {

   // socket.emit('newUser')
    SOCKET_LIST[socket.id] = socket;
    console.log('New socket: ' + socket.id  + '. Currently: ' + Object.keys(SOCKET_LIST).length + ' active');
    socket.emit('newStats',stats);

    socket.on('disconnect', function(){    
        delete SOCKET_LIST[socket.id];    
        console.log('Bye socket: ' + socket.id  + '. Currently: ' + Object.keys(SOCKET_LIST).length + ' active');                    
    });

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
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newStats',stats);
    }    
},10000);

const ip = '0.0.0.0' || '127.0.0.1';
const port = process.env.PORT || 3000;

serv.listen(port, ip, function(){
    console.log("Server Started on ip: " + ip + " and port " + port);
});


