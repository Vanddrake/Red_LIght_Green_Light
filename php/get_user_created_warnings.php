<?php
/*
  Author:   Robert Zaranek
  Date:     April 15, 2021

  Purpose:  Returns a list of current user created warnings from the database. 
            For use with the "Red Light, Green Light" application.
*/

include "connect.php";

$locations = [];
$command = "SELECT *
            FROM user_created_warnings";
$stmt = $dbh->prepare($command);
$success = $stmt->execute();

if ($success) {
    while ($row = $stmt->fetch()) {
        $location = array(
            "WARNING_ID"=>$row["WARNING_ID"],
            "LOCATION"=>$row["LOCATION"],
            "DIRECTION"=>$row["DIRECTION"],
            "LONGITUDE"=>$row["LONGITUDE"],
            "LATITUDE"=>$row["LATITUDE"]
        );
        array_push($locations, $location);
    }
    echo json_encode($locations);
} else {
    echo json_encode(-1);    // SQL execution failure
}
