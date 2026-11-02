import { describe, expect, it } from 'vitest'
import {
  duePayments,
  formatBirrWhole,
  isActiveBeneficiary,
  monthlyTotals,
  recentMonths,
  shiftMonth,
  shortMonthLabel,
  summarize,
} from '@/lib/ministries/workers-aid'
import { supportCaseStatusLabel } from '@/lib/ministries/deacons'
import {
  deaconCareVisitCreate,
  deaconCareVisitUpdate,
  deaconSupportCaseCreate,
  workersAidBeneficiaryCreate,
  workersAidDisbursementCreate,
  workersAidMonthlyRun,
} from '@/lib/api/schemas'

const ID = '11111111-1111-4111-8111-111111111111'
const b = (id: string, monthly_amount: number, start_date = '2026-01-01', status: string | null = 'active') => ({ id, monthly_amount, start_date, status })

describe('workers aid months', () => {
  it('shifts months across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
    expect(shiftMonth('2026-10', -14)).toBe('2025-08')
    expect(recentMonths('2026-02', 3)).toEqual(['2026-02', '2026-01', '2025-12'])
  })

  it('totals payments per month exactly, in cents', () => {
    const rows = [
      { disbursement_date: '2026-10-01', amount: 0.1 },
      { disbursement_date: '2026-10-31', amount: '0.2' },
      { disbursement_date: '2026-09-15', amount: 1500 },
      { disbursement_date: '2026-07-15', amount: 999 }, // outside the months asked for
    ]
    expect(monthlyTotals(rows, ['2026-10', '2026-09', '2026-08'])).toEqual([
      { month: '2026-10', total: 0.3, payments: 2 },
      { month: '2026-09', total: 1500, payments: 1 },
      { month: '2026-08', total: 0, payments: 0 },
    ])
  })

  it('finds active, started, unpaid beneficiaries for a month', () => {
    const people = [b('a', 100), b('b', 200), b('c', 300, '2026-11-01'), b('d', 400, '2026-01-01', 'inactive'), b('e', 500, '2026-10-31', null)]
    expect(duePayments(people, [{ beneficiary_id: 'b' }], '2026-10').map((p) => p.id)).toEqual(['a', 'e'])
    expect(isActiveBeneficiary({ status: null })).toBe(true)
    expect(isActiveBeneficiary({ status: 'inactive' })).toBe(false)
  })

  it('summarizes commitment, due and recent months', () => {
    const people = [b('a', 1000), b('b', 250.5), b('d', 400, '2026-01-01', 'inactive')]
    const paid = [
      { beneficiary_id: 'a', disbursement_date: '2026-10-05', amount: 1000 },
      { beneficiary_id: 'a', disbursement_date: '2026-09-05', amount: 1000 },
      { beneficiary_id: 'b', disbursement_date: '2026-09-05', amount: 250.5 },
    ]
    const s = summarize('2026-10', people, paid)
    expect(s.months).toEqual([
      { month: '2026-10', total: 1000, payments: 1 },
      { month: '2026-09', total: 1250.5, payments: 2 },
      { month: '2026-08', total: 0, payments: 0 },
    ])
    expect(s.commitment).toEqual({ total: 1250.5, beneficiaries: 2 })
    expect(s.due).toEqual({ total: 250.5, beneficiaries: 1 })
  })

  it('formats figures for the cards', () => {
    expect(formatBirrWhole(12345.6)).toMatch(/12,346/)
    expect(formatBirrWhole(12345.6)).not.toMatch(/\./)
    expect(shortMonthLabel('2026-09')).toBe('Sep 2026')
  })
})

describe('deacons and workers aid schemas', () => {
  it('never takes the visitor from the body and keeps the member on edit', () => {
    expect(deaconCareVisitCreate.safeParse({ member_id: ID, visit_date: '2026-10-01' }).success).toBe(true)
    expect(deaconCareVisitCreate.safeParse({ member_id: ID, visit_date: '2026-10-01', visitor_id: ID }).success).toBe(false)
    expect(deaconCareVisitUpdate.safeParse({ member_id: ID }).success).toBe(false)
  })

  it('accepts the support case statuses only', () => {
    const base = { member_id: ID, description: 'Rent help' }
    expect(deaconSupportCaseCreate.safeParse({ ...base, status: 'in_progress', assigned_deacon_id: '' }).success).toBe(true)
    expect(deaconSupportCaseCreate.safeParse({ ...base, status: 'pending' }).success).toBe(false)
    expect(deaconSupportCaseCreate.safeParse({ member_id: ID, description: '  ' }).success).toBe(false)
    expect(supportCaseStatusLabel('in_progress')).toBe('In progress')
    expect(supportCaseStatusLabel(null)).toBe('Open')
  })

  it('wants positive amounts and real dates', () => {
    expect(workersAidBeneficiaryCreate.safeParse({ member_id: ID, monthly_amount: 1500 }).success).toBe(true)
    expect(workersAidBeneficiaryCreate.safeParse({ member_id: ID, monthly_amount: 0 }).success).toBe(false)
    expect(workersAidBeneficiaryCreate.safeParse({ member_id: ID, monthly_amount: 10, status: 'paused' }).success).toBe(false)
    expect(workersAidDisbursementCreate.safeParse({ beneficiary_id: ID, disbursement_date: '2026-10-01', amount: -5 }).success).toBe(false)
    expect(workersAidMonthlyRun.safeParse({ disbursement_date: '2026-10-01' }).success).toBe(true)
    expect(workersAidMonthlyRun.safeParse({ disbursement_date: '2026-10-01', amount: 1 }).success).toBe(false)
  })
})
