import { useState, useEffect, useMemo, useRef } from 'react';

// ---------- persistence ----------
function useStore(key, initial){
  const [val, setVal] = useState(()=>{
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; }
    catch(e){ return initial; }
  });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }, [key, val]);
  return [val, setVal];
}
function uid(){ return Math.random().toString(36).slice(2,10); }
function fmtKZT(n){ return (Number(n)||0).toLocaleString('ru-RU') + ' ₸'; }
function todayISO(){ return new Date().toISOString().slice(0,10); }

// ---------- seed data ----------
const SEED = {
  outlets: [
    {id:'o1', name:'Duty Free — Терминал A', city:'Алматы'},
    {id:'o2', name:'Кофе-корнер — Терминал B', city:'Алматы'},
    {id:'o3', name:'Сувениры — Астана', city:'Астана'},
  ],
  employees: [
    {id:'e1', name:'Асель Нурланова', role:'Продавец', outletId:'o1', phone:'+7 701 111 22 33'},
    {id:'e2', name:'Тимур Бекенов', role:'Кассир', outletId:'o2', phone:'+7 701 222 33 44'},
    {id:'e3', name:'Гульмира Сатова', role:'Кладовщик', outletId:'o1', phone:'+7 701 333 44 55'},
    {id:'e4', name:'Данияр Оспанов', role:'Продавец', outletId:'o3', phone:'+7 701 444 55 66'},
    {id:'e5', name:'Айгерим Токтарова', role:'Управляющий', outletId:'o2', phone:'+7 701 555 66 77'},
  ],
  shifts: [
    {id:uid(), employeeId:'e1', date: todayISO(), hours:8, status:'подтверждена'},
    {id:uid(), employeeId:'e2', date: todayISO(), hours:7.5, status:'подтверждена'},
    {id:uid(), employeeId:'e3', date: todayISO(), hours:8, status:'на проверке'},
  ],
  products: [
    {id:'p1', sku:'DF-001', name:'Парфюм Chanel №5 50мл', outletId:'o1', qty:12, price:45000, cost:31000},
    {id:'p2', sku:'DF-002', name:'Виски Chivas 12 1л', outletId:'o1', qty:8, price:22000, cost:15500},
    {id:'p3', sku:'CF-010', name:'Кофе латте 300мл', outletId:'o2', qty:60, price:1500, cost:450},
    {id:'p4', sku:'CF-011', name:'Круассан', outletId:'o2', qty:34, price:1200, cost:400},
    {id:'p5', sku:'SV-020', name:'Магнит "Астана"', outletId:'o3', qty:120, price:1900, cost:600},
  ],
  sales: [
    {id:uid(), productId:'p3', outletId:'o2', qty:2, date: todayISO(), total:3000, source:'ручной ввод'},
    {id:uid(), productId:'p1', outletId:'o1', qty:1, date: todayISO(), total:45000, source:'ручной ввод'},
  ],
  tenants: [
    {id:'t1', name:'Ералы Сериков', iin:'990512300123', room:'204', phone:'+7 707 111 00 11', contractId:'c1'},
    {id:'t2', name:'Мадина Абенова', iin:'000203400456', room:'118', phone:'+7 707 222 00 22', contractId:'c2'},
  ],
  contracts: [
    {id:'c1', tenantId:'t1', room:'204', start: '2026-09-01', end:'2027-06-30', rent:35000, status:'действует'},
    {id:'c2', tenantId:'t2', room:'118', start: '2026-09-01', end:'2027-06-30', rent:35000, status:'действует'},
  ],
  payments: [
    {id:uid(), tenantId:'t1', date:'2026-09-05', amount:35000, method:'Kaspi Pay', status:'оплачено'},
    {id:uid(), tenantId:'t2', date:'2026-09-05', amount:20000, method:'Kaspi Pay', status:'частично'},
  ],
  documents: [
    {id:uid(), title:'Приказ о премировании — сентябрь', type:'Приказ', author:'Айгерим Токтарова', date: todayISO(), status:'на согласовании', steps:[
      {name:'Айгерим Токтарова', role:'Инициатор', status:'подписано'},
      {name:'HR-директор', role:'Согласующий', status:'ожидает'},
      {name:'Директор', role:'Утверждающий', status:'ожидает'},
    ]},
    {id:uid(), title:'Договор аренды — комната 204', type:'Договор (внешний)', author:'Система', date:'2026-09-01', status:'подписан', steps:[
      {name:'Ералы Сериков', role:'Арендатор', status:'подписано'},
      {name:'ADAL JASA GROUP', role:'Арендодатель', status:'подписано'},
    ]},
  ],
};

const ROLES = [
  {id:'admin', label:'Администратор'},
  {id:'accountant', label:'Бухгалтер'},
  {id:'manager', label:'Менеджер точки'},
  {id:'warehouse', label:'Кладовщик'},
  {id:'hr', label:'HR'},
];

const STAFF = [
  {id:'s1', name:'Данияр Ахметов', role:'Админ'},
  {id:'s2', name:'Марат Тулегенов', role:'Учредитель'},
  {id:'s3', name:'Ерболат Сагындыков', role:'Управляющий директор'},
  {id:'s4', name:'Джумадилова Раушан', role:'Директор'},
];

const DOC_TYPES = [
  {id:'sluzhebka', label:'Служебная записка', prefix:'СЗ', placeholder:'Например: О продлении рамочного договора с поставщиком', hasTo:true, hasAmount:false},
  {id:'zakupka', label:'Заявка на закупку', prefix:'ЗК', placeholder:'Например: Закупка кофе и одноразовой посуды на октябрь', hasTo:false, hasAmount:true},
  {id:'dokladnaya', label:'Докладная записка', prefix:'ДЗ', placeholder:'Например: О нарушении графика смен кассиром', hasTo:true, hasAmount:false},
  {id:'prikaz', label:'Приказ', prefix:'ПР', placeholder:'Например: О премировании сотрудников по итогам сентября', hasTo:false, hasAmount:false},
  {id:'akt', label:'Акт списания', prefix:'АС', placeholder:'Например: Списание товара с истёкшим сроком годности', hasTo:false, hasAmount:true},
];

const NAV = [
  {group:'Обзор', items:[
    {id:'dashboard', label:'Дашборд'},
  ]},
  {group:'Магазины', items:[
    {id:'warehouse', label:'Склад'},
    {id:'sales', label:'Продажи'},
    {id:'timesheet', label:'Табель'},
  ]},
  {group:'Общежитие', items:[
    {id:'tenants', label:'Жильцы'},
    {id:'contracts', label:'Договоры'},
    {id:'rentpayments', label:'Оплаты'},
  ]},
  {group:'СЭД', items:[
    {id:'documents', label:'Документы'},
  ]},
  {group:'Компания', items:[
    {id:'employees', label:'Сотрудники'},
  ]},
];

