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

  /* Il carro gru arriva in retromarcia, cala "noi." al suo posto e riparte */
  const noi = document.querySelector('.noi');
  const carro = document.querySelector('.carro');
  const titolo = document.querySelector('.apertura__titolo');
  const mostraNoi = () => noi && noi.removeAttribute('data-attesa');
  if (noi && carro && titolo && !fermo() && carro.animate) {
    const avvia = () => {
      const F = parseFloat(getComputedStyle(titolo).fontSize);
      const s = 1.7 * F / 200;                       // scala del disegno (viewBox 400 x 200)
      const rt = titolo.getBoundingClientRect();
      const rn = noi.getBoundingClientRect();
      const base = noi.querySelector('.noi__base').getBoundingClientRect().top - rt.top;
      const centro = rn.left + rn.width / 2 - rt.left;

      // il carro poggia sulla linea di base, con la puleggia (x = 12) sopra il centro di "noi."
      const sx = centro - 12 * s, sy = base - 192 * s;
      Object.assign(carro.style, { left: `${sx}px`, top: `${sy}px`, width: `${400 * s}px`, height: `${200 * s}px` });
      const cavo = carro.querySelector('.carro__cavo');
      Object.assign(cavo.style, { left: `${12 * s}px`, top: `${14 * s}px`, width: `${Math.max(3, 3.5 * s)}px` });
      Object.assign(carro.querySelector('.carro__gancio').style, { width: `${26 * s}px`, height: `${36 * s}px` });

      const alzata = .45 * F;                        // quanto "noi." resta sollevato durante il viaggio
      const cimaNoi = base - .72 * F - alzata;       // cima delle lettere sollevate
      const cavoCorto = Math.max(cimaNoi - (sy + 14 * s) - 30 * s, .1 * F);
      const cavoLungo = cavoCorto + alzata;
      const distanza = innerWidth - (rt.left + sx) + 40;

      const ingresso = 1500, pausa = 150, discesa = 650, sgancio = 350, uscita = 1100, inizio = 650;
      const tPosa = inizio + ingresso + pausa;
      const tVia = tPosa + discesa + sgancio;
      const opz = (durata, ritardo, easing = 'ease-in-out') => ({ duration: durata, delay: ritardo, easing, fill: 'both' });

      carro.classList.add('attivo');
      mostraNoi();

      const animazioni = [
        // carro: arriva in retromarcia e se ne va
        carro.animate([{ transform: `translateX(${distanza}px)` }, { transform: 'translateX(0)' }], opz(ingresso, inizio, 'cubic-bezier(.15,.7,.25,1)')),
        // "noi.": viaggia appeso, poi viene calato con un piccolo assestamento
        noi.animate([{ transform: `translate(${distanza}px, ${-alzata}px)` }, { transform: `translate(0, ${-alzata}px)` }], opz(ingresso, inizio, 'cubic-bezier(.15,.7,.25,1)')),
        noi.querySelector('.noi__testo').animate(
          [{ transform: 'rotate(0)' }, { transform: 'rotate(7deg)', offset: .35 }, { transform: 'rotate(-5deg)', offset: .7 }, { transform: 'rotate(3deg)', offset: .85 }, { transform: 'rotate(0)' }],
          opz(ingresso + 500, inizio, 'ease-out')),
        // cavo: si allunga mentre cala la parola, poi si riavvolge
        // stessi tempi e stessa curva della discesa di "noi.", così il gancio resta attaccato
        cavo.animate([{ height: `${cavoCorto}px` }, { height: `${cavoLungo + .03 * F}px`, offset: .82 }, { height: `${cavoLungo}px` }], opz(discesa, tPosa, 'ease-in')),
        cavo.animate([{ height: `${cavoLungo}px` }, { height: `${cavoCorto * .5}px` }], { duration: sgancio, delay: tPosa + discesa, easing: 'ease-in', fill: 'forwards' })
      ];
      animazioni.push(noi.animate(
        [{ transform: `translate(0, ${-alzata}px)` }, { transform: `translate(0, ${.03 * F}px)`, offset: .82 }, { transform: 'translate(0, 0)' }],
        { duration: discesa, delay: tPosa, easing: 'ease-in', fill: 'forwards' }));
      const via = carro.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${distanza}px)` }], { duration: uscita, delay: tVia, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
      animazioni.push(via);

      // ruote: girano all'indietro all'arrivo, in avanti alla partenza
      const giri = distanza / (17 * s) * 180 / Math.PI;
      carro.querySelectorAll('.carro__ruota').forEach(r => {
        animazioni.push(r.animate([{ transform: `rotate(${giri}deg)` }, { transform: 'rotate(0)' }], opz(ingresso, inizio, 'cubic-bezier(.15,.7,.25,1)')));
        animazioni.push(r.animate([{ transform: 'rotate(0)' }, { transform: `rotate(${giri}deg)` }], { duration: uscita, delay: tVia, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }));
      });

      // a fine scena: niente animazioni rimaste attive, "noi." nella sua posizione normale
      via.finished.then(() => {
        animazioni.forEach(a => a.cancel());
        carro.classList.remove('attivo');
      });

      // se il visitatore ferma le animazioni a metà, si salta alla fine
      pulsantiFerma.forEach(b => b.addEventListener('click', () => {
        if (doc.classList.contains('ferme')) { animazioni.forEach(a => a.cancel()); carro.classList.remove('attivo'); }
      }));
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(avvia));
  } else {
    mostraNoi();
  }

  /* Anno nel piè di pagina */
  const anno = document.getElementById('anno');
  if (anno) anno.textContent = new Date().getFullYear();
})();
