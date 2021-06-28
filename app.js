var express=require('express');
var fs=require('fs');
var app=express();
var server=require('http').Server(app);
const limit=require('express-limit').limit;
var mysql=require('mysql');
var SqlString = require('sqlstring');
var io=require('socket.io')(server,{})
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
var data=fs.readFileSync('Database.txt',{encoding: 'base64'});
var encrypted=Buffer.from(data,'base64');
encrypted=encrypted.toString('ascii');
var password="1";
var con;
readline.question('password?', input=>{
    password=input;
    con = mysql.createConnection({//setting up connection to the database
        host: "localhost",
        user: encrypted,
        password: password,
        database: "categories"
      });
      con.connect(function(err){//connection attempt
        if (err) throw error;
        console.log("connection established");
    });
    readline.close();
});
app.get('/',limit({
    max:    60,        // 60 requests
    period: 60 * 1000 // per minute (60 seconds)
}),function(req,res){
    res.sendFile(__dirname+'/client/index.html');
});
app.use('/client',express.static(__dirname+'/client'));
server.listen(8080);
console.log("server started");
var id="";
var place=0;
var rooms=[];
io.sockets.on('connection',function(socket){//when a socket gets connected
    
    socket.id=Math.random();//it is given a random id
    socket.categories=[];//it initiates a category list that is saved within the socket
    socket.input=[];//it initiates an input list for the answers
    socket.on("createRoom",function(data){//if the user created a room
        for(i=0;i<place;i++){
            if(rooms[i].id===data.input){//making sure there isnt a room with the same name
                socket.emit("roomExists");
                socket.disconnect();
                return;
            }
        }
        var room={};//new room
        room.players={};//dictionary players within room
        room.sockets=[];//list of sockets within room
        room.status={};//dictionary of players status
        room.join=1;//is the room joinable or not
        room.id=data.input;//room id get the name the user gave as input
        room.rounds=data.rounds;//room gets amount of rounds the user gave as input
        room.categories=data.categories;//room gets categories the user selected
        socket.nickname=data.name;//the socket gets the name the user chose for himself
        room.players[socket.nickname]=0;//the user gets added to the player list and given an initial score of 0
        room.status[socket.nickname]=1;//the user gets added to the status list 
        room.sockets.push(socket);//the user socket gets added to the list of sockets in the room
        rooms.push(room);//the room gets added to the rooms list
        console.log(rooms);
        place++;
        socket.join(room.id);//users socket is joined into the room
        var clientsList = io.sockets.adapter.rooms;
        console.log(clientsList);
        socket.emit("created",{//sending a message to the user that the room is created
            status:room.status,
            num:0
        });
    });
    socket.on("joinRoom",function(data){//when a player joins update the player list for all players
        //and inform them that a player joined
        id=data.input;
        for (i=0;i<place;i++){
            if(id===rooms[i].id){
                if(rooms[i].join==0)//checking that the room is joinable
                {
                    socket.emit("gameStarted");//sending a message that the game started already and cant join
                    socket.disconnect();
                    return;
                }
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].nickname===data.name){//checking that the username isnt taken
                        socket.emit("exists");
                        socket.disconnect();
                        return;
                    }
                }
                socket.nickname=data.name;
                socket.join(id);//joining the room
                rooms[i].players[socket.nickname]=0;//adding the joining user to the player dictionary and giving him an inital score of 0
                rooms[i].status[socket.nickname]=1;//adding the joining user to the status dictionary
                rooms[i].sockets.push(socket);//the socket is added to the socket list in the room
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].id!=socket.id){//sending to all the other players in the room that a user joined
                        rooms[i].sockets[j].emit("playerJoined",{
                            players:rooms[i].players,
                            status:rooms[i].status,
                            name:socket.nickname
                        });
                    }
                }
                var clientsList = io.sockets.adapter.rooms;
                console.log(clientsList);
                return socket.emit("success",{//sending to the joining user the rooms category and the playerlist
                    categories:rooms[i].categories,
                    players:rooms[i].players,
                    num:1
                });
            }
        }
        socket.emit("notFound");//if the room was not found
    });
    console.log(rooms);
    console.log('socket connection');
    socket.on("begin",function(data){//when host starts the game 
        for(i=0;i<place;i++)
        {
            if(rooms[i].id===data.room)//making sure that sending to the correct room
            {
                rooms[i].join=0;//making the room unjoinable
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].nickname!==socket.nickname)//sends message to everyone besided the host
                    //that the game started
                        rooms[i].sockets[j].emit("begin",{
                            num:data.num
                        });
                }
            }
        }
    });
    socket.on("roll",function(data){//when the host rolls a letter
        for(i=0;i<place;i++)
        {
            if(rooms[i].id===data.room)//making sure that sending to the correct room
            {
                rooms[i].status=data.status;//changing everyone status to not ready to roll again (cause the round only started)
                for(j=0;j<rooms[i].sockets.length;j++)
                {
                    if(rooms[i].sockets[j].nickname!==socket.nickname)//sending to everyone besides the host a message
                    //that the host rolled with the letter that was chosen
                        rooms[i].sockets[j].emit("roll",{
                            num:data.num,
                            letter:data.letter
                        });
                }
            }
        }
    });
    socket.on("sabotage",function(data){//when a user sends a sabotage
        for(var i=0;i<rooms.length;i++)
        {
            if(rooms[i].id===data.room)//making sure im in the right room
            {
                rooms[i].players[socket.nickname]-=data.type;//removing the cost of points from the sending user
                for(var j=0;j<rooms[i].sockets.length;j++){
                    if(rooms[i].sockets[j].nickname===data.target)//finding the correct target
                    {
                        rooms[i].sockets[j].emit("sabotaged",{//sending the sabotage
                            type:data.type
                        });
                    }
                    rooms[i].sockets[j].emit("update",{//sending an update to everyon after the change of points
                        players:rooms[i].players,
                    });
                }
            }
        }
    });
    socket.on('input',async function(data){//when a user submits
        var status=0;
       socket.categories=data.categories;//the categories get saved in the socket
       socket.input=data.input;//the answers get saved in the socket
        //when everyone submits compare results between player and database 
        //then change points and send
            for(var i=0;i<rooms.length;i++)
            {
                if(rooms[i].id===data.id)//getting to the correct room that sent input
                {
                    rooms[i].status[socket.nickname]=1;//setting this players status to ready
                    for(var j in rooms[i].status)
                    {
                        if(rooms[i].status[j]==1)//checking how many are ready
                        {
                            status++;
                        }
                    }
                    if(status==1)//if this was the first ready player
                    {
                        for(var k=0;k<rooms[i].sockets.length;k++)//send a message to everyone besides the submitting player
                        {//that a player has submitted and starting the countdown
                            if(rooms[i].sockets[k].id!==socket.id)
                               rooms[i].sockets[k].emit("countDown",socket.nickname+" has submitted, countdown reduced to 10 seconds");
                        }
                    }
                    if(status){
                        for(var k=0;k<rooms[i].sockets.length;k++){
                            if(rooms[i].status[rooms[i].sockets[k].nickname]==1)//sending to everyone waiting in the room
                            {//the other players status
                                rooms[i].sockets[k].emit("waiting",{
                                    status:rooms[i].status,
                                    players:rooms[i].players
                                });
                                    
                            }
                        }
                    }
                    if(status==rooms[i].sockets.length)//if everyone in the room is ready
                    {//check the answers and give away points
                        await givePoints(rooms[i])//waiting for the point handout to finish
                        .then((room) => {
                                rooms[i] = room;//pasting the changed room into the saved room
                            });
                        for(var j=0;j<rooms[i].sockets.length;j++){//sending every player in the room the updated scores
                            rooms[i].sockets[j].emit("scoreboard",{
                                players:rooms[i].players,
                                answers:rooms[i].sockets[j].input,
                                status:rooms[i].status
                            });
                        }
                        if(rooms[i].rounds==0)//if the amount of rounds in the room reaches 0
                        {
                            for(var j=0;j<rooms[i].sockets.length;j++)//send everyone in the room a message 
                            {//that the game is over
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
                if(rooms[i].sockets[j].id==socket.id){//checking if this is the correct socket
                    var nickname=socket.nickname;//saving the players name
                    delete rooms[i].players[socket.nickname];//removing user from players list
                    delete rooms[i].status[socket.nickname];//removing user from status list
                    rooms[i].sockets.splice(j,1)//removing user from socket list
                    emitDisconnection(nickname,rooms[i]);
                    if(rooms[i].sockets.length<1)//if amount of players in the room is less then 1
                    {
                        rooms.splice(i,1);//close the room
                        place--;
                    }
                    else if(j==0)//if the disconnecting user was the host
                    {
                        rooms[i].sockets[j].emit("newHost",{//picking a new host
                            num:0
                        })
                    }
                    break;
                }
            }
        }
        socket.disconnect();
    });
});
function emitDisconnection(name,room){//sending a message to all the players in the room
    //that a user disconnected
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
            else if(results.length){//if i got a result then the player gets points
                resolve(7);
            }
            else//if i didnt get a result the user wont get points
                resolve(0);
        });
    });
};
async function givePoints(room){
    return new Promise(async (resolve,reject)=>   {
            for(var j=0;j<room.sockets[0].categories.length;j++){
                var times=0;
                for(k=0;k<room.sockets.length;k++){
                    await getResult(room.sockets[k].categories[j],room.sockets[k].input[j])//checking the users answers
                    //if they appear in the database
                    .then((points)=>{
                        if(points==0)//if this users answer didnt appear in database
                        {
                            room.sockets[k].input[j]="";//delete his answer(he will get no points for this)
                            times++;//counting the amound of 0's
                        }
                    });
                }
                if(times==room.sockets.length-1)//if the amount of 0's amounts to amount of players -1
                {
                    for(k=0;k<room.sockets.length;k++){
                        if(room.sockets[k].input[j].length>0)//find the single player that his answer appeard in database
                        {
                            room.players[room.sockets[k].nickname]+=10;//give him 10 points
                            room.sockets[k].input[j]="+";
                            break;
                        }
                    }
                }
                else
                {
                    for(k=0;k<room.sockets.length;k++){
                        if(room.sockets[k].input[j].length==0)//skipping the ppl whose answer for this category didnt appear in the database
                            continue;
                        else
                        {
                            var equal=0;//counting the amount of ppl that answered the same
                            for(i=0;i<room.sockets.length;i++)
                            {
                                if(room.sockets[i].input[j]==="=")//if this answer was already found to be a copy skip
                                    continue;
                                if(i!=k&&room.sockets[k].input[j]===room.sockets[i].input[j])//when 2 diffrent players answers are the same
                                {
                                    room.players[room.sockets[i].nickname]+=5;//give the checked player 5 points
                                    room.sockets[i].input[j]="=";//change their answer to = so they dont get points again
                                    equal++;
                                    
                                }
                                if((i+1==room.sockets.length)&&(equal>0))
                                {
                                    room.sockets[k].input[j]="=";
                                    room.players[room.sockets[k].nickname]+=5;
                                }
                            }
                            if(room.sockets[k].input[j]!=="=")//if someones answer wasnt found to be equal to anyone
                            //this player gets 7 points
                                room.players[room.sockets[k].nickname]+=7;
                        }
                    }
                }
            }
        room.rounds--;//lower this rooms round by 1 cause a round just ended
        resolve(room);//return the changed room
    });
}