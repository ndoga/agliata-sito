/* Agliata Soccorso Stradale – interazioni e animazioni */
(() => {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');
  const movimentoRidotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // animazioni spente dal sistema operativo o dal pulsante "Ferma le animazioni"
  const fermo = () => movimentoRidotto || doc.classList.contains('ferme');

  /* Pulsanti per fermare e riavviare le animazioni (WCAG 2.2.2) */
  const pulsantiFerma = document.querySelectorAll('.ferma-animazioni');
  const aggiornaPulsantiFerma = () => {
    const ferme = doc.classList.contains('ferme');
    pulsantiFerma.forEach(b => {
      b.setAttribute('aria-pressed', String(ferme));
      const testo = ferme ? 'Riavvia le animazioni' : 'Ferma le animazioni';
      if (b.classList.contains('ferma-animazioni--icona')) {
        b.setAttribute('aria-label', testo);
        b.title = testo;
      } else {
        b.textContent = testo;
      }
    });
  };
  pulsantiFerma.forEach(b => b.addEventListener('click', () => {
    const ferme = doc.classList.toggle('ferme');
    try { localStorage.setItem('animazioni', ferme ? 'ferme' : 'attive'); } catch (e) { /* archivio non disponibile */ }
    if (ferme) {
      document.querySelectorAll('[data-inclina]').forEach(el => { el.style.transform = ''; });
      document.querySelectorAll('[data-parallasse] img').forEach(el => { el.style.transform = ''; });
    }
    aggiornaPulsantiFerma();
  }));
  aggiornaPulsantiFerma();

  /* Intestazione compatta e barra di chiamata dopo lo scorrimento */
  const testata = document.getElementById('testata');
  const barra = document.querySelector('.barra-chiama');
  const fluttuante = document.querySelector('.chiama-fluttuante');
  const letto = document.querySelector('.avanzamento span');
  const sfondoNumeri = document.querySelector('.numeri__sfondo');
  const aggiornaScorrimento = () => {
    const y = scrollY;
    testata.classList.toggle('compatta', y > 40);
    if (barra) barra.classList.toggle('visibile', y > innerHeight * .6);
    if (fluttuante) {
      // nascosto in apertura e quando si arriva ai contatti
      const contatti = document.getElementById('contatti').getBoundingClientRect().top;
      fluttuante.classList.toggle('visibile', y > innerHeight * .8 && contatti > innerHeight * .5);
    }
    if (letto) letto.style.setProperty('--letto', (y / Math.max(1, doc.scrollHeight - innerHeight)).toFixed(4));
    if (sfondoNumeri && !fermo()) {
      const r = sfondoNumeri.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) sfondoNumeri.style.setProperty('--sx', `${(r.top - innerHeight) * .5}px`);
    }
  };
  addEventListener('scroll', aggiornaScorrimento, { passive: true });
  aggiornaScorrimento();

  /* Menu su telefono */
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('menu');
  if (hamburger && menu) {
    const chiudi = () => {
      if (!menu.classList.contains('aperto')) return;
      menu.classList.remove('aperto');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Apri il menu');
      document.body.style.overflow = '';
    };
    hamburger.addEventListener('click', () => {
      const aperto = menu.classList.toggle('aperto');
      hamburger.setAttribute('aria-expanded', String(aperto));
      hamburger.setAttribute('aria-label', aperto ? 'Chiudi il menu' : 'Apri il menu');
      document.body.style.overflow = aperto ? 'hidden' : '';
      if (aperto) setTimeout(() => menu.querySelector('a').focus(), 50);
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', chiudi));
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('aperto')) { chiudi(); hamburger.focus(); }
    });
  }

  /* Comparsa degli elementi durante lo scorrimento, a cascata */
  const rivela = document.querySelectorAll('.rivela');
  if ('IntersectionObserver' in window && !fermo()) {
    const osservatore = new IntersectionObserver(voci => {
      voci.forEach(v => {
        if (!v.isIntersecting) return;
        const fratelli = [...v.target.parentElement.children].filter(el => el.classList.contains('rivela'));
        v.target.style.setProperty('--ritardo', `${fratelli.indexOf(v.target) * 0.1}s`);
        v.target.classList.add('visibile');
        osservatore.unobserve(v.target);
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    rivela.forEach(el => osservatore.observe(el));
  } else {
    rivela.forEach(el => el.classList.add('visibile'));
  }

  /* Contatori */
  const contatori = document.querySelectorAll('[data-conta]');
  const conta = el => {
    const fine = +el.dataset.conta;
    if (fermo()) { el.textContent = fine; return; }
    el.textContent = 0;
    const durata = 1600, inizio = performance.now();
    const passo = t => {
      const p = Math.min((t - inizio) / durata, 1);
      el.textContent = Math.round(fine * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };
  if ('IntersectionObserver' in window) {
    const oc = new IntersectionObserver(voci => voci.forEach(v => {
      if (v.isIntersecting) { conta(v.target); oc.unobserve(v.target); }
    }), { threshold: .6 });
    contatori.forEach(el => oc.observe(el));
  } else {
    contatori.forEach(el => { el.textContent = el.dataset.conta; });
  }

  /* Linea dei passi che si riempie scorrendo */
  const passi = document.querySelector('.passi-percorso');
  if (passi && !movimentoRidotto) {
    const aggiornaPassi = () => {
      const r = passi.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * .75 - r.top) / (r.height + innerHeight * .2), 0), 1);
      passi.style.setProperty('--avanzamento', p.toFixed(3));
    };
    addEventListener('scroll', aggiornaPassi, { passive: true });
    aggiornaPassi();
  }

  /* Voce di menu attiva */
  const voci = [...document.querySelectorAll('.menu a')];
  if ('IntersectionObserver' in window) {
    const os = new IntersectionObserver(el => el.forEach(v => {
      if (!v.isIntersecting) return;
      voci.forEach(a => a.classList.toggle('attivo', a.getAttribute('href') === `#${v.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    voci.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) os.observe(s); });
  }

  /* Schede dei servizi: inclinazione e luce che segue il mouse */
  if (!movimentoRidotto && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-inclina]').forEach(card => {
      card.addEventListener('pointermove', e => {
        if (fermo()) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(.5 - y) * 6}deg) rotateY(${(x - .5) * 6}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* Mappa caricata solo su richiesta (niente cookie di Google prima del consenso) */
  const caricaMappa = document.querySelector('.mappa__carica');
  if (caricaMappa) {
    caricaMappa.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = caricaMappa.dataset.src;
      f.title = 'Mappa: Via Mera 25, Monza';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      caricaMappa.replaceWith(f);
    });
  }

  /* Modulo contatti */
  const modulo = document.getElementById('modulo');
  if (modulo) {
    const esito = document.getElementById('esito');
    const mostra = (testo, tipo) => { esito.textContent = testo; esito.className = `modulo__esito ${tipo}`; };

    modulo.addEventListener('submit', async e => {
      e.preventDefault();
      const sbagliati = [];
      const segna = (campo, ok) => {
        (campo.closest('.campo') || campo.closest('.campo-consenso')).classList.toggle('errore', !ok);
        campo.setAttribute('aria-invalid', String(!ok));
        if (!ok) sbagliati.push(campo);
      };
      modulo.querySelectorAll('[required]').forEach(c => {
        segna(c, c.type === 'checkbox' ? c.checked : c.value.trim() !== '' && c.checkValidity());
      });
      const email = modulo.email;
      if (email.value) segna(email, email.checkValidity());
      if (sbagliati.length) {
        const nomi = sbagliati.map(c => c.type === 'checkbox' ? 'consenso privacy'
          : modulo.querySelector(`label[for="${c.id}"]`).textContent.replace('*', '').trim().toLowerCase());
        mostra(`Da completare o correggere: ${nomi.join(', ')}.`, 'ko');
        sbagliati[0].focus();
        return;
      }

      modulo.classList.add('invio');
      mostra('Invio in corso…', '');
      try {
        const r = await fetch(modulo.action, {
          method: 'POST',
          body: new FormData(modulo),
          headers: { Accept: 'application/json' }
        });
        const dati = await r.json().catch(() => null);
        if (!r.ok || !dati || !dati.ok) throw new Error(dati && dati.errore || 'invio non riuscito');
        modulo.reset();
        mostra('Grazie! Abbiamo ricevuto la tua richiesta: ti ricontattiamo al più presto.', 'ok');
      } catch (err) {
        mostra('Non è stato possibile inviare il messaggio. Chiamaci al 338 909 8999 o scrivi ad agliata.sas@tiscali.it.', 'ko');
      } finally {
        modulo.classList.remove('invio');
      }
    });

    modulo.addEventListener('input', e => {
      (e.target.closest('.campo') || e.target.closest('.campo-consenso'))?.classList.remove('errore');
      e.target.removeAttribute('aria-invalid');
    });
  }

  /* Profondità: le foto di "Chi siamo" scorrono a velocità diverse */
  const parallasse = [...document.querySelectorAll('[data-parallasse]')];
  if (parallasse.length && !movimentoRidotto) {
    const aggiornaParallasse = () => {
      if (fermo()) return;
      parallasse.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const spostamento = (r.top + r.height / 2 - innerHeight / 2) * +el.dataset.parallasse;
        el.querySelector('img').style.transform = `translateY(${spostamento.toFixed(1)}px) scale(1.12)`;
      });
    };
    addEventListener('scroll', aggiornaParallasse, { passive: true });
    aggiornaParallasse();
  }

  /* Galleria: visore a tutto schermo con frecce e tastiera */
  const visore = document.getElementById('visore');
  const fotoGalleria = [...document.querySelectorAll('.galleria__voce')];
  if (visore && fotoGalleria.length && visore.showModal) {
    const img = visore.querySelector('img');
    const didascalia = visore.querySelector('figcaption');
    let attuale = 0;
    const mostraFoto = i => {
      attuale = (i + fotoGalleria.length) % fotoGalleria.length;
      const v = fotoGalleria[attuale];
      img.src = v.dataset.grande;
      img.alt = v.querySelector('img').alt;
      didascalia.textContent = v.querySelector('span').textContent;
    };
    fotoGalleria.forEach((v, i) => v.addEventListener('click', () => { mostraFoto(i); visore.showModal(); }));
    visore.querySelector('.visore__chiudi').addEventListener('click', () => visore.close());
    visore.querySelector('.visore__freccia--prec').addEventListener('click', () => mostraFoto(attuale - 1));
    visore.querySelector('.visore__freccia--succ').addEventListener('click', () => mostraFoto(attuale + 1));
    visore.addEventListener('click', e => { if (e.target === visore) visore.close(); });
    visore.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') mostraFoto(attuale - 1);
      if (e.key === 'ArrowRight') mostraFoto(attuale + 1);
    });
    let inizioX = null;
    visore.addEventListener('touchstart', e => { inizioX = e.touches[0].clientX; }, { passive: true });
    visore.addEventListener('touchend', e => {
      if (inizioX === null) return;
      const dx = e.changedTouches[0].clientX - inizioX;
      if (Math.abs(dx) > 50) mostraFoto(attuale + (dx < 0 ? 1 : -1));
      inizioX = null;
    });
  }

  /* Foto dell'apertura che segue un poco il mouse */
  const apertura = document.querySelector('.apertura');
  const fotoApertura = document.querySelector('.apertura__foto');
  if (apertura && fotoApertura && matchMedia('(hover: hover)').matches) {
    apertura.addEventListener('pointermove', e => {
      if (fermo()) return;
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      fotoApertura.style.setProperty('--fx', `${(-x * 22).toFixed(1)}px`);
      fotoApertura.style.setProperty('--fy', `${(-y * 16).toFixed(1)}px`);
    });
  }

  /* Pulsanti calamitati */
  if (matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-calamita]').forEach(b => {
      b.addEventListener('pointermove', e => {
        if (fermo()) return;
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${(x * .18).toFixed(1)}px, ${(y * .3).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* Il carro gru arriva in retromarcia con la scritta Agliata appesa, la cala al suo posto e riparte */
  const nome = document.querySelector('.nome');
  const carro = document.querySelector('.carro');
  const titolo = document.querySelector('.apertura__titolo');
  const mostraNome = () => nome && nome.removeAttribute('data-attesa');
  if (nome && carro && titolo && !fermo() && carro.animate) {
    const logo = nome.querySelector('.nome__logo');
    const avvia = () => {
      const F = parseFloat(getComputedStyle(titolo).fontSize);
      const rt = titolo.getBoundingClientRect();
      const rl = logo.getBoundingClientRect();
      const L = rl.width, H = rl.height;
      const base = nome.querySelector('.nome__base').getBoundingClientRect().top - rt.top;
      const centro = rl.left + L / 2 - rt.left;
      const cimaLogo = rl.top - rt.top;

      // scala del disegno (viewBox 560 x 300): il cassone (x = 288) deve restare a destra della scritta
      const s = Math.max(1.7 * F / 200, (L / 2 + .2 * F) / 276);
      // il carro poggia sulla linea di base, con la puleggia (x = 12) sopra il centro della scritta
      const sx = centro - 12 * s, sy = base - 296 * s;
      Object.assign(carro.style, { left: `${sx}px`, top: `${sy}px`, width: `${560 * s}px`, height: `${300 * s}px` });
      const cavo = carro.querySelector('.carro__cavo');
      Object.assign(cavo.style, { left: `${12 * s}px`, top: `${14 * s}px`, width: `${Math.max(3, 3.5 * s)}px` });
      const altGancio = 36 * s;
      Object.assign(carro.querySelector('.carro__gancio').style, { width: `${26 * s}px`, height: `${altGancio}px` });

      // due funi dal gancio alle estremità della scritta: la punta della A con la gru e l'ultima A
      const alzata = .35 * F;                        // quanto resta sollevata durante il viaggio
      const altFuni = .3 * F;                        // altezza del gancio sopra la cima dell'immagine
      const funi = carro.querySelector('.carro__funi');
      Object.assign(funi.style, { top: `calc(100% + ${altGancio - 4}px)`, width: '1px', height: '1px' });
      const [funeSx, funeDx] = funi.querySelectorAll('line');
      [[funeSx, .23 * L - L / 2, altFuni + .09 * H], [funeDx, .94 * L - L / 2, altFuni + .55 * H]].forEach(([fune, x, y]) => {
        fune.setAttribute('x1', 0); fune.setAttribute('y1', 0); fune.setAttribute('x2', x); fune.setAttribute('y2', y);
      });
      logo.style.transformOrigin = `50% ${-altFuni}px`;

      const cimaFuni = cimaLogo - alzata - altFuni; // dove sta il gancio con la scritta sollevata
      const cavoCorto = Math.max(cimaFuni - (sy + 14 * s) - (altGancio - 4), .1 * F);
      const cavoLungo = cavoCorto + alzata;
      const distanza = innerWidth - (rt.left + sx) + 40;

      const ingresso = 1600, pausa = 150, discesa = 700, sgancio = 400, uscita = 1200, inizio = 650;
      const tPosa = inizio + ingresso + pausa;
      const tVia = tPosa + discesa + sgancio;
      const arrivo = 'cubic-bezier(.15,.7,.25,1)', partenza = 'cubic-bezier(.5,0,.8,.4)';
      const opz = (durata, ritardo, easing = 'ease-in-out') => ({ duration: durata, delay: ritardo, easing, fill: 'both' });
      const dopo = (durata, ritardo, easing) => ({ duration: durata, delay: ritardo, easing, fill: 'forwards' });

      carro.classList.add('attivo');
      mostraNome();

      const animazioni = [
        // carro: arriva in retromarcia
        carro.animate([{ transform: `translateX(${distanza}px)` }, { transform: 'translateX(0)' }], opz(ingresso, inizio, arrivo)),
        // scritta: viaggia appesa e dondola appena
        nome.animate([{ transform: `translate(${distanza}px, ${-alzata}px)` }, { transform: `translate(0, ${-alzata}px)` }], opz(ingresso, inizio, arrivo)),
        logo.animate(
          [{ transform: 'rotate(0)' }, { transform: 'rotate(3deg)', offset: .35 }, { transform: 'rotate(-2deg)', offset: .7 }, { transform: 'rotate(1deg)', offset: .85 }, { transform: 'rotate(0)' }],
          opz(ingresso + 500, inizio, 'ease-out')),
        // cavo e scritta scendono con gli stessi tempi e la stessa curva, così funi e gancio restano attaccati
        cavo.animate([{ height: `${cavoCorto}px` }, { height: `${cavoLungo + .03 * F}px`, offset: .82 }, { height: `${cavoLungo}px` }], opz(discesa, tPosa, 'ease-in')),
        nome.animate([{ transform: `translate(0, ${-alzata}px)` }, { transform: `translate(0, ${.03 * F}px)`, offset: .82 }, { transform: 'translate(0, 0)' }], dopo(discesa, tPosa, 'ease-in')),
        // sgancio: il cavo si riavvolge portandosi via le funi
        cavo.animate([{ height: `${cavoLungo}px` }, { height: `${cavoCorto * .4}px` }], dopo(sgancio, tPosa + discesa, 'ease-in'))
      ];
      const via = carro.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${distanza}px)` }], dopo(uscita, tVia, partenza));
      animazioni.push(via);

      // ruote: girano all'indietro all'arrivo, in avanti alla partenza
      const giri = distanza / (17 * s) * 180 / Math.PI;
      carro.querySelectorAll('.carro__ruota').forEach(r => {
        animazioni.push(r.animate([{ transform: `rotate(${giri}deg)` }, { transform: 'rotate(0)' }], opz(ingresso, inizio, arrivo)));
        animazioni.push(r.animate([{ transform: 'rotate(0)' }, { transform: `rotate(${giri}deg)` }], dopo(uscita, tVia, partenza)));
      });

      // a fine scena: nessuna animazione rimasta attiva, scritta nella sua posizione normale
      const chiudi = () => { animazioni.forEach(a => a.cancel()); carro.classList.remove('attivo'); };
      via.finished.then(chiudi, () => {});

      // se il visitatore ferma le animazioni a metà, si salta alla fine
      pulsantiFerma.forEach(b => b.addEventListener('click', () => { if (doc.classList.contains('ferme')) chiudi(); }));
    };
    const caratteri = document.fonts ? document.fonts.ready : Promise.resolve();
    const immagine = logo.complete ? Promise.resolve() : new Promise(r => { logo.onload = r; logo.onerror = r; });
    Promise.all([caratteri, immagine]).then(() => requestAnimationFrame(avvia));
  } else {
    mostraNome();
  }

  /* Anno nel piè di pagina */
  const anno = document.getElementById('anno');
  if (anno) anno.textContent = new Date().getFullYear();
})();
