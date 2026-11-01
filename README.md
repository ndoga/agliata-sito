# Agliata Soccorso Stradale – sito

Nuovo sito di [agliatasoccorso.com](https://www.agliatasoccorso.com), al posto di WordPress.
HTML, CSS e JavaScript senza framework; PHP solo per l'invio del modulo contatti.

## Struttura

| File | Ruolo |
| --- | --- |
| `index.html` | Pagina unica: apertura animata, servizi, come funziona, chi siamo, contatti |
| `privacy.html` | Informativa sulla privacy |
| `accessibilita.html` | Dichiarazione di accessibilità (riferimento WCAG 2.1 AA) |
| `assets/css/style.css` | Stili e animazioni |
| `assets/js/main.js` | Comparsa allo scorrimento, contatori, menu, modulo |
| `invia.php` | Invio del modulo via `mail()` (solo su Aruba, non su GitHub Pages) |
| `config.esempio.php` | Modello di configurazione: copiarlo come `config.php` sul server |
| `.htaccess` | HTTPS, reindirizzamento dei vecchi indirizzi WordPress, cache |

## Anteprima

Su GitHub Pages il sito si vede completo, ma il modulo contatti non invia (Pages non esegue PHP).

## Pubblicazione su Aruba

1. Nel pannello Aruba impostare PHP 8.1 o successivo.
2. Creare la casella `noreply@agliatasoccorso.com` (o un'altra del dominio) da usare come mittente.
3. Caricare via FTP tutti i file nella cartella principale del sito, dopo aver salvato una copia di WordPress.
4. Copiare `config.esempio.php` come `config.php` e controllare gli indirizzi.
5. Provare il modulo contatti.
