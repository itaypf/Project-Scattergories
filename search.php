<html>
    <header>

    </header>

    <body>
            <center>
        <form action="search.php" method="post">
            search: <input type="text" name="itay" value="">
            <input type="submit" name="submit" value="search">

        </form>
        <br><br>
        <form action="#" method="get">
            search: <input type="text" name="nemala" value="">
            <input type="submit" name="submit" value="go for it">

        </form>
        <?php
            echo $_POST['itay'];
            echo $_GET['nemala'];
         ?>
    </center>
        
    </body>
    
</html>

    
