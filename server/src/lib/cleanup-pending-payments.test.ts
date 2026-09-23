import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decidePendingCleanupAction, pendingCutoff } from './cleanup-pending-payments';

describe('pending payment cleanup', () => {
  it('cancels provider pending and waiting_for_capture, never paid successes', () => {
    assert.equal(decidePendingCleanupAction(null), 'mark_canceled');
    assert.equal(decidePendingCleanupAction('pending'), 'cancel_provider');
    assert.equal(decidePendingCleanupAction('waiting_for_capture'), 'cancel_provider');
    assert.equal(decidePendingCleanupAction('canceled'), 'mark_canceled');
    assert.equal(decidePendingCleanupAction('succeeded'), 'skip_paid');
  });

  it('uses a 24h cutoff by default', () => {
    const before = Date.now() - 24 * 60 * 60 * 1000;
    const cutoff = pendingCutoff().getTime();
    assert.ok(Math.abs(cutoff - before) < 50);
  });
});
