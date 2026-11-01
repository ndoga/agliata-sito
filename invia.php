<?php
/*
 * Invio del modulo contatti (hosting Aruba Linux).
 * Risponde in JSON alla pagina; senza JavaScript reindirizza alla home.
 */

declare(strict_types=1);

$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : require __DIR__ . '/config.esempio.php';

$json = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function rispondi(bool $ok, string $errore = '', int $codice = 200): never
{
    global $json;
    if ($json) {
        http_response_code($ok ? 200 : $codice);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'errore' => $errore]);
    } else {
        header('Location: ./' . ($ok ? '?inviato=1' : '?errore=1') . '#contatti', true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    rispondi(false, 'Metodo non consentito', 405);
}

// Campo trappola: se compilato è un bot, fingiamo che sia andato tutto bene.
if (trim($_POST['sito'] ?? '') !== '') {
    rispondi(true);
}

// Limite di invii per indirizzo IP (un messaggio ogni 60 secondi).
$cartellaLimiti = sys_get_temp_dir() . '/agliata_modulo';
if (!is_dir($cartellaLimiti)) {
    @mkdir($cartellaLimiti, 0700, true);
}
$fileLimite = $cartellaLimiti . '/' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
if (is_file($fileLimite) && time() - filemtime($fileLimite) < 60) {
    rispondi(false, 'Attendi un minuto prima di inviare un nuovo messaggio', 429);
}

$pulisci = static fn(string $v, int $max): string =>
    mb_substr(trim(str_replace(["\r", "\0"], '', $v)), 0, $max);

$nome      = $pulisci($_POST['nome'] ?? '', 100);
$telefono  = $pulisci($_POST['telefono'] ?? '', 30);
$email     = $pulisci($_POST['email'] ?? '', 150);
$servizio  = $pulisci($_POST['servizio'] ?? '', 60);
$messaggio = $pulisci($_POST['messaggio'] ?? '', 3000);
$privacy   = ($_POST['privacy'] ?? '') === '1';

// Nessun a capo nei campi che finiscono nelle intestazioni della mail.
foreach ([$nome, $telefono, $email, $servizio] as $v) {
    if (str_contains($v, "\n")) {
        rispondi(false, 'Dati non validi', 422);
    }
}

if ($nome === '' || $telefono === '' || $messaggio === '' || !$privacy) {
    rispondi(false, 'Compila i campi obbligatori', 422);
}
if (!preg_match('/^[0-9 +().\/-]{6,30}$/', $telefono)) {
    rispondi(false, 'Numero di telefono non valido', 422);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    rispondi(false, 'Indirizzo email non valido', 422);
}

$oggetto = 'Richiesta dal sito: ' . $servizio;
$corpo = "Nuova richiesta dal modulo del sito\n"
    . "----------------------------------\n"
    . "Nome:      $nome\n"
    . "Telefono:  $telefono\n"
    . "Email:     " . ($email ?: '—') . "\n"
    . "Servizio:  $servizio\n\n"
    . "Messaggio:\n$messaggio\n\n"
    . "----------------------------------\n"
    . 'Inviato il ' . date('d/m/Y H:i') . ' da IP ' . ($_SERVER['REMOTE_ADDR'] ?? '?') . "\n";

$intestazioni = [
    'From: ' . mb_encode_mimeheader($config['mittente_nome']) . ' <' . $config['mittente'] . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP',
];
if ($email !== '') {
    $intestazioni[] = 'Reply-To: ' . mb_encode_mimeheader($nome) . ' <' . $email . '>';
}

$inviata = mail(
    $config['destinatario'],
    mb_encode_mimeheader($oggetto),
    $corpo,
    implode("\r\n", $intestazioni),
    '-f' . $config['mittente']
);

if (!$inviata) {
    rispondi(false, 'Invio non riuscito', 500);
}

@touch($fileLimite);
rispondi(true);
