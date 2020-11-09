<!DOCTYPE html>
<html>
<title>Lets play a game</title>
<script  type="text/javascript">
    function myfunc(){
        var list=new Array();
        if(document.getElementById('option1').checked)
           list.push(document.getElementById('option1').value);
        if(document.getElementById('option2').checked)
            list.push(document.getElementById('option2').value);
        if(document.getElementById('option3').checked)
            list.push(document.getElementById('option3').value);
        if(document.getElementById('option4').checked)
            list.push(document.getElementById('option4').value);
        if(document.getElementById('option5').checked)
            list.push(document.getElementById('option5').value);
        if(list.length<1){
            document.getElementById("demo").innerHTML="you must select at least 1 category";
            return false;
        }
        else{
            sessionStorage.setItem("list", JSON.stringify(list));
            return true;
        }
    }
</script>
<body style="background-color: cyan; text-align: center;">
<h1><ins>Welcome lets play some... </ins></h1>
<h2><ins>Scattergories </ins></h2>
<div id="newGAME">
    <h3>select the categories you want to play for</h3>
    <form action="Scattergories.php" method="post" onsubmit="return myfunc();">
    <input type="checkbox" id="option1" name="option1" value="countries">
    <label for="option1">countries</label>
    <input type="checkbox" id="option2" name="option2" value="cities">
    <label for="option2">cities</label>
    <input type="checkbox" id="option3" name="option3" value="movies">
    <label for="option3">movies</label>
    <input type="checkbox" id="option4" name="option4" value="names">
    <label for="option4">names</label>
    <input type="checkbox" id="option5" name="option5" value="fruits&vegtables">
    <label for="option5">fruits & vegtables</label>
    <br>
    <input type="submit" value="start game" style="margin-top: 20px;">
</form>
<p id="demo" style="color: red;"></p>
</div>
</body>
</html>