function Badge({children, tone='default'}){
  const map = {
    default:{bg:'rgba(139,147,160,.12)', fg:'var(--muted)'},
    good:{bg:'rgba(76,154,106,.14)', fg:'var(--good)'},
    bad:{bg:'rgba(192,86,74,.14)', fg:'var(--bad)'},
    accent:{bg:'rgba(217,164,65,.14)', fg:'var(--accent)'},
  };
  const s = map[tone]||map.default;
  return <span style={{background:s.bg, color:s.fg, padding:'3px 8px', fontSize:11.5, fontWeight:600, letterSpacing:'.01em'}}>{children}</span>;
}

function Stat({label, value, sub}){
  return (
    <div style={{borderLeft:'2px solid var(--accent)', paddingLeft:14, minWidth:160}}>
      <div style={{fontSize:11.5, color:'var(--muted)', marginBottom:6}}>{label}</div>
      <div className="num" style={{fontSize:24, fontWeight:600}}>{value}</div>
      {sub && <div style={{fontSize:11.5, color:'var(--muted-2)', marginTop:4}}>{sub}</div>}
    </div>
  );
}

function Panel({title, action, children}){
  return (
    <div style={{background:'var(--panel)', border:'1px solid var(--line)', marginBottom:20}}>
      {title && (
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--line)'}}>
          <div style={{fontSize:14, fontWeight:600}}>{title}</div>
          {action}
        </div>
      )}
      <div style={{padding: title ? '0' : '0'}}>{children}</div>
    </div>
  );
}

function Btn({children, onClick, tone='default', small}){
  const tones = {
    default:{bg:'var(--panel-2)', fg:'var(--text)', bd:'var(--line)'},
    accent:{bg:'var(--accent)', fg:'#1C1508', bd:'var(--accent)'},
    ghost:{bg:'transparent', fg:'var(--muted)', bd:'transparent'},
  };
  const t = tones[tone];
  return (
    <button onClick={onClick} style={{
      background:t.bg, color:t.fg, border:`1px solid ${t.bd}`,
      padding: small ? '5px 10px' : '8px 14px', fontSize: small ? 12.5 : 13.5, fontWeight:600,
      cursor:'pointer', whiteSpace:'nowrap'
    }}>{children}</button>
  );
}

function Field({label, children}){
  return (
    <label style={{display:'block', marginBottom:12}}>
      <div style={{fontSize:11.5, color:'var(--muted)', marginBottom:5}}>{label}</div>
      {children}
    </label>
  );
}
const inputStyle = {width:'100%', background:'var(--panel-2)', border:'1px solid var(--line)', color:'var(--text)', padding:'8px 10px', fontSize:13.5};

function Modal({title, onClose, children, width}){
  return (
    <div onClick={onClose} style={{position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--panel)', border:'1px solid var(--line)', width: width||440, maxWidth:'100%', maxHeight:'88vh', overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid var(--line)'}}>
          <div style={{fontWeight:600, fontSize:15}}>{title}</div>
          <button onClick={onClose} style={{background:'none', border:'none', color:'var(--muted)', fontSize:18, cursor:'pointer'}}>×</button>
        </div>
        <div style={{padding:16}}>{children}</div>
      </div>
    </div>
  );
}

function iinChecksum(iin){
  if(!/^\d{12}$/.test(iin)) return false;
  const digits = iin.split('').map(Number);
  const w1=[1,2,3,4,5,6,7,8,9,10,11];
  let sum = w1.reduce((a,w,i)=>a+w*digits[i],0);
  let c = sum % 11;
  if(c===10){
    const w2=[3,4,5,6,7,8,9,10,11,1,2];
    sum = w2.reduce((a,w,i)=>a+w*digits[i],0);
    c = sum % 11;
    if(c===10) return false;
  }
  return c === digits[11];
}

// ================= APP =================
function App(){
  const [page, setPage] = useState('dashboard');
  const [role, setRole] = useState('admin');
  const [navOpen, setNavOpen] = useState(false);

  const [outlets] = useStore('pf_outlets', SEED.outlets);
  const [employees, setEmployees] = useStore('pf_employees', SEED.employees);
  const [shifts, setShifts] = useStore('pf_shifts', SEED.shifts);
  const [products, setProducts] = useStore('pf_products', SEED.products);
  const [sales, setSales] = useStore('pf_sales', SEED.sales);
  const [tenants, setTenants] = useStore('pf_tenants', SEED.tenants);
  const [contracts, setContracts] = useStore('pf_contracts', SEED.contracts);
  const [payments, setPayments] = useStore('pf_payments', SEED.payments);
  const [documents, setDocuments] = useStore('pf_documents', SEED.documents);

  const outletName = id => outlets.find(o=>o.id===id)?.name || '—';
  const employeeName = id => employees.find(e=>e.id===id)?.name || '—';
  const productById = id => products.find(p=>p.id===id);
  const tenantName = id => tenants.find(t=>t.id===id)?.name || '—';

  const ctx = {outlets, employees, setEmployees, shifts, setShifts, products, setProducts, sales, setSales,
    tenants, setTenants, contracts, setContracts, payments, setPayments, documents, setDocuments,
    outletName, employeeName, productById, tenantName};

  const pageTitle = NAV.flatMap(g=>g.items).find(i=>i.id===page)?.label || '';

  return (
    <div style={{display:'flex', minHeight:'100vh'}}>
      {navOpen && <div onClick={()=>setNavOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:30}}/>}
      <div className={"sidebar" + (navOpen ? " open":"")} style={{width:230, background:'var(--panel)', borderRight:'1px solid var(--line)', padding:'20px 0', height:'100vh', overflowY:'auto', position: window.innerWidth<=860 ? 'fixed' : 'sticky', top:0}}>
        <div style={{padding:'0 18px 18px', borderBottom:'1px solid var(--line)', marginBottom:14}}>
          <div style={{fontSize:16, fontWeight:800, letterSpacing:'.01em'}}>БАКЫТ<span style={{color:'var(--accent)'}}>·</span>OPS</div>
          <div style={{fontSize:11, color:'var(--muted-2)', marginTop:3}}>Операционная платформа</div>
        </div>
        {NAV.map(g=>(
          <div key={g.group} style={{marginBottom:16}}>
            <div style={{padding:'0 18px', fontSize:10.5, color:'var(--muted-2)', marginBottom:6, letterSpacing:'.03em'}}>{g.group}</div>
            {g.items.map(it=>(
              <div key={it.id} onClick={()=>{setPage(it.id); setNavOpen(false);}} style={{
                padding:'8px 18px', cursor:'pointer', fontSize:13.5, fontWeight:500,
                color: page===it.id ? 'var(--text)' : 'var(--muted)',
                background: page===it.id ? 'var(--panel-2)' : 'transparent',
                borderLeft: page===it.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}>{it.label}</div>
            ))}
          </div>
        ))}
      </div>

      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'1px solid var(--line)', background:'var(--bg)', position:'sticky', top:0, zIndex:20}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <button onClick={()=>setNavOpen(true)} style={{display: 'none', background:'none', border:'none', color:'var(--text)'}} className="burger">☰</button>
            <div style={{fontSize:16, fontWeight:700}}>{pageTitle}</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <select value={role} onChange={e=>setRole(e.target.value)} style={{...inputStyle, width:'auto', fontSize:12.5, padding:'6px 8px'}}>
              {ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{padding:24}}>
          {page==='dashboard' && <Dashboard ctx={ctx} setPage={setPage} />}
          {page==='warehouse' && <Warehouse ctx={ctx} />}
          {page==='sales' && <Sales ctx={ctx} />}
          {page==='timesheet' && <Timesheet ctx={ctx} />}
          {page==='tenants' && <Tenants ctx={ctx} />}
          {page==='contracts' && <Contracts ctx={ctx} />}
          {page==='rentpayments' && <RentPayments ctx={ctx} />}
          {page==='documents' && <Documents ctx={ctx} />}
          {page==='employees' && <Employees ctx={ctx} />}
        </div>
      </div>
      <style>{`@media (max-width:860px){.burger{display:block !important;}}`}</style>
    </div>
  );
}

