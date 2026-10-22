import assert from 'node:assert/strict';
import { test } from 'node:test';
import { educationGuides } from '../src/data/education-guides';
import { lifeGuides } from '../src/data/life-guides';
import { guideMatchesQuery, guideSearchRank, searchGuides, guideInLifeCategory } from '../src/lib/guide-search';

const ids = (query: string) => searchGuides(lifeGuides, query).map(g => g.id);
test('normalization, complete query and abbreviation boundaries', () => {
  assert.deepEqual(ids('учет'), ids('  УЧЁТ  '));
  assert.equal(searchGuides(educationGuides, 'Подготовительный факультет')[0].id, 'prep-faculty');
  const unrelated = { ...educationGuides[0], title: 'Факультет', tags: [], content: 'Русский язык' };
  assert.equal(guideMatchesQuery(unrelated, 'Подготовительный факультет'), false);
  assert.deepEqual(ids('ГОСТ'), []);
  assert.ok(searchGuides(educationGuides, 'ГОСТ').some(g => g.id === '2'));
  assert.ok(ids('миграц').includes('7'));
  assert.ok(ids('insurance').includes('insurance-dms'));
  assert.deepEqual(ids('несуществующийзапрос'), []);
});
test('ranking: exact title, title, tags, content; all terms required across fields', () => {
  const base = { ...lifeGuides[0], title: '', tags: [], content: '' };
  const examples = [
    { ...base, title: 'Учёт' },
    { ...base, title: 'Миграционный учёт' },
    { ...base, tags: ['учёт'] },
    { ...base, content: 'учёт' },
  ];
  assert.deepEqual(examples.map(g => guideSearchRank(g, 'учет')), [0, 1, 2, 3]);
  assert.equal(guideSearchRank({ ...base, title: 'миграционный', tags: ['учет'] }, 'миграционный учет'), 2);
  assert.equal(guideMatchesQuery({ ...base, title: 'учет' }, 'учет паспорт'), false);
  assert.equal(guideMatchesQuery(base, '   '), true);
});
test('every published guide has explicit valid categories and appears in their union', () => {
  for (const [guides, categories] of [
    [lifeGuides, ['documents','housing','transport','health','services']],
    [educationGuides, ['exams','papers','documents','structure','admission','expulsion-risks']],
  ] as const) {
    for (const guide of guides.filter(g => g.isPublished)) {
      assert.ok(guide.filterCategories?.length, guide.id);
      assert.ok(guide.filterCategories.every(cat => (categories as readonly string[]).includes(cat)), guide.id);
      assert.ok(categories.some(cat => guideInLifeCategory(guide, cat)), guide.id);
    }
    for (const category of categories) assert.ok(guides.some(g => g.isPublished && guideInLifeCategory(g, category)), category);
  }
  for (const id of ['visa-vs-visa-free','study-visa-extend','migration-rereg','biometrics-medexam','ru-id','police-safety','gosuslugi-foreign-student']) {
    assert.ok(guideInLifeCategory(lifeGuides.find(g => g.id === id)!, 'documents'));
  }
});

test('categories intersect search without changing independently searched other section', () => {
  for (const guides of [lifeGuides, educationGuides]) {
    for (const query of ['документы', 'учёт', 'Подготовительный факультет', 'ГОСТ', 'несуществующийзапрос']) {
      const matches = searchGuides(guides, query);
      for (const category of new Set(guides.flatMap(g => g.filterCategories ?? []))) {
        const filtered = matches.filter(g => guideInLifeCategory(g, category));
        assert.ok(filtered.every(g => g.isPublished && guideMatchesQuery(g, query)));
        assert.deepEqual(matches.filter(g => guideInLifeCategory(g, 'all')), matches);
      }
    }
  }
  const hidden = searchGuides(educationGuides, 'Подготовительный факультет');
  assert.ok(hidden.length > 0);
  assert.equal(hidden.filter(g => guideInLifeCategory(g, 'exams')).length, 0);
  assert.deepEqual(searchGuides(lifeGuides, 'ГОСТ'), []);
  assert.ok(searchGuides(educationGuides, 'ГОСТ').length > 0);
  assert.equal(searchGuides([{ ...lifeGuides[0], isPublished: false }], '').length, 0);
});
