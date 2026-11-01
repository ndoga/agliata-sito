/* Agliata Soccorso Stradale – interazioni e animazioni */
(() => {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');
  const movimentoRidotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Intestazione compatta e barra di chiamata dopo lo scorrimento */
  const testata = document.getElementById('testata');
  const barra = document.querySelector('.barra-chiama');
  const aggiornaScorrimento = () => {
    const y = scrollY;
    testata.classList.toggle('compatta', y > 40);
    if (barra) barra.classList.toggle('visibile', y > innerHeight * .6);
  };
  addEventListener('scroll', aggiornaScorrimento, { passive: true });
  aggiornaScorrimento();

  /* Menu su telefono */
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('menu');
  if (hamburger && menu) {
    const chiudi = () => {
      menu.classList.remove('aperto');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    hamburger.addEventListener('click', () => {
      const aperto = menu.classList.toggle('aperto');
      hamburger.setAttribute('aria-expanded', String(aperto));
      hamburger.setAttribute('aria-label', aperto ? 'Chiudi il menu' : 'Apri il menu');
      document.body.style.overflow = aperto ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', chiudi));
    addEventListener('keydown', e => { if (e.key === 'Escape') chiudi(); });
  }

  /* Comparsa degli elementi durante lo scorrimento, a cascata */
  const rivela = document.querySelectorAll('.rivela');
  if ('IntersectionObserver' in window && !movimentoRidotto) {
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
    if (movimentoRidotto) { el.textContent = fine; return; }
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
  const passi = document.querySelector('.passi');
  if (passi && !movimentoRidotto) {
    const aggiornaPassi = () => {
      const r = passi.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * .8 - r.top) / (r.height + innerHeight * .3), 0), 1);
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
      let valido = true;
      modulo.querySelectorAll('[required]').forEach(c => {
        const ok = c.type === 'checkbox' ? c.checked : c.value.trim() !== '' && c.checkValidity();
        c.closest('.campo')?.classList.toggle('errore', !ok);
        if (!ok) valido = false;
      });
      const email = modulo.email;
      if (email.value && !email.checkValidity()) { email.closest('.campo').classList.add('errore'); valido = false; }
      if (!valido) { mostra('Controlla i campi evidenziati e accetta l\'informativa.', 'ko'); return; }

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

    modulo.addEventListener('input', e => e.target.closest('.campo')?.classList.remove('errore'));
  }

  /* Anno nel piè di pagina */
  const anno = document.getElementById('anno');
  if (anno) anno.textContent = new Date().getFullYear();
})();