// ---------- DASHBOARD ----------
function Dashboard({ctx, setPage}){
  const {sales, products, payments, contracts, documents, shifts} = ctx;
  const todaySales = sales.filter(s=>s.date===todayISO());
  const revenueToday = todaySales.reduce((a,s)=>a+s.total,0);
  const lowStock = products.filter(p=>p.qty<10);
  const rentDue = payments.filter(p=>p.status!=='оплачено').length;
  const pendingDocs = documents.filter(d=>d.status==='на согласовании').length;
  const activeContracts = contracts.filter(c=>c.status==='действует').length;

  return (
    <div>
      <div style={{display:'flex', gap:32, flexWrap:'wrap', marginBottom:28, padding:'18px 0'}}>
        <Stat label="Выручка сегодня" value={fmtKZT(revenueToday)} sub={todaySales.length+' продаж'} />
        <Stat label="Товар заканчивается" value={lowStock.length} sub="позиций < 10 шт" />
        <Stat label="Задолженности по аренде" value={rentDue} sub={"из "+payments.length+" оплат"} />
        <Stat label="Документы на согласовании" value={pendingDocs} sub={documents.length+' всего'} />
        <Stat label="Активных договоров" value={activeContracts} />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
        <Panel title="Низкий остаток на складе" action={<Btn small onClick={()=>setPage('warehouse')}>К складу</Btn>}>
          <table>
            <thead><tr><th>Товар</th><th>Точка</th><th>Остаток</th></tr></thead>
            <tbody>
              {lowStock.length===0 && <tr><td colSpan="3" style={{color:'var(--muted-2)'}}>Остатки в норме</td></tr>}
              {lowStock.map(p=>(
                <tr key={p.id}><td>{p.name}</td><td>{ctx.outletName(p.outletId)}</td><td className="num"><Badge tone="bad">{p.qty}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Документы, требующие внимания" action={<Btn small onClick={()=>setPage('documents')}>К СЭД</Btn>}>
          <table>
            <thead><tr><th>Документ</th><th>Тип</th><th>Статус</th></tr></thead>
            <tbody>
              {documents.filter(d=>d.status==='на согласовании').length===0 && <tr><td colSpan="3" style={{color:'var(--muted-2)'}}>Нет активных согласований</td></tr>}
              {documents.filter(d=>d.status==='на согласовании').map(d=>(
                <tr key={d.id}><td>{d.title}</td><td>{d.type}</td><td><Badge tone="accent">{d.status}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

// ---------- WAREHOUSE ----------
function Warehouse({ctx}){
  const {products, setProducts, outlets} = ctx;
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({sku:'', name:'', outletId:outlets[0]?.id, qty:0, price:0, cost:0});

  function save(){
    if(!form.name) return;
    setProducts(prev=>[...prev, {id:uid(), ...form, qty:Number(form.qty), price:Number(form.price), cost:Number(form.cost)}]);
    setModal(null);
    setForm({sku:'', name:'', outletId:outlets[0]?.id, qty:0, price:0, cost:0});
  }
  function adjust(id, delta){
    setProducts(prev=>prev.map(p=>p.id===id ? {...p, qty: Math.max(0, p.qty+delta)} : p));
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:14}}>
        <Btn tone="accent" onClick={()=>setModal('add')}>+ Товар</Btn>
      </div>
      <Panel>
        <table>
          <thead><tr><th>SKU</th><th>Товар</th><th>Точка</th><th>Остаток</th><th>Закупка</th><th>Цена</th><th>Списание</th></tr></thead>
          <tbody>
            {products.map(p=>(
              <tr key={p.id}>
                <td className="num" style={{color:'var(--muted)'}}>{p.sku}</td>
                <td>{p.name}</td>
                <td>{ctx.outletName(p.outletId)}</td>
                <td className="num"><Badge tone={p.qty<10?'bad':'good'}>{p.qty} шт</Badge></td>
                <td className="num">{fmtKZT(p.cost)}</td>
                <td className="num">{fmtKZT(p.price)}</td>
                <td>
                  <Btn small onClick={()=>adjust(p.id,-1)}>−1</Btn>{' '}
                  <Btn small onClick={()=>adjust(p.id,1)}>+1</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {modal==='add' && (
        <Modal title="Новый товар" onClose={()=>setModal(null)}>
          <Field label="SKU"><input style={inputStyle} value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/></Field>
          <Field label="Наименование"><input style={inputStyle} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
          <Field label="Точка">
            <select style={inputStyle} value={form.outletId} onChange={e=>setForm({...form,outletId:e.target.value})}>
              {outlets.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
          <div style={{display:'flex', gap:10}}>
            <Field label="Кол-во"><input type="number" style={inputStyle} value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></Field>
            <Field label="Закупка, ₸"><input type="number" style={inputStyle} value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})}/></Field>
            <Field label="Цена, ₸"><input type="number" style={inputStyle} value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></Field>
          </div>
          <Btn tone="accent" onClick={save}>Сохранить</Btn>
        </Modal>
      )}
    </div>
  );
}

// ---------- SALES ----------
function Sales({ctx}){
  const {sales, setSales, products, setProducts, outlets} = ctx;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({productId: products[0]?.id, qty:1});

  function record(){
    const p = ctx.productById(form.productId);
    if(!p) return;
    const qty = Number(form.qty);
    if(qty<=0 || qty>p.qty) return alert('Недостаточно остатка на складе');
    setSales(prev=>[{id:uid(), productId:p.id, outletId:p.outletId, qty, date:todayISO(), total:qty*p.price, source:'ручной ввод'}, ...prev]);
    setProducts(prev=>prev.map(pr=>pr.id===p.id ? {...pr, qty:pr.qty-qty} : pr));
    setModal(false);
    setForm({productId: products[0]?.id, qty:1});
  }

  const totalToday = sales.filter(s=>s.date===todayISO()).reduce((a,s)=>a+s.total,0);

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:14}}>
        <div style={{fontSize:12.5, color:'var(--muted)'}}>Продажи фиксируются вручную. Источник: касса/эквайринг подключается отдельно.</div>
        <Btn tone="accent" onClick={()=>setModal(true)}>+ Продажа</Btn>
      </div>
      <div style={{marginBottom:14}}><Stat label="Выручка сегодня" value={fmtKZT(totalToday)} /></div>
      <Panel>
        <table>
          <thead><tr><th>Дата</th><th>Товар</th><th>Точка</th><th>Кол-во</th><th>Сумма</th><th>Источник</th></tr></thead>
          <tbody>
            {sales.map(s=>{
              const p = ctx.productById(s.productId);
              return (
                <tr key={s.id}>
                  <td className="num">{s.date}</td>
                  <td>{p?p.name:'(удалён)'}</td>
                  <td>{ctx.outletName(s.outletId)}</td>
                  <td className="num">{s.qty}</td>
                  <td className="num">{fmtKZT(s.total)}</td>
                  <td><Badge>{s.source}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      {modal && (
        <Modal title="Новая продажа" onClose={()=>setModal(false)}>
          <Field label="Товар">
            <select style={inputStyle} value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})}>
              {products.map(p=><option key={p.id} value={p.id}>{p.name} — остаток {p.qty}</option>)}
            </select>
          </Field>
          <Field label="Количество"><input type="number" style={inputStyle} value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></Field>
          <div style={{fontSize:12.5, color:'var(--muted)', marginBottom:12}}>
            Итого: <span className="num">{fmtKZT((ctx.productById(form.productId)?.price||0)*Number(form.qty||0))}</span>
          </div>
          <Btn tone="accent" onClick={record}>Провести продажу</Btn>
        </Modal>
      )}
    </div>
  );
}

// ---------- TIMESHEET ----------
function Timesheet({ctx}){
  const {shifts, setShifts, employees} = ctx;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({employeeId:employees[0]?.id, date:todayISO(), hours:8});

  function add(){
    setShifts(prev=>[{id:uid(), employeeId:form.employeeId, date:form.date, hours:Number(form.hours), status:'на проверке'}, ...prev]);
    setModal(false);
  }
  function confirm(id){
    setShifts(prev=>prev.map(s=>s.id===id?{...s,status:'подтверждена'}:s));
  }

  const totalsByEmployee = useMemo(()=>{
    const m = {};
    shifts.forEach(s=>{ m[s.employeeId] = (m[s.employeeId]||0) + Number(s.hours); });
    return m;
  }, [shifts]);

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:14}}>
        <Btn tone="accent" onClick={()=>setModal(true)}>+ Смена</Btn>
      </div>

      <Panel title="Итого часов за период">
        <table>
          <thead><tr><th>Сотрудник</th><th>Точка</th><th>Часов всего</th></tr></thead>
          <tbody>
            {employees.map(e=>(
              <tr key={e.id}><td>{e.name}</td><td>{ctx.outletName(e.outletId)}</td><td className="num">{totalsByEmployee[e.id]||0}</td></tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Журнал смен">
        <table>
          <thead><tr><th>Дата</th><th>Сотрудник</th><th>Часы</th><th>Статус</th><th></th></tr></thead>
          <tbody>
            {shifts.map(s=>(
              <tr key={s.id}>
                <td className="num">{s.date}</td>
                <td>{ctx.employeeName(s.employeeId)}</td>
                <td className="num">{s.hours}</td>
                <td><Badge tone={s.status==='подтверждена'?'good':'accent'}>{s.status}</Badge></td>
                <td>{s.status!=='подтверждена' && <Btn small onClick={()=>confirm(s.id)}>Подтвердить</Btn>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {modal && (
        <Modal title="Новая смена" onClose={()=>setModal(false)}>
          <Field label="Сотрудник">
            <select style={inputStyle} value={form.employeeId} onChange={e=>setForm({...form,employeeId:e.target.value})}>
              {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="Дата"><input type="date" style={inputStyle} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field>
          <Field label="Часы"><input type="number" style={inputStyle} value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})}/></Field>
          <Btn tone="accent" onClick={add}>Добавить</Btn>
        </Modal>
      )}
    </div>
  );
}

// ---------- TENANTS ----------
function Tenants({ctx}){
  const {tenants, setTenants} = ctx;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({name:'', iin:'', room:'', phone:''});
  const [iinNote, setIinNote] = useState('');

  function checkIin(v){
    setForm({...form, iin:v});
    if(v.length===12){
      setIinNote(iinChecksum(v) ? 'Контрольная сумма верна' : 'Неверная контрольная сумма ИИН');
    } else setIinNote('');
  }

  function save(){
    if(!form.name || !form.iin) return;
    setTenants(prev=>[...prev, {id:uid(), ...form}]);
    setModal(false);
    setForm({name:'', iin:'', room:'', phone:''});
    setIinNote('');
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:14}}>
        <Btn tone="accent" onClick={()=>setModal(true)}>+ Жилец</Btn>
      </div>
      <Panel>
        <table>
          <thead><tr><th>ФИО</th><th>ИИН</th><th>Комната</th><th>Телефон</th></tr></thead>
          <tbody>
            {tenants.map(t=>(
              <tr key={t.id}><td>{t.name}</td><td className="num">{t.iin}</td><td className="num">{t.room}</td><td className="num">{t.phone}</td></tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {modal && (
        <Modal title="Новый жилец" onClose={()=>setModal(false)}>
          <Field label="ФИО"><input style={inputStyle} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
          <Field label="ИИН (12 цифр)">
            <input style={inputStyle} maxLength="12" value={form.iin} onChange={e=>checkIin(e.target.value.replace(/\D/g,''))}/>
            {iinNote && <div style={{fontSize:11.5, marginTop:5, color: iinNote.includes('верна') ? 'var(--good)':'var(--bad)'}}>{iinNote}</div>}
            <div style={{fontSize:11, color:'var(--muted-2)', marginTop:4}}>Автозаполнение по ИИН из ГБДФЛ требует отдельной аккредитации — уточняется у заказчика. Сейчас проверяется только контрольная сумма.</div>
          </Field>
          <Field label="Комната"><input style={inputStyle} value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></Field>
          <Field label="Телефон"><input style={inputStyle} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field>
          <Btn tone="accent" onClick={save}>Сохранить</Btn>
        </Modal>
      )}
    </div>
  );
}

// ---------- CONTRACTS ----------
function Contracts({ctx}){
  const {contracts, setContracts, tenants, documents, setDocuments} = ctx;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({tenantId:tenants[0]?.id, room:'', start:todayISO(), end:'', rent:35000});

  function save(){
    const id = uid();
    setContracts(prev=>[...prev, {id, ...form, rent:Number(form.rent), status:'действует'}]);
    setDocuments(prev=>[{id:uid(), title:`Договор аренды — комната ${form.room}`, type:'Договор (внешний)', author:'Система', date:todayISO(), status:'на согласовании', steps:[
      {name: ctx.tenantName(form.tenantId), role:'Арендатор', status:'ожидает'},
      {name:'ADAL JASA GROUP', role:'Арендодатель', status:'ожидает'},
    ]}, ...prev]);
    setModal(false);
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:14}}>
        <Btn tone="accent" onClick={()=>setModal(true)}>+ Договор</Btn>
      </div>
      <Panel>
        <table>
          <thead><tr><th>Жилец</th><th>Комната</th><th>Период</th><th>Аренда/мес</th><th>Статус</th></tr></thead>
          <tbody>
            {contracts.map(c=>(
              <tr key={c.id}>
                <td>{ctx.tenantName(c.tenantId)}</td>
                <td className="num">{c.room}</td>
                <td className="num">{c.start} — {c.end}</td>
                <td className="num">{fmtKZT(c.rent)}</td>
                <td><Badge tone="good">{c.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div style={{fontSize:11.5, color:'var(--muted-2)'}}>Новый договор автоматически создаёт документ на согласование в СЭД.</div>

      {modal && (
        <Modal title="Новый договор аренды" onClose={()=>setModal(false)}>
          <Field label="Жилец">
            <select style={inputStyle} value={form.tenantId} onChange={e=>setForm({...form,tenantId:e.target.value})}>
              {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Комната"><input style={inputStyle} value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></Field>
          <div style={{display:'flex', gap:10}}>
            <Field label="Начало"><input type="date" style={inputStyle} value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/></Field>
            <Field label="Окончание"><input type="date" style={inputStyle} value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/></Field>
          </div>
          <Field label="Аренда, ₸/мес"><input type="number" style={inputStyle} value={form.rent} onChange={e=>setForm({...form,rent:e.target.value})}/></Field>
          <Btn tone="accent" onClick={save}>Заключить договор</Btn>
        </Modal>
      )}
    </div>
  );
}

// ---------- RENT PAYMENTS ----------
function RentPayments({ctx}){
  const {payments, setPayments, tenants} = ctx;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({tenantId:tenants[0]?.id, amount:35000, method:'Kaspi Pay'});

  function pay(){
    setPayments(prev=>[{id:uid(), tenantId:form.tenantId, date:todayISO(), amount:Number(form.amount), method:form.method, status:'оплачено'}, ...prev]);
    setModal(false);
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:14}}>
        <Btn tone="accent" onClick={()=>setModal(true)}>+ Оплата</Btn>
      </div>
      <Panel>
        <table>
          <thead><tr><th>Дата</th><th>Жилец</th><th>Сумма</th><th>Способ</th><th>Статус</th></tr></thead>
          <tbody>
            {payments.map(p=>(
              <tr key={p.id}>
                <td className="num">{p.date}</td>
                <td>{ctx.tenantName(p.tenantId)}</td>
                <td className="num">{fmtKZT(p.amount)}</td>
                <td>{p.method}</td>
                <td><Badge tone={p.status==='оплачено'?'good':'bad'}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {modal && (
        <Modal title="Новая оплата" onClose={()=>setModal(false)}>
          <Field label="Жилец">
            <select style={inputStyle} value={form.tenantId} onChange={e=>setForm({...form,tenantId:e.target.value})}>
              {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Сумма, ₸"><input type="number" style={inputStyle} value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></Field>
          <Field label="Способ">
            <select style={inputStyle} value={form.method} onChange={e=>setForm({...form,method:e.target.value})}>
              <option>Kaspi Pay</option><option>Банковский перевод</option><option>Наличные</option>
            </select>
          </Field>
          <Btn tone="accent" onClick={pay}>Провести оплату</Btn>
        </Modal>
      )}
    </div>
  );
}

// ---------- DOCUMENTS (EDMS) ----------
// ---------- light theme tokens for the internal-docs screen ----------
const LT = {
  bg:'#F4F5F7', card:'#FFFFFF', border:'#E3E5EA', text:'#1B2430', muted:'#6B7280',
  muted2:'#9AA1AC', field:'#F7F8FA', accent:'#1B6E52', accentHover:'#155A43', accentSoft:'#E7F3EE',
};
function ltInput(extra){
  return {width:'100%', background:LT.field, border:`1px solid ${LT.border}`, color:LT.text,
    borderRadius:8, padding:'9px 11px', fontSize:13.5, fontFamily:'inherit', ...extra};
}

function staffLabel(id){
  const s = STAFF.find(x=>x.id===id);
  return s ? `${s.name} — ${s.role}` : '—';
}

function prefixFor(d){
  return d.prefix || (DOC_TYPES.find(t=>t.label===d.type)?.prefix) || 'ДОК';
}

function Documents({ctx}){
  const {documents, setDocuments} = ctx;
  const [openDoc, setOpenDoc] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activeType, setActiveType] = useState(DOC_TYPES[0].id);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectText, setRejectText] = useState('');
  const [tab, setTab] = useState('pending');
  const blankForm = {title:'', from: STAFF[0].id, to:'', text:'', files:[], amount:'', approvers:[], signer: STAFF[3].id};
  const [form, setForm] = useState(blankForm);

  const type = DOC_TYPES.find(t=>t.id===activeType) || DOC_TYPES[0];

  const pending = documents.filter(d=>d.status==='на согласовании');
  const memoTypeLabels = DOC_TYPES.filter(t=>t.id!=='prikaz').map(t=>t.label);
  const memoDocs = documents.filter(d=>memoTypeLabels.includes(d.type));
  const orderDocs = documents.filter(d=>d.type==='Приказ');

  const TABS = [
    {id:'pending', label:'На согласовании / подписании', rows: pending, empty:'Нет документов в работе'},
    {id:'memo', label:'Служебные записки', rows: memoDocs, empty:'Служебок пока нет'},
    {id:'orders', label:'Приказы', rows: orderDocs, empty:'Приказов пока нет'},
  ];
  const activeTab = TABS.find(t=>t.id===tab) || TABS[0];

  function pickType(id){
    setActiveType(id);
    setForm({...blankForm, from: form.from, signer: form.signer});
    setFormOpen(true);
  }

  function toggleApprover(id){
    setForm(f=>({...f, approvers: f.approvers.includes(id) ? f.approvers.filter(x=>x!==id) : [...f.approvers, id]}));
  }

  function onFiles(e){
    const names = Array.from(e.target.files||[]).map(f=>f.name);
    setForm(f=>({...f, files: names}));
  }

  function create(){
    if(!form.title.trim()) return;
    const steps = [
      ...form.approvers.map(id=>{ const s = STAFF.find(x=>x.id===id); return {name:s.name, role:s.role, status:'ожидает'}; }),
      (()=>{ const s = STAFF.find(x=>x.id===form.signer); return {name:s.name, role:s.role+' · подписант', status:'ожидает'}; })(),
    ];
    const fromStaff = STAFF.find(x=>x.id===form.from);
    setDocuments(prev=>{
      const draftSeq = prev.filter(d=>d.draftNumber).length + 1;
      return [{
        id:uid(), title:form.title.trim(), type:type.label, prefix:type.prefix,
        author: fromStaff?.name || '—', to: form.to, text: form.text,
        files: form.files, amount: form.amount,
        date: todayISO(), status:'на согласовании', number:null,
        draftNumber:`Проект-${draftSeq}`, steps,
      }, ...prev];
    });
    setForm({...blankForm, from: form.from, signer: form.signer});
    setFormOpen(false);
  }

  function advance(docId){
    setDocuments(prev=>{
      const target = prev.find(d=>d.id===docId);
      const prefix = prefixFor(target||{});
      const signedOfPrefix = prev.filter(d=>prefixFor(d)===prefix && d.number).length;
      return prev.map(d=>{
        if(d.id!==docId) return d;
        const steps = d.steps.map(s=>({...s}));
        const idx = steps.findIndex(s=>s.status==='ожидает');
        if(idx>=0) steps[idx].status='подписано';
        const allSigned = steps.every(s=>s.status==='подписано');
        const number = allSigned ? (d.number || `${prefix}-${signedOfPrefix+1}`) : d.number;
        return {...d, steps, status: allSigned ? 'подписан' : 'на согласовании', number};
      });
    });
  }

  function reject(docId, comment){
    setDocuments(prev=>prev.map(d=>{
      if(d.id!==docId) return d;
      const steps = d.steps.map(s=>({...s}));
      const idx = steps.findIndex(s=>s.status==='ожидает');
      if(idx>=0) steps[idx] = {...steps[idx], status:'отклонено', comment: comment.trim() || 'Без комментария'};
      return {...d, steps, status:'отклонён'};
    }));
    setRejectMode(false);
    setRejectText('');
  }

  function statusBadge(status){
    const tones = {
      'подписан': {bg:LT.accentSoft, fg:LT.accent},
      'отклонён': {bg:'#FBE7E5', fg:'#B0392E'},
      'на согласовании': {bg:'#FDF3E3', fg:'#966A17'},
    };
    const t = tones[status] || tones['на согласовании'];
    return (
      <span style={{fontSize:11.5, fontWeight:600, padding:'3px 9px', borderRadius:20, background:t.bg, color:t.fg}}>{status}</span>
    );
  }

  function DocsTable({rows, emptyText}){
    return (
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['№','Дата','Документ','Тип','От кого','Статус',''].map(h=>(
                <th key={h} style={{textAlign:'left', fontSize:11, fontWeight:600, color:LT.muted, padding:'10px 18px', borderBottom:`1px solid ${LT.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length===0 && (
              <tr><td colSpan={7} style={{padding:'16px 18px', fontSize:13, color:LT.muted2}}>{emptyText}</td></tr>
            )}
            {rows.map(d=>(
              <tr key={d.id} onClick={()=>setOpenDoc(d.id)} style={{cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background=LT.field}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="num" style={{padding:'11px 18px', fontSize:13, color: d.number ? LT.text : LT.muted2, borderBottom:`1px solid ${LT.border}`}}>{d.number || d.draftNumber || '—'}</td>
                <td className="num" style={{padding:'11px 18px', fontSize:13, color:LT.muted, borderBottom:`1px solid ${LT.border}`}}>{d.date}</td>
                <td style={{padding:'11px 18px', fontSize:13.5, color:LT.text, borderBottom:`1px solid ${LT.border}`, fontWeight:500}}>{d.title}</td>
                <td style={{padding:'11px 18px', fontSize:13.5, color:LT.text, borderBottom:`1px solid ${LT.border}`}}>{d.type}</td>
                <td style={{padding:'11px 18px', fontSize:13.5, color:LT.text, borderBottom:`1px solid ${LT.border}`}}>{d.author}</td>
                <td style={{padding:'11px 18px', borderBottom:`1px solid ${LT.border}`}}>{statusBadge(d.status)}</td>
                <td style={{padding:'11px 18px', borderBottom:`1px solid ${LT.border}`}}>
                  <button onClick={e=>{e.stopPropagation(); setOpenDoc(d.id);}} style={{
                    background:LT.field, border:`1px solid ${LT.border}`, borderRadius:6, padding:'5px 10px',
                    fontSize:12, color:LT.text, cursor:'pointer', fontWeight:600
                  }}>Открыть</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{background:LT.bg, margin:'-24px', padding:24, minHeight:'calc(100vh - 61px)'}}>
      {/* header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14, marginBottom:22}}>
        <div>
          <div style={{fontSize:20, fontWeight:700, color:LT.text}}>Внутренняя документация</div>
          <div style={{fontSize:13, color:LT.muted, marginTop:4, maxWidth:480}}>
            Служебные записки, заявки, приказы и докладные — номер присваивается после подписания
          </div>
        </div>
        <button onClick={()=>{setFormOpen(o=>!o); setActiveType(DOC_TYPES[0].id); setForm(blankForm);}} style={{
          background:LT.accent, color:'#fff', border:'none', borderRadius:20, padding:'9px 18px',
          fontSize:13, fontWeight:600, cursor:'pointer'
        }}>{formOpen ? 'Скрыть форму ×' : '+ Создать новый документ'}</button>
      </div>

      {/* creation card */}
      {formOpen && (<>
      <div style={{fontSize:11, letterSpacing:'.04em', color:LT.muted2, marginBottom:10, fontWeight:600}}>ВЫБЕРИТЕ ТИП ДОКУМЕНТА</div>
      <div style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom:20}}>
        {DOC_TYPES.map(t=>{
          const active = t.id===activeType;
          return (
            <button key={t.id} onClick={()=>pickType(t.id)} style={{
              background: active ? LT.accent : LT.card, color: active ? '#fff' : LT.text,
              border: `1px solid ${active ? LT.accent : LT.border}`, borderRadius:8,
              padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer'
            }}>+ {t.label}</button>
          );
        })}
      </div>
      </>)}
      {formOpen && (
        <div style={{background:LT.card, border:`1px solid ${LT.border}`, borderRadius:12, padding:20, marginBottom:24, boxShadow:'0 1px 2px rgba(16,24,40,.04)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18}}>
            <div style={{fontSize:15, fontWeight:700, color:LT.text}}>Новый документ · {type.label}</div>
            <span onClick={()=>setFormOpen(false)} style={{fontSize:13, color:LT.muted, cursor:'pointer'}}>Отменить ×</span>
          </div>

          <div style={{marginBottom:14}}>
            <div style={{fontSize:12, color:LT.muted, marginBottom:6}}>Тема / заголовок</div>
            <input style={ltInput()} placeholder={type.placeholder} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          </div>

          <div style={{display:'flex', gap:14, flexWrap:'wrap', marginBottom:14}}>
            <div style={{flex:'1 1 220px'}}>
              <div style={{fontSize:12, color:LT.muted, marginBottom:6}}>От кого</div>
              <select style={ltInput()} value={form.from} onChange={e=>setForm({...form,from:e.target.value})}>
                {STAFF.map(s=><option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
              </select>
            </div>
            {type.hasTo ? (
              <div style={{flex:'1 1 220px'}}>
                <div style={{fontSize:12, color:LT.muted, marginBottom:6}}>Кому адресовано</div>
                <input style={ltInput()} placeholder="Например: Джумадилова Раушан, директор" value={form.to} onChange={e=>setForm({...form,to:e.target.value})}/>
              </div>
            ) : type.hasAmount ? (
              <div style={{flex:'1 1 220px'}}>
                <div style={{fontSize:12, color:LT.muted, marginBottom:6}}>Сумма, ₸</div>
                <input type="number" style={ltInput()} placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
              </div>
            ) : null}
          </div>

          <div style={{marginBottom:14}}>
            <div style={{fontSize:12, color:LT.muted, marginBottom:6}}>Текст документа</div>
            <textarea style={ltInput({minHeight:90, resize:'vertical'})} placeholder="Изложите суть служебки..." value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{fontSize:12, color:LT.muted, marginBottom:6}}>Прикреплённые документы</div>
            <label style={{
              display:'inline-flex', alignItems:'center', gap:10, background:LT.field, border:`1px solid ${LT.border}`,
              borderRadius:8, padding:'9px 12px', fontSize:13, cursor:'pointer', color:LT.text
            }}>
              <span style={{background:LT.card, border:`1px solid ${LT.border}`, borderRadius:6, padding:'4px 10px', fontSize:12.5, fontWeight:600}}>Выбрать файлы</span>
              <span style={{color:LT.muted}}>{form.files.length ? form.files.join(', ') : 'Файл не выбран'}</span>
              <input type="file" multiple onChange={onFiles} style={{display:'none'}}/>
            </label>
            <div style={{fontSize:11.5, color:LT.muted2, marginTop:6}}>Договоры, КП, сканы, фото — можно выбрать несколько файлов сразу.</div>
          </div>

          <div style={{display:'flex', gap:24, flexWrap:'wrap', marginBottom:20}}>
            <div style={{flex:'1 1 240px'}}>
              <div style={{fontSize:12, color:LT.muted, marginBottom:8}}>Согласующие</div>
              {STAFF.filter(s=>s.id!==form.signer).map(s=>(
                <label key={s.id} style={{display:'flex', alignItems:'center', gap:8, marginBottom:8, fontSize:13.5, color:LT.text, cursor:'pointer'}}>
                  <input type="checkbox" checked={form.approvers.includes(s.id)} onChange={()=>toggleApprover(s.id)}/>
                  {s.name} <span style={{color:LT.muted}}>— {s.role}</span>
                </label>
              ))}
            </div>
            <div style={{flex:'1 1 240px'}}>
              <div style={{fontSize:12, color:LT.muted, marginBottom:6}}>Подписант</div>
              <select style={ltInput()} value={form.signer} onChange={e=>setForm({...form,signer:e.target.value})}>
                {STAFF.map(s=><option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
              </select>
              <div style={{fontSize:11.5, color:LT.muted2, marginTop:6}}>Регистрационный номер присваивается автоматически в момент подписания.</div>
            </div>
          </div>

          <button onClick={create} style={{
            background:LT.accent, color:'#fff', border:'none', borderRadius:8, padding:'10px 20px',
            fontSize:13.5, fontWeight:600, cursor:'pointer'
          }}>Создать и отправить на согласование</button>
        </div>
      )}

      {/* tabs */}
      <div style={{display:'flex', gap:4, borderBottom:`1px solid ${LT.border}`, marginBottom:0}}>
        {TABS.map(t=>{
          const active = t.id===tab;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:'transparent', border:'none', borderBottom: active ? `2px solid ${LT.accent}` : '2px solid transparent',
              padding:'10px 16px', fontSize:13.5, fontWeight:600, cursor:'pointer',
              color: active ? LT.accent : LT.muted, display:'flex', alignItems:'center', gap:8, marginBottom:-1
            }}>
              {t.label}
              {t.rows.length>0 && (
                <span style={{
                  fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:20,
                  background: active ? LT.accentSoft : LT.field, color: active ? LT.accent : LT.muted2
                }}>{t.rows.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{background:LT.card, border:`1px solid ${LT.border}`, borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden'}}>
        <DocsTable rows={activeTab.rows} emptyText={activeTab.empty} />
      </div>

      <div style={{fontSize:11.5, color:LT.muted2, marginTop:10}}>
        Пока документ на согласовании, у него временный номер «Проект-N». Постоянный номер (СЗ-1, ПР-1 и т.д. — по типу документа) присваивается автоматически после полного подписания. Подписание — сейчас симуляция маршрута согласования. Реальную ЭЦП (НУЦ РК) подключим отдельно, когда определитесь.
      </div>

      {openDoc && (()=>{
        const d = documents.find(x=>x.id===openDoc);
        if(!d) return null;
        const canAct = d.status==='на согласовании';
        const closeAll = ()=>{setOpenDoc(null); setRejectMode(false); setRejectText('');};
        return (
          <div onClick={closeAll} style={{position:'fixed', inset:0, background:'rgba(15,17,21,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16}}>
            <div onClick={e=>e.stopPropagation()} style={{background:LT.card, border:`1px solid ${LT.border}`, borderRadius:12, width:520, maxWidth:'100%', maxHeight:'88vh', overflowY:'auto'}}>

              <div style={{padding:'28px 28px 0'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                  <span style={{fontSize:12.5, color:LT.accent, fontWeight:600}}>{d.type}</span>
                  <span onClick={closeAll} style={{color:LT.muted2, fontSize:20, cursor:'pointer', lineHeight:1}}>×</span>
                </div>
                <div style={{fontSize:19, fontWeight:700, color:LT.text, marginBottom:18}}>{d.title}</div>
                <div style={{display:'flex', gap:28, flexWrap:'wrap', fontSize:13, color:LT.muted, paddingBottom:22, borderBottom:`1px solid ${LT.border}`}}>
                  <div>№ <span style={{color:LT.text, fontWeight:600}}>{d.number || d.draftNumber || '—'}</span></div>
                  <div>Дата <span style={{color:LT.text, fontWeight:600}}>{d.date}</span></div>
                  <div>От <span style={{color:LT.text, fontWeight:600}}>{d.author}</span></div>
                  {d.to && <div>Кому <span style={{color:LT.text, fontWeight:600}}>{d.to}</span></div>}
                  {d.amount && <div>Сумма <span style={{color:LT.text, fontWeight:600}}>{fmtKZT(d.amount)}</span></div>}
                </div>
              </div>

              <div style={{padding:'24px 28px'}}>
                <div style={{fontSize:12, color:LT.muted2, marginBottom:10}}>Текст документа</div>
                <div style={{fontSize:14, lineHeight:1.6, color:'#333A45', marginBottom:28}}>
                  {d.text?.trim() || 'Текст не указан.'}
                </div>

                <div style={{fontSize:12, color:LT.muted2, marginBottom:10}}>Прикреплённые файлы</div>
                {d.files && d.files.length>0 ? (
                  <div style={{fontSize:13.5, color:LT.text, marginBottom:32}}>{d.files.join(', ')}</div>
                ) : <div style={{fontSize:13, color:LT.muted2, marginBottom:32}}>Файлы не прикреплены</div>}

                <div style={{fontSize:12, color:LT.muted2, marginBottom:4}}>Маршрут согласования</div>
                <div>
                  {d.steps.map((s,i)=>(
                    <div key={i} style={{padding:'14px 0', borderBottom: i<d.steps.length-1 ? '1px solid #F1F2F5':'none'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                        <div>
                          <div style={{fontSize:14.5, fontWeight:600, color:LT.text}}>{s.name}</div>
                          <div style={{fontSize:12.5, color:LT.muted2, marginTop:2}}>{s.role}</div>
                        </div>
                        <div style={{fontSize:12.5, fontWeight:600, color: s.status==='подписано' ? LT.accent : s.status==='отклонено' ? '#B0392E' : '#966A17'}}>{s.status}</div>
                      </div>
                      {s.status==='отклонено' && s.comment && (
                        <div style={{fontSize:12.5, color:'#B0392E', marginTop:6}}>Комментарий: {s.comment}</div>
                      )}
                    </div>
                  ))}
                </div>

                {d.status==='подписан' && (
                  <div style={{fontSize:13, color:LT.accent, marginTop:20}}>Документ полностью подписан. Рег. номер: {d.number}</div>
                )}
                {d.status==='отклонён' && (
                  <div style={{fontSize:13, color:'#B0392E', marginTop:20}}>Документ отклонён на этапе согласования.</div>
                )}

                {canAct && !rejectMode && (
                  <div style={{display:'flex', gap:12, marginTop:28}}>
                    <button onClick={()=>advance(d.id)} style={{
                      flex:1, background:LT.accent, color:'#fff', border:'none', borderRadius:8,
                      padding:'12px 0', fontSize:14, fontWeight:700, cursor:'pointer'
                    }}>Подписать</button>
                    <button onClick={()=>setRejectMode(true)} style={{
                      flex:1, background:'transparent', border:`1px solid ${LT.border}`, color:LT.muted,
                      borderRadius:8, padding:'12px 0', fontSize:14, fontWeight:700, cursor:'pointer'
                    }}>Отказать</button>
                  </div>
                )}

                {canAct && rejectMode && (
                  <div style={{marginTop:28}}>
                    <div style={{fontSize:12, color:LT.muted2, marginBottom:8}}>Комментарий к отказу</div>
                    <textarea autoFocus value={rejectText} onChange={e=>setRejectText(e.target.value)}
                      placeholder="Укажите причину отказа в согласовании / подписании"
                      style={{width:'100%', minHeight:70, background:LT.field, border:`1px solid ${LT.border}`, borderRadius:8, color:LT.text, padding:'10px 12px', fontSize:13.5, marginBottom:12, fontFamily:'inherit'}}/>
                    <div style={{display:'flex', gap:12}}>
                      <button onClick={()=>reject(d.id, rejectText)} style={{
                        flex:1, background:'#B0392E', color:'#fff', border:'none', borderRadius:8,
                        padding:'12px 0', fontSize:14, fontWeight:700, cursor:'pointer'
                      }}>Подтвердить отказ</button>
                      <button onClick={()=>{setRejectMode(false); setRejectText('');}} style={{
                        flex:1, background:'transparent', border:`1px solid ${LT.border}`, color:LT.muted,
                        borderRadius:8, padding:'12px 0', fontSize:14, fontWeight:700, cursor:'pointer'
                      }}>Отмена</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ---------- EMPLOYEES ----------
function Employees({ctx}){
  const {employees, setEmployees, outlets} = ctx;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({name:'', role:'Продавец', outletId:outlets[0]?.id, phone:''});

  function save(){
    if(!form.name) return;
    setEmployees(prev=>[...prev, {id:uid(), ...form}]);
    setModal(false);
    setForm({name:'', role:'Продавец', outletId:outlets[0]?.id, phone:''});
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:14}}>
        <Btn tone="accent" onClick={()=>setModal(true)}>+ Сотрудник</Btn>
      </div>
      <Panel>
        <table>
          <thead><tr><th>ФИО</th><th>Должность</th><th>Точка</th><th>Телефон</th></tr></thead>
          <tbody>
            {employees.map(e=>(
              <tr key={e.id}><td>{e.name}</td><td>{e.role}</td><td>{ctx.outletName(e.outletId)}</td><td className="num">{e.phone}</td></tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {modal && (
        <Modal title="Новый сотрудник" onClose={()=>setModal(false)}>
          <Field label="ФИО"><input style={inputStyle} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
          <Field label="Должность"><input style={inputStyle} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}/></Field>
          <Field label="Точка">
            <select style={inputStyle} value={form.outletId} onChange={e=>setForm({...form,outletId:e.target.value})}>
              {outlets.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
          <Field label="Телефон"><input style={inputStyle} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field>
          <Btn tone="accent" onClick={save}>Сохранить</Btn>
        </Modal>
      )}
    </div>
  );
}

export default App;
