<!DOCTYPE HTML>
<html>
<head>
<title>login</title>

</head>
<h1>Login</h1>
<body>
    <form action="main.php" method="post" onsubmit="alert('loading...');">
        <table>
                <tr>
                        <td>Username:</td>
                        <td>
                            <input type="text" name="username"placeholder="username">
                        </td>
                </tr>
            <tr>
					<td>Password:</td>
					<td>
						<input type="password" name="password" placeholder="password">
					</td>
                </tr>
                <td>
						<input type="submit" name="login" value="login">
					</td>
    </table>
    </form>

</body>
</html>