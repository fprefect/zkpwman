<?php


$datadir = './data';

header('Content-type: text/plain');

function handle_error($msg) {
	die($msg);
}

// TODO: use an http error
if(!$_REQUEST['user']) handle_error("Missing required parameter 'user'");
$user = $_REQUEST['user'];

function filelist($user) {
	global $datadir;
	$files = glob("$datadir/$user-*.dat");
	return $files;
}

switch($_SERVER['REQUEST_METHOD']) {
case 'POST':
	$f = sprintf('%s/%s-%s-%s.dat', $datadir, $user, date('YmdHis'), uniqid());
	$data = trim(file_get_contents('php://input'));
	$fp = @fopen($f, 'w');
	if(!$fp) handle_error("Could not open file for writing, ".$php_errmsg);
	fwrite($fp, $data);
	fclose($fp);
	break;
default:
case 'GET':
	if(!isset($_REQUEST['rev']) || $_REQUEST['rev'] == 'NEWEST') {
		$files = filelist($user);
		if(!$files) handle_error("No revisions found");
		$f = array_pop($files);
	}
	elseif($_REQUEST['rev'] == 'LIST') {
		$files = filelist($user);
		$a = array();
		foreach($files As $f) {
			preg_match("/\/$user-(.+?)\.dat$/", $f, $m);
			$a[] = $m[1];
		}
		print json_encode($a);
		break;
	}
	else {
		$rev = $_REQUEST['rev'];
		$files = glob("$datadir/$user-$rev.dat");
		if(!$files) handle_error("Revision '$rev' not found");
		$f = $files[0];
	}
	readfile($f);
	break;
}

?>
