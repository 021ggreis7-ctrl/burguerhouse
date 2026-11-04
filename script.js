'use strict';

/* ===== CONFIGURAÇÕES (fáceis de alterar) ===== */
const WHATSAPP_NUMBER = '5592985218645';
const HORARIO = { abre: '18:00', fecha: '23:30' }; // horário exibido e usado no indicador
const STORAGE_KEY = 'burguerhouse_cart_v1';

const IMG = 'public/images/';
const CATEGORIAS = [
  { id: 'hamburgueres', nome: 'Hambúrgueres', emoji: '🍔' },
  { id: 'acompanhamentos', nome: 'Acompanhamentos', emoji: '🍟' },
  { id: 'bebidas', nome: 'Bebidas', emoji: '🥤' }
];

// Preços em centavos (evita erros de arredondamento)
const PRODUTOS = [
  { id: 1, cat: 'hamburgueres', nome: 'X-Burguer', preco: 1990, img: '5C24F9E7-1A93-423F-8C48-1B32E0D197DE.jpeg', desc: 'Hambúrguer bovino grelhado, queijo derretido, alface, tomate e maionese da casa.' },
  { id: 2, cat: 'hamburgueres', nome: 'X-Bacon', preco: 2490, img: '39536F5C-58D3-4883-87F2-73007AF4B2E3.jpeg', desc: 'Carne suculenta, queijo, bacon crocante e molho especial no pão macio.' },
  { id: 3, cat: 'hamburgueres', nome: 'Smash Burger', preco: 2290, img: '5E0940B6-E946-4101-9103-BB61FBB62AAE.jpeg', desc: 'Carne amassada na chapa com borda crocante, queijo e picles.' },
  { id: 4, cat: 'hamburgueres', nome: 'Chicken Burger', preco: 2190, img: 'FCBFD300-A72F-4257-B2CE-41F647D231CF.jpeg', desc: 'Frango empanado e crocante, queijo, alface e molho cremoso.' },
  { id: 5, cat: 'acompanhamentos', nome: 'Batata Frita', preco: 1200, img: 'F257E625-1BD4-4C62-897C-26D96BAAD0F0.jpeg', desc: 'Porção de batatas douradas, sequinhas e crocantes.' },
  { id: 6, cat: 'acompanhamentos', nome: 'Onion Rings', preco: 1400, img: 'D7DA0C15-5B24-415C-AD9A-884D0D1FF3C7.jpeg', desc: 'Anéis de cebola empanados, fritos na hora.' },
  { id: 7, cat: 'bebidas', nome: 'Refrigerante', preco: 700, img: '8B1A0286-4E52-4A77-928B-AB823EB09D3E.jpeg', desc: 'Gelado, para acompanhar o seu lanche.' },
  { id: 8, cat: 'bebidas', nome: 'Milk-shake', preco: 1500, img: 'B216B3C3-9DDA-44E5-A2D1-2C0378382EDE.jpeg', desc: 'Cremoso e bem gelado, batido na hora.' }
];

const ADICIONAIS = [
  { id: 'bacon', nome: 'Bacon extra', preco: 500 },
  { id: 'queijo', nome: 'Queijo extra', preco: 400 },
  { id: 'molho', nome: 'Molho especial', preco: 300 }
];

/* ===== UTILITÁRIOS ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const brl = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');
const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const prod = id => PRODUTOS.find(p => p.id === id);
const addon = id => ADICIONAIS.find(a => a.id === id);
const catOf = p => CATEGORIAS.find(c => c.id === p.cat);

/* ===== ESTADO ===== */
let cart = [];
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (Array.isArray(saved)) cart = saved.filter(i => prod(i.pid) && i.qty > 0 && (i.adds || []).every(addon));
} catch (e) { cart = []; }

const saveCart = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {} };
const unitPrice = i => prod(i.pid).preco + (i.adds || []).reduce((s, a) => s + addon(a).preco, 0);
const lineTotal = i => unitPrice(i) * i.qty;
const cartTotal = () => cart.reduce((s, i) => s + lineTotal(i), 0);
const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);

/* ===== CARDÁPIO ===== */
function renderMenu() {
  $('#menu').innerHTML = CATEGORIAS.map(c => `
    <section class="category" id="${c.id}">
      <h2>${c.nome}</h2>
      <div class="grid">
        ${PRODUTOS.filter(p => p.cat === c.id).map(p => `
          <article class="card">
            <div class="card__img"><img src="${IMG + p.img}" alt="${esc(p.nome)}" loading="lazy" width="640" height="440"></div>
            <div class="card__body">
              <h3 class="card__title">${esc(p.nome)}</h3>
              <p class="card__desc">${esc(p.desc)}</p>
              <div class="card__foot">
                <span class="price">${brl(p.preco)}</span>
                <button class="add" data-add="${p.id}">Adicionar</button>
              </div>
            </div>
          </article>`).join('')}
      </div>
    </section>`).join('');
}

