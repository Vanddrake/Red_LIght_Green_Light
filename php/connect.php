<?php
/*
  Author:   Robert Zaranek
  Date:     April 15, 2021

  Purpose:  Establishes a connection to the database.
*/

try {
    $dbh = new PDO(
        "mysql:host=localhost;dbname=mtDb",
        "root",
        ""
    );
} catch (Exception $e) {
    die("ERROR: Couldn't connect. {$e->getMessage()}");
}
