// Prototype-only play-credit mathematics. Not an audited RTP implementation.
export const ROWS = 3;
export const REELS = 5;
export const SYMBOLS = ['house', 'neighbor', 'badge', 'lawn', 'camera', 'file', 'wild', 'scatter'];
export const PAYLINES = [
  [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
  [0,0,1,0,0], [2,2,1,2,2], [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
  [2,1,1,1,2], [1,0,1,0,1], [1,2,1,2,1], [0,1,0,1,0], [2,1,2,1,2],
  [0,2,0,2,0], [2,0,2,0,2], [1,0,1,2,1], [1,2,1,0,1], [0,2,2,2,0]
];
const WEIGHTS = [['house',19],['neighbor',19],['badge',16],['lawn',16],['camera',13],['file',11],['wild',4],['scatter',2]];
const PAY = {
  house: [0,0,0.5,2,7], neighbor: [0,0,0.5,2,7], badge: [0,0,0.7,3,10],
  lawn: [0,0,0.7,3,10], camera: [0,0,1,4,15], file: [0,0,1.5,6,25],
  wild: [0,0,2,8,35]
};
export function randomSymbol(rng = Math.random) {
  const total = WEIGHTS.reduce((n, [,w]) => n + w, 0);
  let roll = rng() * total;
  for (const [symbol, weight] of WEIGHTS) { roll -= weight; if (roll < 0) return symbol; }
  return 'house';
}
export function makeGrid(rng = Math.random) {
  return Array.from({length:REELS}, () => Array.from({length:ROWS}, () => randomSymbol(rng)));
}
export function evaluate(grid, stake = 1) {
  if (!Array.isArray(grid) || grid.length !== REELS || grid.some(reel => !Array.isArray(reel) || reel.length !== ROWS || reel.some(s => !SYMBOLS.includes(s)))) throw new Error('Invalid reels');
  if (!Number.isFinite(stake) || stake <= 0) throw new Error('Invalid stake');
  const wins = [];
  for (let i = 0; i < PAYLINES.length; i++) {
    const line = PAYLINES[i].map((row, reel) => grid[reel][row]);
    // Scatter does not substitute; an all-wild prefix uses the first non-wild symbol.
    const target = line.find(symbol => symbol !== 'wild') ?? 'wild';
    if (target === 'scatter') continue;
    let count = 0;
    for (const symbol of line) {
      if (symbol === target || symbol === 'wild') count++;
      else break;
    }
    if (count >= 3) {
      const amount = Math.round(stake * PAY[target][count - 1] * 100) / 100;
      wins.push({line: i + 1, symbol:target, count, amount});
    }
  }
  const scatters = grid.flat().filter(s => s === 'scatter').length;
  const scatterWin = scatters >= 3 ? stake * ({3:2,4:10,5:40}[Math.min(scatters,5)]) : 0;
  return {wins, scatters, scatterWin, total: Math.round((wins.reduce((s,w) => s+w.amount,0) + scatterWin)*100)/100};
}
export function createGame(rng = Math.random) {
  const state = {balance:1000, bet:10, grid:makeGrid(rng), lastWin:0, totalSpins:0, mode:'normal', message:'A tidy lawn is a loyal lawn.', history:[]};
  function spin({mode = 'normal', purchased = false} = {}) {
    if (!['normal','curfew','invasion','hoa'].includes(mode)) throw new Error('Invalid mode');
    const cost = purchased ? state.bet * 40 : state.bet;
    if (state.balance < cost) throw new Error('Insufficient community credits');
    state.balance = Math.round((state.balance-cost)*100)/100;
    const grid = makeGrid(rng);
    let multiplier = 1;
    let transformations = 0;
    if (mode === 'invasion') {
      for (let col=0; col<REELS; col++) for(let row=0;row<ROWS;row++) {
        if (grid[col][row] !== 'scatter' && rng() < 0.22) {grid[col][row]='wild'; transformations++;}
      }
    }
    if (mode === 'curfew') {
      // Lock the outer reels and reroll only the three inner reels twice.
      const frozenLeft = [...grid[0]], frozenRight = [...grid[4]];
      for (let k=0;k<2;k++) for(let col=1;col<4;col++) grid[col]=Array.from({length:ROWS},()=>randomSymbol(rng));
      grid[0]=frozenLeft; grid[4]=frozenRight;
      multiplier = 2 + Math.floor(rng()*5)*2;
    }
    let violation = null;
    if (mode === 'hoa') {
      const violations = ['UNAUTHORIZED FLAMINGO','LAWN HEIGHT INFRACTION','SUSPICIOUS HAPPINESS','UNAPPROVED GARDEN GNOME'];
      violation = violations[Math.floor(rng()*violations.length)];
      multiplier = 3 + Math.floor(rng()*6);
      for (let n=0;n<4;n++) { const c=Math.floor(rng()*REELS), r=Math.floor(rng()*ROWS); if(grid[c][r]!=='scatter') grid[c][r]='wild'; }
    }
    const result = evaluate(grid,state.bet);
    const paid = Math.round(result.total*multiplier*100)/100;
    state.balance = Math.round((state.balance+paid)*100)/100;
    Object.assign(state,{grid,lastWin:paid,totalSpins:state.totalSpins+1,mode});
    state.message = violation ? `VIOLATION: ${violation}` : mode==='curfew' ? 'CURFEW ENFORCED. OUTER REELS LOCKED.' : mode==='invasion' ? `${transformations} EVIDENCE ITEMS SEIZED.` : paid>0 ? 'YOUR WINNINGS ARE UNDER REVIEW.' : 'NO VIOLATIONS TO REPORT. YET.';
    state.history.unshift({mode,paid,cost,multiplier,at:state.totalSpins});
    state.history.length=Math.min(state.history.length,8);
    return { ...result, grid, paid, cost, multiplier, violation, transformations, mode };
  }
  function setBet(amount) { if (!Number.isFinite(amount) || ![1,2,5,10,20,50].includes(amount)) throw new Error('Invalid bet'); state.bet=amount; }
  function reset() {state.balance=1000;state.lastWin=0;state.totalSpins=0;state.history=[];state.message='A fresh start. Your file remains open.';state.grid=makeGrid(rng);state.mode='normal';}
  return {state,spin,setBet,reset};
}
