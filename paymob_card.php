<?php
// paymob_card.php
date_default_timezone_set('Africa/Cairo');
$logFile = __DIR__ . '/logs/paymob_card.log';
if (!file_exists(dirname($logFile))) mkdir(dirname($logFile), 0755, true);
function write_log_card($m){ global $logFile; file_put_contents($logFile, "[".date('Y-m-d H:i:s')."] $m\n", FILE_APPEND); }

$apiKey = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBM09EWXdOaXdpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5HQndDVzNjbldpWGVSTXZ1WjRSbGRMazhBUVNuMllvX181YW1yT01aaGhLUUIzQ2FuSlhhQ3lJeUE1TjNiRm1KLUV5S0lDNVdoQ19hS3FoeXpVUnF1dw==";
$integrationIdCard = 5305642;
$iframeId = 962734;

$plan = isset($_GET['plan']) ? $_GET['plan'] : 'monthly';
$amounts = ['monthly' => 10000, 'annual' => 50000];
if (!isset($amounts[$plan])) { echo "خطة غير معروفة"; exit; }
$amount_cents = $amounts[$plan];

write_log_card("Start card payment. plan=$plan amount=$amount_cents");

function post_json_card($url, $payload) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return ['resp'=>$resp, 'code'=>$code, 'err'=>$err];
}

// Auth
$auth = post_json_card("https://accept.paymob.com/api/auth/tokens", ["api_key"=>$apiKey]);
write_log_card("Auth code={$auth['code']} resp={$auth['resp']}");
$authData = json_decode($auth['resp'], true);
if (!isset($authData['token'])) { echo "Auth failed. check logs."; exit; }
$token = $authData['token'];

// Order
$orderPayload = ["auth_token"=>$token, "delivery_needed"=>"false", "amount_cents"=>$amount_cents, "currency"=>"EGP", "items"=>[]];
$order = post_json_card("https://accept.paymob.com/api/ecommerce/orders", $orderPayload);
write_log_card("Order code={$order['code']} resp={$order['resp']}");
$orderData = json_decode($order['resp'], true);
if (!isset($orderData['id'])) { echo "Order creation failed. check logs."; exit; }
$order_id = $orderData['id'];

// Payment Key with billing data
$billingData = [
    "apartment" => "NA",
    "email" => "customer@example.com",
    "floor" => "NA",
    "first_name" => "عميل",
    "last_name" => "موقع",
    "street" => "NA",
    "building" => "NA",
    "phone_number" => "+201000000000",
    "shipping_method" => "NA",
    "postal_code" => "NA",
    "city" => "Cairo",
    "country" => "EG",
    "state" => "Cairo"
];

$paymentKeyPayload = [
    "auth_token" => $token,
    "amount_cents" => $amount_cents,
    "expiration" => 3600,
    "order_id" => $order_id,
    "billing_data" => $billingData,
    "currency" => "EGP",
    "integration_id" => $integrationIdCard
];
$pk = post_json_card("https://accept.paymob.com/api/acceptance/payment_keys", $paymentKeyPayload);
write_log_card("PaymentKey code={$pk['code']} resp={$pk['resp']}");
$pkData = json_decode($pk['resp'], true);
if (!isset($pkData['token'])) { echo "PaymentKey error. check logs."; exit; }
$payment_token = $pkData['token'];

// Redirect
$iframe_url = "https://accept.paymob.com/api/acceptance/iframes/{$iframeId}?payment_token={$payment_token}";
write_log_card("Redirecting to $iframe_url");
header("Location: $iframe_url");
exit;
?>
