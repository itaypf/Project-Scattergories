var express=require('express');
var app=express();
var server=require('http').Server(app);
var mysql=require('mysql')
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "categories"
});
var points=0;
app.get('/',function(req,res){
    res.sendFile(__dirname+'/client/index.html');
});
app.use('/client',express.static(__dirname+'/client'));
server.listen(8080);
console.log("server started");
var io=require('socket.io')(server,{})
io.sockets.on('connection',function(socket){
    console.log('socket connection');

    socket.on('input',function(data){
       var categories=data.categories;
       console.log(categories);
       var input=data.input;
       for(i=0;i<categories.length;i++)
       {
           points+=search(categories[i],input[i]);
       }
       socket.emit('points',{
           amount:points
       });
    });
});
function search(category,input){
    var per=0;
    var sql="SELECT * FROM "+category+" WHERE name = '"+input+"'"
    con.query(sql,function(err,rows){
        if(rows&&rows.length){
            console.log(rows);
            per+=7;
            console.log(per);
        }
    });
    console.log(per);
    return per;
};