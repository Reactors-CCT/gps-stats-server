/*
** Reactors CCT
** Node Server with Sockets
*/

//creating server and importing socket.io
const express = require('express');
const app = express();
const serv = require('http').Server(app);
const io = require('socket.io')(serv,{});

//single route on index (added in case we want to display something in the server's index)
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.use('public',express.static(__dirname + '/public'));

// creating vars that will store 1) the list of sockets, 2) the statistics, 3) the users' locations
var SOCKET_LIST = {};
var stats = [];
var userLocations = [];

//creating the socket 
io.on('connection',socket => {
    //adds to the array the new socket
    SOCKET_LIST[socket.id] = socket;
    //prints current socket and total of sockets at the moment
    console.log('New socket: ' + socket.id  + '. Currently: ' + Object.keys(SOCKET_LIST).length + ' active');
    //emitting event newUser that sends the socket's id which will be the user's id 
    //note: a socket is created for each connection to the server
    socket.emit('newUser',socket.id);
    //emittin event to refresh the statistics
    socket.emit('newStats',stats);

    //in case a socket disconnects the server does the following...
    socket.on('disconnect', function(){  
        
        let socketLocation = "";
        //searchs the location of the socket who wants to disconnect
        for(var i=0; i< userLocations.length; i++){                
            if(userLocations[i].userSocket == socket.id){                     
                socketLocation = userLocations[i].location;           
                break;
            }
        } 

        //if the location is found, the location will be removed from the statistics
        if(socketLocation!=""){
            for(var i=0; i< stats.length; i++){                
                if(stats[i].location == socketLocation){                     
                    stats[i].counter = stats[i].counter-1;           
                    break;
                }
            } 
        }
        
        //prints socket that is disconnecting and total of sockets at the moment    
        console.log('Bye socket: ' + socket.id  + '. Currently: ' + Object.keys(SOCKET_LIST).length + ' active'); 
        //deletes the socket from the array
        delete SOCKET_LIST[socket.id];
        //emittin event to refresh the statistics
        socket.emit('newStats',stats);                   
    });
   
    //in case a socket sends new data the server does the following...
    socket.on('sendData',({user,loc})=>{   
        var existingUser = false;
        //searchs if the location and the user already exist
        for(var i=0; i<userLocations.length; i++){
            if(userLocations[i].userSocket == user){
                existingUser = true;
                break;
            }
        }

        //in case they don't exist it will add the location and socket
        if(!existingUser){
            userLocations.push({'userSocket': user, 'location': loc});
        }   

        //in case is a new socket it will add the location to the statistics
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
            //emittin event to refresh the statistics
            socket.emit('newStats',stats);
        }
    });

    //in case the socket wants to refresh the statistics the server does the following...
    socket.on('refresh',()=>{
        socket.emit('newStats', stats); 
    });
});

//ip and port configurations
const ip = '0.0.0.0' || '127.0.0.1';
const port = process.env.PORT || 3000; 

//server listens to the ip and port specified above
serv.listen(port, ip, function(){
    console.log("Server Started on ip: " + ip + " and port " + port);
});


