import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTranslations } from '../src/lib/translations';
import { Language } from '../src/types';

const supportKeys = Object.keys(getTranslations(Language.RU)).filter(
  (key) => key.startsWith('support.'),
);
const contextKeys = [
  'guides.freshness.reportSubject',
  'schedulePage.addUniversity.subject',
  'schedulePage.addUniversity.message',
  'api.error.badRequest',
  'api.error.unauthorized',
  'api.error.tooManyRequests',
  'api.error.connection',
];

for (const language of Object.values(Language)) {
  test(`support copy and report templates exist without fallback: ${language}`, () => {
    const dictionary = getTranslations(language);
    for (const key of [...supportKeys, ...contextKeys]) {
      assert.ok(dictionary[key]?.trim(), `${language}: missing ${key}`);
      if (language !== Language.RU) {
        assert.doesNotMatch(dictionary[key], /[А-Яа-яЁё]/, `${language}: Russian copy in ${key}`);
      }
    }
    assert.ok(dictionary['support.form.guideReport.subject'].includes('{guide}'));
  });
}
