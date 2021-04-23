<?php
/*
  Author:   Robert Zaranek
  Date:     April 15, 2021

  Purpose:  Returns a list of all the default red light cameras from the database. 
            For use with the "Red Light, Green Light" application.
*/

include "connect.php";

$locations = [];
$command = "SELECT *
            FROM red_light_cameras";
$stmt = $dbh->prepare($command);
$success = $stmt->execute();

if ($success) {
    while ($row = $stmt->fetch()) {
        $location = array(
            "X"=>$row["X"],
            "Y"=>$row["Y"],
            "OBJECTID"=>$row["OBJECTID"],
            "CAMERA_ID"=>$row["CAMERA_ID"],
            "LOCATION"=>$row["LOCATION"],
            "DIRECTION"=>$row["DIRECTION"],
            "STATUS"=>$row["STATUS"],
            "LONGITUDE"=>$row["LONGITUDE"],
            "LATITUDE"=>$row["LATITUDE"]
        );
        array_push($locations, $location);
    }
    echo json_encode($locations);
} else {
    echo json_encode(-1);    // SQL execution failure
}
