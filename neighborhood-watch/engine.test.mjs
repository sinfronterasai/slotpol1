import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, evaluate, PAYLINES, makeGrid} from './engine.mjs';

test('20 paylines and 5x3 reels',()=>{assert.equal(PAYLINES.length,20);assert.equal(makeGrid(()=>0).length,5);});
test('empty paying screen returns zero',()=>{
  const grid = [['house','house','house'],['neighbor','neighbor','neighbor'],['badge','badge','badge'],['lawn','lawn','lawn'],['camera','camera','camera']];
  assert.equal(evaluate(grid,10).total,0);
});
test('all wilds pay all lines',()=>{
  const grid = Array.from({length:5},()=>['wild','wild','wild']);
  assert.equal(evaluate(grid,10).total,7000);
});
test('balance updates and debits each spin',()=>{
  const game=createGame(()=>0); const before=game.state.balance;const result=game.spin();
  assert.equal(game.state.balance,Math.round((before-10+result.paid)*100)/100);
  assert.equal(game.state.totalSpins,1);
});
test('features spend correct play credits and preserve bounds',()=>{
  const g=createGame(()=>0.5); g.setBet(1);
  for (const mode of ['curfew','invasion','hoa']) {
    const result=g.spin({mode,purchased:mode==='hoa'});
    assert.ok(result.multiplier>=1);
    assert.equal(result.cost,mode==='hoa'?40:1);
    assert.equal(result.grid.length,5);
  }
});
test('rejects purchases when credits are insufficient',()=>{
  const g=createGame(()=>0);g.setBet(50);
  assert.throws(()=>g.spin({mode:'hoa',purchased:true}),/Insufficient/);
});
test('reset clears the session',()=>{
  const g=createGame(()=>0.5);g.spin();g.reset();assert.equal(g.state.balance,1000);assert.equal(g.state.totalSpins,0);
});
