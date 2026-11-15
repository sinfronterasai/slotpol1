import {createGame} from './engine.mjs';

const game = createGame();
const $ = id => document.getElementById(id);
const labels = {house:'HOUSE',neighbor:'NEIGHBOR',badge:'HOA',lawn:'LAWN',camera:'CAMERA',file:'FILE',wild:'WILD',scatter:'SCATTER'};
const money = number => Number(number).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const reels = $('reels');
let busy=false;
function renderGrid(grid) {
  reels.replaceChildren(...grid.map((reel, index)=>{
    const column=document.createElement('div');column.className='reel';column.setAttribute('aria-label',`Reel ${index+1}`);
    for(const symbol of reel){const cell=document.createElement('div');cell.className=`symbol symbol-${symbol}`;cell.innerHTML=`<svg class="symbol-art" viewBox="0 0 100 100" aria-hidden="true"><use href="./symbols.svg#${symbol}"></use></svg><span class="symbol-name">${labels[symbol]}</span>`;column.append(cell);}
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
  sound.startSpin();
  reels.classList.add('spinning');$('result').textContent='PROCESSING NEIGHBORHOOD COMPLIANCE...';
  await new Promise(resolve=>setTimeout(resolve,650));
  reels.classList.remove('spinning');sync();
  sound.stopSpin();sound.result(outcome.paid,mode);
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
class SoundDesk {
  constructor(){this.enabled=true;this.ctx=null;this.timer=null;}
  ready(){if(!this.enabled)return null;try{this.ctx??=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();return this.ctx;}catch{return null;}}
  beep(freq=440,duration=.08,type='square',volume=.045,delay=0){const ctx=this.ready();if(!ctx)return;const t=ctx.currentTime+delay;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain).connect(ctx.destination);osc.start(t);osc.stop(t+duration+.01);}
  startSpin(){if(!this.enabled)return;let n=0;this.timer=setInterval(()=>{this.beep(110+n%3*28,.035,'triangle',.045);n++;},75);}
  stopSpin(){if(this.timer){clearInterval(this.timer);this.timer=null;}for(let i=0;i<5;i++)this.beep(180+i*32,.07,'square',.05,i*.075);}
  result(paid,mode){if(mode==='curfew'){this.beep(500,.3,'sawtooth',.05,.15);this.beep(410,.3,'sawtooth',.05,.4);}if(mode==='hoa')this.beep(120,.2,'triangle',.09,.2);if(mode==='invasion')this.beep(90,.35,'sawtooth',.06,.2);if(paid>0)for(let i=0;i<5;i++)this.beep(330*Math.pow(1.25,i),.22,'sine',.08,.55+i*.13);}
  toggle(){this.enabled=!this.enabled;if(!this.enabled)this.stopSpin();else this.beep(650,.12,'sine');return this.enabled;}
}
const sound=new SoundDesk();
$('sound').addEventListener('click',()=>{const enabled=sound.toggle();$('sound').textContent=enabled?'♫ SOUND ON':'♪ SOUND OFF';$('sound').setAttribute('aria-pressed',String(enabled));});
sync();
