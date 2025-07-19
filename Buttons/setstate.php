<?php
if (isset($_GET['state'])) {
    $state = $_GET['state'];
    file_put_contents("ledstate.txt", $state);
}
?>
