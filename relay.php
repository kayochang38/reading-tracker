<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
// ===============================
// Reading Tracker relay.php (v3)
// ===============================
//ob_start();

// --- CORS / プリフライト対応 ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://www.laboratomie.com');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    //ob_end_clean();
    exit;
}
header('Access-Control-Allow-Origin: https://www.laboratomie.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// --- Google Apps Script WebアプリのURL ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz5jy1oodb7yHu93Gvm0pul9mxYIeZpQrBVSrNxEmBgUSXwjkTqUNOGKpmlO_NtHsQc/exec';

// --- POSTデータの受け取り ---
$input = $_POST;
if (!$input || !isset($input['mode'])) {
    echo json_encode(['ok'=>false, 'error'=>'Invalid POST', 'debug'=>$input]);
    //ob_end_clean();
    exit;
}

// --- GASへ転送 ---
$ch = curl_init(GAS_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($input));
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// ▼ ここを追加（詳細なHTTPコード取得）
$response = curl_exec($ch);
$err = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// ▼ 結果を返す部分
if ($err) {
    echo json_encode(['ok'=>false, 'error'=>'cURL error: '.$err]);
} elseif ($httpCode !== 200) {
    echo json_encode([
        'ok'=>false,
        'error'=>'GAS HTTP '.$httpCode,
        'raw'=>$response
    ]);
} else {
    echo $response;
}


//ob_end_clean();
?>
