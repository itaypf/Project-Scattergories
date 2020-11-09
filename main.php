<?php
if($_POST['username']=='itay'&& $_POST['password']=='654321')
{
    echo "hello" ." " . $_POST['username'];
}
else{
    echo"<script>
    alert('try again')
    window.location='http://127.0.0.1/index.php'
    </script>";
}
?>