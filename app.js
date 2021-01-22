const { rejects } = require('assert');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
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
        room.status={};
        room.id=data.input;
        room.categories=data.categories
        socket.nickname=data.name
        room.players[socket.nickname]=0;
        room.status[socket.nickname]=1;
        room.sockets.push(socket);
        rooms[place]=room;
        place++;
        socket.join(room.id);
        var clientsList = io.sockets.adapter.rooms;
        console.log(clientsList);
        socket.emit("created",{
            status:room.status,
            num:0
        });
    });
    socket.on("joinRoom",function(data){//when a player joins update the player list for all players
        //and inform them that a player joined
        id=data.input;
        socket.nickname=data.name;
        for (i=0;i<place;i++){
            if(id===rooms[i].id){
                socket.join(id);
                rooms[i].players[socket.nickname]=0;
                rooms[i].status[socket.nickname]=1;
                rooms[i].sockets.push(socket);
                console.log(rooms[i].sockets);
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].id!=socket.id){
                        rooms[i].sockets[j].emit("playerJoined",{
                            players:rooms[i].players,
                            status:rooms[i].status,
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
                rooms[i].status=data.status;
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
    socket.on("update",function(data){
        for(i=0;i<place;i++)
        {
            if(rooms[i].id==data.id)
            {
                rooms[i].status[data.name]=1;
                rooms[i].players[socket.nickname]+=data.num
                for(j=0;j<rooms[i].sockets.length;j++){
                    rooms[i].sockets[j].emit("scoreboard",{
                        players:rooms[i].players,
                        status:rooms[i].status
                    });
                }
            }
        }
    });
       
    socket.on('disconnect',function(reason){//when player leaves update the player list for everyone
        //and inform them that a player left
        console.log('a user disconnected beacuse '+reason);
        for(i=0;i<place;i++){
            for(j=0;j<rooms[i].sockets.length;j++)
            {
                if(rooms[i].sockets[j].id==socket.id){
                    var nickname=socket.nickname;
                    delete rooms[i].players[socket.nickname];
                    delete rooms[i].status[socket.nickname];
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
            players:room.players,
            status:room.status
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