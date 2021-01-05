const { rejects } = require('assert');
var express=require('express');
var fs=require('fs');
var app=express();
var server=require('http').Server(app);
var mysql=require('mysql');
const { resolve } = require('path');
var SqlString = require('sqlstring');
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
var socket_list={};
var io=require('socket.io')(server,{})
io.sockets.on('connection',function(socket){
    socket.id=Math.random();
    socket.score=0;
    socket.categories=[];
    socket.input=[];
    console.log(socket.id);
    socket_list[socket.id]=socket;
    console.log('socket connection');
    socket.on('name',function(data){
        console.log(data);
        fs.appendFile('players.txt',data.input+"=0\n",function(err){
            if (err) throw err;
            console.log("saved");
        });
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
        delete socket_list[socket.id];
    });
});
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