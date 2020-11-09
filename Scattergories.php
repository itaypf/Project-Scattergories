<?php
  session_start();
  $points=0;
  if(isset($_SESSION['points']))
  {
    $points=$_SESSION['points'];
  }
?>
<!DOCTYPE html>
<html>
<script>
    var list=new Array();
    list=JSON.parse(sessionStorage.getItem("list"));
    function start_game(){ 
      var score=0;
      score+=<?php echo $points?>;
      var form = document.getElementsByTagName('form')[0];
        document.getElementById("score").innerHTML="score:"+score;
        tableCreate(list);
        var sub=document.createElement("input");
        sub.setAttribute('type','submit');
        sub.setAttribute('value','submit');
        sub.setAttribute('style','margin-top:20px;');
        form.appendChild(sub);
        
    }
    function tableCreate(x) {
      var form = document.getElementsByTagName('form')[0];
      var tbl = document.createElement('table');
      tbl.style.width = '100%';
      tbl.setAttribute('border', '1');
      var tbdy = document.createElement('tbody');
      for (var i = 0; i < 2; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j < x.length; j++) {
          if (i == 2 && j == 1) {
            break;
          } else {
            var td = document.createElement('td');
            i==0 ? td.appendChild(document.createTextNode(x[j])) : null;
            i == 1 && j == 1 ? td.setAttribute('rowSpan', '2') : null;
            i==1? td.appendChild(create_input(list,j)) : null;
            tr.appendChild(td);
        }
    }
    tbdy.appendChild(tr);
  }
  tbl.appendChild(tbdy);
  form.appendChild(tbl);
}
function create_input(list,num){
  var x=document.createElement('input')
  x.setAttribute('name',list[num]);
  x.setAttribute('id',list[num]);
  return x;

}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function roll(x){
  var time=document.getElementById('time');
  var div=document.getElementById('letter');
  var num=Math.round((Math.random()*25)+65);
  
  num=String.fromCharCode(num);
  div.innerHTML=num;
  document.getElementById('sbut').setAttribute('onclick','');
  var i=120;
  while(i>0){
    i--;
    await sleep(1000);
    time.innerHTML=i;
  }
  document.getElementById('myform').submit();
}

function check_input(){
  var v=new Array();
  var letter=document.getElementById('letter').innerHTML.toLowerCase();
  for(var i=0;i<list.length;i++)
  {
    v.push(document.getElementById(list[i]));
    if(v[i].value.charAt(0)!=letter&&v[i].value.charAt(0)!=letter.toUpperCase()){
      v[i].style.borderColor="red";
      document.getElementById('report').innerHTML="input doesnt match letter";
      return false;
    }
  }
  return true;
}
</script>
<title >Scattergories</title>
<body id="bdy" style="text-align: center;" onload="start_game()">
<h1 id="score" style="font-size:300%;" ></h1>
<br>
<div id="time" style="font-size: 250%; text-align: left;">120</div>
<div id='letter' style="font-size:250%;">A</div>
<input id="sbut" type="submit" value="roll" style="margin-bottom:20px;" onclick="roll()" on>
<br>
<form id="myform" action="search.php" method="POST" onsubmit="return check_input()">
</form>
<div id="report" style="color: red;"></div>
</body>
</html>