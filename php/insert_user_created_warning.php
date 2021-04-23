<?php
/*
  Author:   Robert Zaranek
  Date:     April 15, 2021

  Purpose:  Inserts a user created warning to the database and returns the ID of the newly created warning. 
            For use with the "Red Light, Green Light" application.
*/

include "connect.php";

$location = filter_input(INPUT_GET, "location", FILTER_SANITIZE_STRING);
$direction = filter_input(INPUT_GET, "direction", FILTER_SANITIZE_STRING);
$latitude = filter_input(INPUT_GET, "latitude", FILTER_VALIDATE_FLOAT);
$longitude = filter_input(INPUT_GET, "longitude", FILTER_VALIDATE_FLOAT);

$command = "INSERT INTO `user_created_warnings`(`LOCATION`, `DIRECTION`, `LONGITUDE`, `LATITUDE`) 
            VALUES (?, ?, ?, ?)";
$stmt = $dbh->prepare($command);
$params = [$location, $direction, $longitude, $latitude];
$success = $stmt->execute($params);

if ($success) {
    $command = "SELECT `WARNING_ID` 
                FROM `user_created_warnings` 
                ORDER BY WARNING_ID DESC 
                LIMIT 1";
    $stmt = $dbh->prepare($command);
    $success = $stmt->execute();

    if ($success) {
        echo json_encode($stmt->fetch()["WARNING_ID"]);
    } else {
        echo json_encode(-2);    // SQL SELECT execution failure
    }
} else {
    echo json_encode(-1);    // SQL execution failure
}
