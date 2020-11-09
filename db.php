<?php
//setting up the connection to the database
$servername = "localhost";
$username = "root";
$password = "";
$db = "categories";
$conn = null;
try {
    $conn = new PDO("mysql:host=$servername;dbname=$db", $username, $password);
    
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    //echo "Connected successfully";
    }
catch(PDOException $e)
    {
    echo "Connection failed: " . $e->getMessage();
    }
?>