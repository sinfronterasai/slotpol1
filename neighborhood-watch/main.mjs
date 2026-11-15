import {createGame} from './engine.mjs';

const game = createGame();
const $ = id => document.getElementById(id);
const labels = {house:['⌂','HOUSE'],neighbor:['◉','NEIGHBOR'],badge:['★','HOA'],lawn:['♣','LAWN'],camera:['◎','CAMERA'],file:['▤','FILE'],wild:['✦','EVIDENCE'],scatter:['⚠','ALERT']};
const money = number => Number(number).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const reels = $('reels');
let busy=false;
function renderGrid(grid) {
  reels.replaceChildren(...grid.map((reel, index)=>{
    const column=document.createElement('div');column.className='reel';column.setAttribute('aria-label',`Reel ${index+1}`);
    for(const symbol of reel){const cell=document.createElement('div');cell.className=`symbol symbol-${symbol}`;const [glyph,label]=labels[symbol];cell.innerHTML=`<span class="glyph">${glyph}</span><span class="symbol-name">${label}</span>`;column.append(cell);}
    return column;
  }));
}
function sync() {
  renderGrid(game.state.grid);
  $('balance').textContent=money(game.state.balance);$('betValue').textContent=money(game.state.bet);
  $('lastWin').textContent=money(game.state.lastWin);$('spins').textContent=game.state.totalSpins;
  $('message').textContent=game.state.message;
  $('modeLabel').textContent=({normal:'NORMAL OPERATIONS',curfew:'CURFEW IN EFFECT',hoa:'EMERGENCY HOA MEETING',invasion:'SECURITY BREACH'})[game.state.mode];
}
async function play(mode='normal',purchased=false) {
  if(busy)return;
  let outcome;
  try {outcome=game.spin({mode,purchased});} catch(error){$('result').textContent=error.message.toUpperCase();return;}
  busy=true;document.querySelectorAll('button,select').forEach(el=>el.disabled=true);
  reels.classList.add('spinning');$('result').textContent='PROCESSING NEIGHBORHOOD COMPLIANCE...';
  await new Promise(resolve=>setTimeout(resolve,650));
  reels.classList.remove('spinning');sync();
  const headline=outcome.paid ? `APPROVED WIN: ${money(outcome.paid)} CREDITS!` : 'NO PAYMENT AUTHORIZED. THANK YOU FOR YOUR SERVICE.';
  $('result').textContent=`${headline} ${outcome.multiplier>1?`SECURITY MULTIPLIER ${outcome.multiplier}×.`:''}`;
  busy=false;document.querySelectorAll('button,select').forEach(el=>el.disabled=false);
}
$('spin').addEventListener('click',()=>play());
$('curfew').addEventListener('click',()=>play('curfew'));
$('invasion').addEventListener('click',()=>play('invasion'));
$('hoa').addEventListener('click',()=>play('hoa',true));
$('bet').addEventListener('change',e=>{game.setBet(Number(e.target.value));sync();});
$('reset').addEventListener('click',()=>{game.reset();sync();$('result').textContent='ACCOUNT REINSTATED. YOUR FILE REMAINS OPEN.';});
sync();
