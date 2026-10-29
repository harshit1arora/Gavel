/**
 * RBI IRAC classification and provisioning.
 *
 * These are the numbers a lender reports to the regulator, so they are pinned
 * by tests: bucket boundaries, NPA sub-categories, and the provision floor.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateDPD,
  classifyAsset,
  getNPACategory,
  getProvisioningRate,
  calculateExpectedLoss,
} from '../src/services/compliance-engine';

describe('asset classification', () => {
  it('follows the RBI SMA boundaries', () => {
    expect(classifyAsset(0)).toBe('Standard');
    expect(classifyAsset(1)).toBe('SMA-0');
    expect(classifyAsset(30)).toBe('SMA-0');
    expect(classifyAsset(31)).toBe('SMA-1');
    expect(classifyAsset(60)).toBe('SMA-1');
    expect(classifyAsset(61)).toBe('SMA-2');
    expect(classifyAsset(90)).toBe('SMA-2');
    expect(classifyAsset(91)).toBe('NPA');
    expect(classifyAsset(365)).toBe('NPA');
  });

  it('splits NPA into substandard, doubtful and loss', () => {
    expect(getNPACategory(0)).toBe('Substandard');
    expect(getNPACategory(12)).toBe('Substandard');
    expect(getNPACategory(18)).toBe('Doubtful');
    expect(getNPACategory(30)).toBe('Loss Asset');
  });

  it('counts days past due from the last EMI date', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(calculateDPD(tenDaysAgo)).toBeGreaterThanOrEqual(9);
    expect(calculateDPD(tenDaysAgo)).toBeLessThanOrEqual(11);
    // a future date never produces a negative DPD
    expect(calculateDPD(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))).toBe(0);
  });
});

describe('provisioning rates', () => {
  it('uses the RBI minimums for NPA', () => {
    expect(getProvisioningRate('NPA', 'Substandard')).toBe(15);
    expect(getProvisioningRate('NPA', 'Doubtful', 6)).toBe(25);
    expect(getProvisioningRate('NPA', 'Doubtful', 24)).toBe(40);
    expect(getProvisioningRate('NPA', 'Doubtful', 48)).toBe(100);
    expect(getProvisioningRate('NPA', 'Loss Asset')).toBe(100);
  });

  it('holds small floors for standard and SMA buckets', () => {
    expect(getProvisioningRate('Standard')).toBe(0);
    expect(getProvisioningRate('SMA-1')).toBe(1);
    expect(getProvisioningRate('SMA-2')).toBe(5);
  });
});

describe('expected loss provisioning', () => {
  it('never provisions below the RBI floor', () => {
    const { provision } = calculateExpectedLoss(1_000_000, 'NPA', 18);
    // doubtful at 18 months: 40% floor
    expect(provision).toBeGreaterThanOrEqual(400_000);
  });

  it('provisions a loss asset at 100 percent', () => {
    const { provision } = calculateExpectedLoss(500_000, 'NPA', 40);
    expect(provision).toBe(500_000);
  });

  it('provisions SMA-2 at least at the floor', () => {
    const { provision } = calculateExpectedLoss(1_000_000, 'SMA-2');
    expect(provision).toBeGreaterThanOrEqual(50_000);
  });

  it('does not provision a standard asset', () => {
    expect(calculateExpectedLoss(1_000_000, 'Standard').provision).toBe(0);
  });
});
