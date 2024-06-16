<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Here you can add code to save the data to a database or process it as needed

    echo "Sign-up successful! Username: $username, Email: $email";
}
?>

