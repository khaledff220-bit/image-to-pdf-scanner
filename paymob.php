<?php
// ---------------- CONFIG ----------------
$apiKey        = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBM09EWXdOaXdpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5HQndDVzNjbldpWGVSTXZ1WjRSbGRMazhBUVNuMllvX181YW1yT01aaGhLUUIzQ2FuSlhhQ3lJeUE1TjNiRm1KLUV5S0lDNVdoQ19hS3FoeXpVUnF1dw=="; // استبدل بمفتاح Paymob الأساسي
$integrationId = "5305642"; // استبدل بـ Integration ID بتاع الكارد أو فودافون كاش
$amountCents   = 10000; // المبلغ بالقرش (10000 = 100 جنيه)

// ---------------- STEP 1: AUTH ----------------
$authPayload = ["api_key" => $apiKey];
$ch = curl_init("https://accept.paymob.com/api/auth/tokens");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($authPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$authResponse = curl_exec($ch);
curl_close($ch);

$auth = json_decode($authResponse, true);
if (!isset($auth['token'])) {
    die("Auth Error: " . $authResponse);
}
$authToken = $auth['token'];

// ---------------- STEP 2: ORDER REGISTRATION ----------------
$orderPayload = [
    "auth_token"    => $authToken,
    "delivery_needed" => "false",
    "amount_cents"  => $amountCents,
    "currency"      => "EGP",
    "items"         => []
];
$ch = curl_init("https://accept.paymob.com/api/ecommerce/orders");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$orderResponse = curl_exec($ch);
curl_close($ch);

$order = json_decode($orderResponse, true);
if (!isset($order['id'])) {
    die("Order Error: " . $orderResponse);
}
$orderId = $order['id'];

// ---------------- STEP 3: PAYMENT KEY ----------------
$billingData = [
    "apartment"      => "803",
    "email"          => "customer@example.com",
    "floor"          => "42",
    "first_name"     => "Khaled",
    "last_name"      => "El Sayed",
    "street"         => "123 Main St",
    "building"       => "22B",
    "phone_number"   => "+201000000000",
    "shipping_method"=> "PKG",
    "postal_code"    => "12345",
    "city"           => "Cairo",
    "country"        => "EG",
    "state"          => "Cairo"
];

$paymentKeyPayload = [
    "auth_token"    => $authToken,
    "amount_cents"  => $amountCents,
    "expiration"    => 3600,
    "order_id"      => $orderId,
    "billing_data"  => $billingData,
    "currency"      => "EGP",
    "integration_id"=> $integrationId
];
$ch = curl_init("https://accept.paymob.com/api/acceptance/payment_keys");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentKeyPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$paymentKeyResponse = curl_exec($ch);
curl_close($ch);

$paymentKey = json_decode($paymentKeyResponse, true);
if (!isset($paymentKey['token'])) {
    die("PaymentKey Error: " . $paymentKeyResponse);
}

// ---------------- STEP 4: REDIRECT TO IFRAME ----------------
$iframeId = "962734"; // استبدل بالـ Iframe ID اللي أخدته من Paymob
$iframeUrl = "https://accept.paymob.com/api/acceptance/iframes/$iframeId?payment_token=" . $paymentKey['token'];

// ---------------- OUTPUT ----------------
header("Location: $iframeUrl");
exit;
