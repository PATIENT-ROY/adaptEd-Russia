import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findRelatedGuides } from '../src/lib/chat-guides';

test('translation example does not suggest banking or other unrelated guides', () => {
  assert.deepEqual(findRelatedGuides('Переведи на испанский: «Сегодня я познакомился с тремя студентами». Затем объясни по-русски одно слово из перевода.'), []);
});

for (const question of [
  'Как сделать денежный перевод?', 'Как перевести деньги?', 'Как открыть счёт в банке?',
  'How do I open a bank account?', 'Comment ouvrir un compte bancaire ?',
  '¿Cómo abrir una cuenta bancaria?', 'كيف أفتح حساب بنكي؟', '银行账户怎么开？',
]) {
  test(`keeps relevant banking suggestions: ${question}`, () => {
    assert.ok(findRelatedGuides(question).some(g => g.url === '/guides/life/bank'));
  });
}

test('unrelated question has no suggestions', () => {
  assert.deepEqual(findRelatedGuides('Сколько будет два плюс два?'), []);
});

test('does not match keyword inside an unrelated word', () => {
  assert.ok(!findRelatedGuides('Мне приснился банкет').some(g => g.url === '/guides/life/bank'));
  assert.ok(!findRelatedGuides('Реши уравнение: косим траву').some(g => g.url === '/guides/life/sim-card'));
});

test('keeps specific passport guidance and limits result count', () => {
  assert.equal(findRelatedGuides('Я потерял паспорт')[0]?.url, '/guides/life/lost-passport');
  assert.ok(findRelatedGuides('банк общежитие виза метро сессия').length <= 3);
});

for (const [question, url] of [
  ['Помоги подготовиться к экзамену', '/guides/education/exam-vs-credit'],
  ['Как написать курсовую?', '/guides/education/coursework'],
  ['Как заселиться в общежитии?', '/guides/life/dorm'],
  ['Как продлить визу?', '/guides/life/migration-registration'],
  ['Как подготовиться к сессии?', '/guides/education/session'],
]) {
  test(`preserves relevant Russian inflections: ${question}`, () => {
    assert.ok(findRelatedGuides(question).some(g => g.url === url));
  });
}