/* ===== MODAIS ===== */
function openOverlay(id) {
  const el = $('#' + id);
  el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
}
function closeOverlay(id) {
  const el = $('#' + id);
  el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');
  if (!$('.overlay.open')) document.body.classList.remove('lock');
}

/* ===== PERSONALIZAÇÃO ===== */
let custom = null; // { pid, qty }
function openCustom(pid) {
  const p = prod(pid);
  custom = { pid, qty: 1 };
  $('#customImg').src = IMG + p.img;
  $('#customImg').alt = p.nome;
  $('#customTitle').textContent = p.nome;
  $('#customDesc').textContent = p.desc;
  $('#customNote').value = '';
  $('#addonList').innerHTML = ADICIONAIS.map(a => `
    <label class="addon">
      <input type="checkbox" value="${a.id}">
      <span>${a.nome}</span><b>+ ${brl(a.preco)}</b>
    </label>`).join('');
  updateCustomTotal();
  openOverlay('customOverlay');
}
const selectedAdds = () => $$('#addonList input:checked').map(i => i.value);
function updateCustomTotal() {
  const p = prod(custom.pid);
  const unit = p.preco + selectedAdds().reduce((s, a) => s + addon(a).preco, 0);
  $('#cQty').textContent = custom.qty;
  $('#customTotal').textContent = brl(unit * custom.qty);
}

/* ===== CARRINHO ===== */
function addToCart(pid, qty = 1, adds = [], note = '') {
  adds = [...adds].sort();
  note = note.trim();
  const found = cart.find(i => i.pid === pid && i.note === note && i.adds.join() === adds.join());
  if (found) found.qty += qty;
  else cart.push({ uid: Date.now() + Math.random(), pid, qty, adds, note });
  saveCart(); renderCart();
  const btn = $('#cartCount').closest('.cart-btn');
  btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  toast(`${prod(pid).nome} adicionado ao carrinho`);
}

function renderCart() {
  const count = cartCount(), total = cartTotal(), has = count > 0;
  $('#cartCount').textContent = count;
  $('#fabCount').textContent = count;
  $('#fabTotal').textContent = brl(total);
  $('#fab').hidden = !has;
  $('#cartEmpty').hidden = has;
  $('#checkout').hidden = !has;
  $('#cartFoot').hidden = !has;
  $('#subtotal').textContent = brl(total);
  $('#total').textContent = brl(total);
  $('#cartList').innerHTML = cart.map(i => {
    const p = prod(i.pid);
    const meta = [
      i.adds.length ? 'Adicionais: ' + i.adds.map(a => addon(a).nome).join(', ') : '',
      i.note ? 'Obs: ' + esc(i.note) : ''
    ].filter(Boolean).join('<br>');
    return `<li class="ci">
      <img src="${IMG + p.img}" alt="${esc(p.nome)}">
      <div>
        <div class="ci__top"><span>${esc(p.nome)}</span><b>${brl(lineTotal(i))}</b></div>
        <div class="ci__meta">${brl(unitPrice(i))} cada${meta ? '<br>' + meta : ''}</div>
      </div>
      <div class="ci__ctrl">
        <div class="qty">
          <button data-dec="${i.uid}" aria-label="Diminuir quantidade">−</button><b>${i.qty}</b><button data-inc="${i.uid}" aria-label="Aumentar quantidade">+</button>
        </div>
        <button class="ci__rm" data-rm="${i.uid}">Remover</button>
      </div>
    </li>`;
  }).join('');
}

const byUid = uid => cart.find(i => String(i.uid) === uid);
function changeQty(uid, d) {
  const i = byUid(uid); if (!i) return;
  i.qty += d;
  if (i.qty <= 0) cart = cart.filter(x => x !== i);
  saveCart(); renderCart();
}

/* ===== FINALIZAÇÃO ===== */
const tipo = () => $('input[name="tipo"]:checked').value;
function toggleAddr() { $('#addrField').hidden = tipo() !== 'Entrega'; }

function validate() {
  let ok = true;
  const set = (fieldEl, errEl, msg) => {
    fieldEl.classList.toggle('invalid', !!msg);
    errEl.textContent = msg || '';
    if (msg) ok = false;
  };
  const name = $('#cName').value.trim();
  set($('#cName').closest('.field'), $('#eName'), name.length < 2 ? 'Informe seu nome.' : '');
  const addr = $('#cAddr').value.trim();
  set($('#addrField'), $('#eAddr'), tipo() === 'Entrega' && addr.length < 8 ? 'Informe o endereço completo para entrega.' : '');
  if (!ok) { const bad = $('.field.invalid input, .field.invalid textarea'); if (bad) bad.focus(); }
  return ok;
}

