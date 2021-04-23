<?php
/*
  Author:   Robert Zaranek
  Date:     April 15, 2021

  Purpose:  Deletes a user created warning from the database. 
            For use with the "Red Light, Green Light" application.
*/

include "connect.php";

$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);

$command = "DELETE FROM `user_created_warnings` WHERE WARNING_ID = ?";
$stmt = $dbh->prepare($command);
$params = [$id];
$success = $stmt->execute($params);

if ($success) {
    echo json_encode(1);    // SQL execution success
} else {
    echo json_encode(-1);    // SQL execution failure
}
