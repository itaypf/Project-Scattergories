const { rejects } = require('assert');
var express=require('express');
var fs=require('fs');
var app=express();
var server=require('http').Server(app);
var mysql=require('mysql');
const { userInfo } = require('os');
const { resolve } = require('path');
var SqlString = require('sqlstring');
var io=require('socket.io')(server,{})
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "categories"
});
con.connect(function(err){
    if (err) throw error;
    console.log("connection established");
});
app.get('/',function(req,res){
    res.sendFile(__dirname+'/client/index.html');
});
app.use('/client',express.static(__dirname+'/client'));
server.listen(8080);
console.log("server started");
var id="";
var place=0;
var rooms={};
var socket_list={};
io.sockets.on('connection',function(socket){
    
    socket.id=Math.random();
    socket.categories=[];
    socket.input=[];
    socket_list[socket.id]=socket;
    socket.on("createRoom",function(data){
        var room={};
        room.players={};
        room.sockets=[];
        room.id=data.input;
        room.categories=data.categories
        socket.nickname=data.name
        room.players[socket.nickname]="0";
        room.sockets.push(socket);
        rooms[place]=room;
        place++;
        socket.join(room.id);
        var clientsList = io.sockets.adapter.rooms;
        console.log(clientsList);
        socket.emit("created",{
            num:0
        });
    });
    socket.on("joinRoom",function(data){
        id=data.input;
        socket.nickname=data.name;
        for (i=0;i<place;i++){
            if(id===rooms[i].id){
                socket.join(id);
                rooms[i].players[socket.nickname]="0";
                rooms[i].sockets.push(socket);
                console.log(rooms[i].sockets);
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].id!=socket.id){
                        rooms[i].sockets[j].emit("playerJoined",{
                            players:rooms[i].players,
                            name:socket.nickname
                        });
                    }
                }
                var clientsList = io.sockets.adapter.rooms;
                console.log(clientsList);
                return socket.emit("success",{
                    categories:rooms[i].categories,
                    players:rooms[i].players,
                    num:1
                });
            }
        }  
    });
    console.log(rooms);
    console.log('socket connection');
    socket.on("begin",function(data){
        for(i=0;i<place;i++)
        {
            if(rooms[i].id===data.room)
            {
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].nickname!==socket.nickname)
                        rooms[i].sockets[j].emit("begin",{
                            num:data.num
                        });
                }
            }
        }
    });
    socket.on("roll",function(data){
        for(i=0;i<place;i++)
        {
            if(rooms[i].id===data.room)
            {
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].nickname!==socket.nickname)
                        rooms[i].sockets[j].emit("roll",{
                            num:data.num,
                            letter:data.letter
                        });
                }
            }
        }
    });
    socket.on('input',function(data){
       socket_list[socket.id].categories=data.categories;
       socket_list[socket.id].input=data.input;
       for(i=0;i<socket_list[socket.id].categories.length;i++)
       {
            getResult(socket_list[socket.id].categories[i],socket_list[socket.id].input[i])
            .then((points)=>{
                socket_list[socket.id].emit('points',{
                    amount:points
                });
            });
       }
    });
    socket.on('disconnect',function(reason){
        console.log('a user disconnected beacuse '+reason);
        for(i=0;i<place;i++){
            for(j=0;j<rooms[i].sockets.length;j++)
            {
                if(rooms[i].sockets[j].id==socket.id){
                    var nickname=socket.nickname;
                    delete rooms[i].players[socket.nickname];
                    rooms[i].sockets.pop(socket);
                    emitDisconnection(nickname,rooms[i]);
                    break;
                }
            }
        }
        delete socket_list[socket.id];
    });
});
function emitDisconnection(name,room){
    for(i=0;i<room.sockets.length;i++){
        room.sockets[i].emit("playerLeft",{
            name:name,
            players:room.players
        });
    }
}
function getResult(category,input){
    return new Promise((resolve,reject)=>   {
    var sql=SqlString.format('SELECT * FROM ?? WHERE name = ?', [category,input]);
        con.query(sql,(err,results)=>{
            console.log(results);
            if (err) return reject(err);
            else if(results.length){
                resolve(7);
            }
            else
                resolve(0);
        });
    });
};