var express=require('express');
var fs=require('fs');
var app=express();
app.disable('x-powered-by');
var server=require('http').Server(app);
const limit=require('express-limit').limit;
var mysql=require('mysql');
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
app.get('/', limit({
 max: 6,
 period: 60 * 1000   
}), function(req,res){
    res.sendFile(__dirname+'/client/index.html');
});
app.use('/client',express.static(__dirname+'/client'));
server.listen(8080);
console.log("server started");
var id="";
var place=0;
var rooms=[];
io.sockets.on('connection',function(socket){
    
    socket.id=Math.random();
    socket.categories=[];
    socket.input=[];
    socket.on("createRoom",function(data){
        for(i=0;i<place;i++){
            if(rooms[i].id===data.input){
                socket.emit("roomExists");
                return;
            }
        }
        var room={};
        room.players={};
        room.sockets=[];
        room.status={};
        room.join=1;
        room.id=data.input;
        room.rounds=data.rounds;
        room.categories=data.categories;
        socket.nickname=data.name;
        room.players[socket.nickname]=0;
        room.status[socket.nickname]=1;
        room.sockets.push(socket);
        rooms.push(room);
        console.log(rooms);
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
        for (i=0;i<place;i++){
            if(id===rooms[i].id){
                if(rooms[i].join==0)
                {
                    socket.emit("gameStarted");
                    return;
                }
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].nickname===data.name){
                        socket.emit("exists");
                        return;
                    }
                }
                socket.nickname=data.name;
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
        socket.emit("notFound");
    });
    console.log(rooms);
    console.log('socket connection');
    socket.on("begin",function(data){
        for(i=0;i<place;i++)
        {
            if(rooms[i].id===data.room)
            {
                rooms[i].join=0;
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
    socket.on("sabotage",function(data){
        for(var i=0;i<rooms.length;i++)
        {
            if(rooms[i].id===data.room)
            {
                rooms[i].players[socket.nickname]-=data.type;
                for(var j=0;j<rooms[i].sockets.length;j++){
                    if(rooms[i].sockets[j].nickname===data.target)
                    {
                        rooms[i].sockets[j].emit("sabotaged",{
                            type:data.type
                        });
                    }
                    rooms[i].sockets[j].emit("update",{
                        players:rooms[i].players,
                    });
                }
            }
        }
    });
    socket.on('input',async function(data){
        var status=0;
       socket.categories=data.categories;
       socket.input=data.input;
        //when everyone submits compare results between player and database 
        //then change points and send
            for(var i=0;i<rooms.length;i++)
            {
                if(rooms[i].id===data.id)
                {
                    rooms[i].status[socket.nickname]=1;
                    for(var j in rooms[i].status)
                    {
                        if(rooms[i].status[j]==1)
                        {
                            status++;
                        }
                    }
                    if(status==1)
                    {
                        for(var k=0;k<rooms[i].sockets.length;k++)
                        {
                            if(rooms[i].sockets[k].id!==socket.id)
                               rooms[i].sockets[k].emit("countDown",socket.nickname+" has submitted, countdown reduced to 10 seconds");
                        }
                    }
                    if(status){
                        for(var k=0;k<rooms[i].sockets.length;k++){
                            if(rooms[i].status[rooms[i].sockets[k].nickname]==1)
                            {
                                rooms[i].sockets[k].emit("waiting",{
                                    status:rooms[i].status,
                                    players:rooms[i].players
                                });
                                    
                            }
                        }
                    }
                    if(status==rooms[i].sockets.length)
                    {
                        await givePoints(rooms[i])//var i not waiting and continues to run so returned room goes into place 2
                        .then((room) => {
                                rooms[i] = room;
                            });
                        for(var j=0;j<rooms[i].sockets.length;j++){
                            rooms[i].sockets[j].emit("scoreboard",{
                                players:rooms[i].players,
                                answers:rooms[i].sockets[j].input,
                                status:rooms[i].status
                            });
                        }
                        if(rooms[i].rounds==0)
                        {
                            for(var j=0;j<rooms[i].sockets.length;j++)
                            {
                                rooms[i].sockets[j].emit("gameOver",{
                                    length:rooms[i].sockets.length,
                                    players:rooms[i].players,
                                    num:0
                                });
                            }
                        }
                    }
                }
            }
    });
       
    socket.on('disconnect',function(reason){//when player leaves update the player list for everyone
        //and inform them that a player left
        console.log('a user disconnected beacuse '+reason);
        for(var i=0;i<place;i++){
            for(var j=0;j<rooms[i].sockets.length;j++)
            {
                if(rooms[i].sockets[j].id==socket.id){
                    var nickname=socket.nickname;
                    delete rooms[i].players[socket.nickname];
                    delete rooms[i].status[socket.nickname];
                    rooms[i].sockets.splice(j,1)
                    emitDisconnection(nickname,rooms[i]);
                    if(rooms[i].sockets.length<1)
                    {
                        rooms.splice(i,1);
                        place--;
                    }
                    else if(j==0)
                    {
                        rooms[i].sockets[j].emit("newHost",{
                            num:0
                        })
                    }
                    break;
                }
            }
        }
    });
});
function emitDisconnection(name,room){
    for(var k=0;k<room.sockets.length;k++){
        room.sockets[k].emit("playerLeft",{
            name:name,
            players:room.players,
            status:room.status
        });
    }
}
async function getResult(category,input){//sql query to check if answer exists in database
    return new Promise(async (resolve,reject)=>   {
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
async function givePoints(room){//comparing the users answers with database,then with other users 
    //answers and granting points acordingly
    return new Promise(async (resolve,reject)=>   {
            for(var j=0;j<room.sockets[0].categories.length;j++){
                var times=0;
                for(k=0;k<room.sockets.length;k++){
                    await getResult(room.sockets[k].categories[j],room.sockets[k].input[j])
                    .then((points)=>{
                        if(points==0)
                        {
                            room.sockets[k].input[j]="";
                            times++;
                        }
                    });
                }
                if(times==room.sockets.length-1)
                {
                    for(k=0;k<room.sockets.length;k++){
                        if(room.sockets[k].input[j].length>0)
                        {
                            room.players[room.sockets[k].nickname]+=10;
                            room.sockets[k].input[j]="+";
                            break;
                        }
                    }
                }
                else
                {
                    for(k=0;k<room.sockets.length;k++){
                        if(room.sockets[k].input[j].length==0)
                            continue;
                        else
                        {
                            var equal=0;
                            for(i=0;i<room.sockets.length;i++)
                            {
                                if(room.sockets[i].input[j]==="=")
                                    continue;
                                if(i!=k&&room.sockets[k].input[j]===room.sockets[i].input[j])
                                {
                                    room.players[room.sockets[i].nickname]+=5;
                                    room.sockets[i].input[j]="=";
                                    equal++;
                                    
                                }
                                if((i+1==room.sockets.length)&&(equal>0))
                                {
                                    room.sockets[k].input[j]="=";
                                    room.players[room.sockets[k].nickname]+=5;
                                }
                            }
                            if(room.sockets[k].input[j]!=="=")
                                room.players[room.sockets[k].nickname]+=7;
                        }
                    }
                }
            }
        room.rounds--;
        resolve(room);
    });
}