function buildMessage() {
  const L = ['Olá, tudo bem? Gostaria de fazer o seguinte pedido:', ''];
  L.push(`Cliente: ${$('#cName').value.trim()}`);
  L.push(`Tipo de pedido: ${tipo()}`);
  if (tipo() === 'Entrega') L.push(`Endereço: ${$('#cAddr').value.trim()}`);
  L.push('');
  cart.forEach(i => {
    const p = prod(i.pid);
    L.push(`${catOf(p).emoji} ${i.qty}x ${p.nome} - ${brl(lineTotal(i))}`);
    if (i.adds.length) L.push(`   Adicionais: ${i.adds.map(a => `${addon(a).nome} (+${brl(addon(a).preco)})`).join(', ')}`);
    if (i.note) L.push(`   Obs: ${i.note}`);
  });
  L.push('');
  L.push(`Total: ${brl(cartTotal())}`);
  const gen = $('#cNote').value.trim();
  if (gen) L.push('', `Observações: ${gen}`);
  L.push('', 'Gostaria de confirmar a disponibilidade e finalizar meu pedido. Poderiam me ajudar?');
  return L.join('\n');
}

function finish() {
  if (!cart.length) return toast('Seu carrinho está vazio');
  if (!validate()) return;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`;
  window.open(url, '_blank', 'noopener');
}

/* ===== STATUS DE FUNCIONAMENTO ===== */
function updateStatus() {
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
  const a = toMin(HORARIO.abre), f = toMin(HORARIO.fecha);
  const open = a <= f ? cur >= a && cur < f : cur >= a || cur < f;
  $('#status').classList.toggle('open', open);
  $('#statusText').textContent = open ? 'Aberto agora' : `Abre às ${HORARIO.abre}`;
  $('#footerHours').textContent = `Todos os dias, das ${HORARIO.abre} às ${HORARIO.fecha}.`;
}

/* ===== TOAST ===== */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ===== NAVEGAÇÃO: destaque da categoria ativa ===== */
function setupScrollSpy() {
  if (!('IntersectionObserver' in window)) return;
  const links = $$('.nav a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  $$('.category').forEach(s => io.observe(s));
}

/* ===== EVENTOS ===== */
document.addEventListener('click', e => {
  const t = e.target.closest('button, .overlay');
  if (!t) return;

  if (t.dataset.add) {
    const pid = Number(t.dataset.add);
    if (prod(pid).cat === 'hamburgueres') return openCustom(pid);
    addToCart(pid);
    t.classList.add('done'); t.textContent = 'Adicionado ✓';
    setTimeout(() => { t.classList.remove('done'); t.textContent = 'Adicionar'; }, 1200);
    return;
  }
  if (t.dataset.close) return closeOverlay(t.dataset.close);
  if (t.classList.contains('overlay') && e.target === t) return closeOverlay(t.id);
  if (t.dataset.inc) return changeQty(t.dataset.inc, 1);
  if (t.dataset.dec) return changeQty(t.dataset.dec, -1);
  if (t.dataset.rm) { const i = byUid(t.dataset.rm); if (i) { cart = cart.filter(x => x !== i); saveCart(); renderCart(); toast('Item removido'); } return; }

  switch (t.id) {
    case 'openCart': case 'fab': openOverlay('cartOverlay'); break;
    case 'cQtyMinus': if (custom.qty > 1) { custom.qty--; updateCustomTotal(); } break;
    case 'cQtyPlus': if (custom.qty < 20) { custom.qty++; updateCustomTotal(); } break;
    case 'customAdd':
      addToCart(custom.pid, custom.qty, selectedAdds(), $('#customNote').value);
      closeOverlay('customOverlay'); break;
    case 'finish': finish(); break;
    case 'clearCart':
      if (confirm('Deseja esvaziar o carrinho?')) { cart = []; saveCart(); renderCart(); } break;
  }
});

$('#addonList').addEventListener('change', updateCustomTotal);
$$('input[name="tipo"]').forEach(r => r.addEventListener('change', toggleAddr));
$('#checkout').addEventListener('submit', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') $$('.overlay.open').forEach(o => closeOverlay(o.id));
});

/* ===== INICIALIZAÇÃO ===== */
renderMenu();
renderCart();
toggleAddr();
updateStatus();
setInterval(updateStatus, 60000);
setupScrollSpy();
