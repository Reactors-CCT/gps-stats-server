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
var userLocations = [];

io.on('connection',socket => {
    SOCKET_LIST[socket.id] = socket;
    console.log('New socket: ' + socket.id  + '. Currently: ' + Object.keys(SOCKET_LIST).length + ' active');
    socket.emit('newUser',socket.id);
    socket.emit('newStats',stats);

    socket.on('disconnect', function(){  
        
        let socketLocation = "";

        for(var i=0; i< userLocations.length; i++){                
            if(userLocations[i].userSocket == socket.id){                     
                socketLocation = userLocations[i].location;           
                break;
            }
        } 

        if(socketLocation!=""){
            for(var i=0; i< stats.length; i++){                
                if(stats[i].location == socketLocation){                     
                    stats[i].counter = stats[i].counter-1;           
                    break;
                }
            } 
        }       
        
        delete SOCKET_LIST[socket.id];    
        console.log('Bye socket: ' + socket.id  + '. Currently: ' + Object.keys(SOCKET_LIST).length + ' active'); 
        socket.emit('newStats',stats);                   
    });
   
    socket.on('sendData',({user,loc})=>{   
        var existingUser = false;
        for(var i=0; i<userLocations.length; i++){
            if(userLocations[i].userSocket == user){
                existingUser = true;
                break;
            }
        }
        if(!existingUser){
            userLocations.push({'userSocket': user, 'location': loc});
        }   

        let found = false;
        if(!existingUser){
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
        }
    });

    socket.on('refresh',()=>{
        socket.emit('newStats', stats); 
    });
});

const ip = '0.0.0.0' || '127.0.0.1';
const port = process.env.PORT || 3000; 

serv.listen(port, ip, function(){
    console.log("Server Started on ip: " + ip + " and port " + port);
});


