import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Guide } from '../src/types';
import { lifeGuides } from '../src/data/life-guides';
import { arrivalStepGuide } from '../src/lib/life-guide-arrival';

test('housing goes directly to its only published guide', () => {
  assert.equal(arrivalStepGuide({ categoryId: 'housing' }, lifeGuides)?.id, '1');
});

test('documents retain the category because several guides are published', () => {
  assert.equal(arrivalStepGuide({ categoryId: 'documents' }, lifeGuides), undefined);
});

test('housing retains choice if the second guide becomes published', () => {
  const guides = lifeGuides.map(guide => guide.id === '6' ? { ...guide, isPublished: true } : guide);
  assert.equal(arrivalStepGuide({ categoryId: 'housing' }, guides), undefined);
});

test('empty and unknown categories do not navigate to an arbitrary guide', () => {
  assert.equal(arrivalStepGuide({ categoryId: 'housing' }, []), undefined);
  assert.equal(arrivalStepGuide({ categoryId: 'unknown' }, lifeGuides), undefined);
});

test('explicit published guides keep their destination and drafts stay hidden', () => {
  assert.equal(arrivalStepGuide({ guideId: 'migration-card' }, lifeGuides)?.id, 'migration-card');
  assert.equal(arrivalStepGuide({ guideId: '6' }, lifeGuides), undefined);
  assert.equal(arrivalStepGuide({}, [] as Guide[]), undefined);
});
