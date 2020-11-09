<?php
    include_once 'db.php';
    session_start();
    $points=0;
    if ($_SERVER["REQUEST_METHOD"] == "POST"){
        if(isset($_POST['countries'])){
            $countries=safeinput($_POST['countries']);
            $sql = "SELECT * FROM countries WHERE country=:name";
            $stmt = $conn->prepare($sql);
            $stmt->execute(array(':name' =>$countries));
            $count = $stmt->rowCount();
            echo $count;
            if($count>0)
                $points+=7;
        }
        if(isset($_POST['cities'])){
            $cities=safeinput($_POST['cities']);
            $sql = "SELECT * FROM cities WHERE city=:name";
            $stmt = $conn->prepare($sql);
            $stmt->execute(array(':name' =>$cities));
            $count = $stmt->rowCount();
            if($count>0)
                $points+=7;
        }
        if(isset($_POST['movies'])){
            $movies=safeinput($_POST['movies']);
            $sql = "SELECT * FROM movies WHERE moviename=:name";
            $stmt = $conn->prepare($sql);
            $stmt->execute(array(':name' =>$movies));
            $count = $stmt->rowCount();
            echo $count;
            if($count>0)
                $points+=7;
        }
        /*if(isset($_POST['names'])){
            $names=safeinput($_POST['names']);
            $sql = "SELECT * FROM movies WHERE name=:name";
            $stmt = $conn->prepare($sql);
            $stmt->execute(array(':name' =>$names));
            $count = $stmt->rowCount();
            if($count>0)
                $points+=7;
        }*/
        if(isset($_POST['fruits&vegtables'])){
            $fng=safeinput($_POST['fruits&vegtables']);
            $sql = "SELECT * FROM fruits_vegetables WHERE types=:name";
            $stmt = $conn->prepare($sql);
            $stmt->execute(array(':name' =>$fng));
            $count = $stmt->rowCount();
            if($count>0)
                $points+=7;
        }
        $_SESSION['points']+=$points;
        header('Location: http://localhost/project/Scattergories.php');
        
    }
    function safeinput($data){
        $data=trim($data);    
        $data=stripslashes($data);
        $data=htmlspecialchars($data);
        return $data;
    }
    
?>