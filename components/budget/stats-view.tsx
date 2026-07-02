'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { getCategory } from '@/lib/categories'
import { formatWon, lastNMonths, monthShortLabel } from '@/lib/format'
import type { ClientTransaction } from './types'

export function StatsView({
  allTransactions,
  month,
}: {
  allTransactions: ClientTransaction[]
  month: string
}) {
  const trend = useMemo(() => {
    const months = lastNMonths(month, 6)
    return months.map((m) => {
      let income = 0
      let expense = 0
      for (const t of allTransactions) {
        if (!t.date.startsWith(m)) continue
        if (t.type === 'income') income += Number(t.amount)
        else expense += Number(t.amount)
      }
      return { month: m, income, expense }
    })
  }, [allTransactions, month])

  const maxValue = useMemo(
    () => Math.max(1, ...trend.flatMap((t) => [t.income, t.expense])),
    [trend],
  )

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>()
    let total = 0
    for (const t of allTransactions) {
      if (!t.date.startsWith(month)) continue
      if (t.type !== 'expense') continue
      totals.set(t.category, (totals.get(t.category) ?? 0) + Number(t.amount))
      total += Number(t.amount)
    }
    return Array.from(totals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [allTransactions, month])

  const hasCategoryData = categoryBreakdown.length > 0
  const hasTrendData = trend.some((t) => t.income > 0 || t.expense > 0)

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          최근 6개월 수입·지출 추이
        </h3>
        {hasTrendData ? (
          <>
            <div
              className="flex items-end justify-between gap-2 px-1 pt-2"
              style={{ height: 160 }}
            >
              {trend.map((t) => (
                <div
                  key={t.month}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <div className="flex h-full items-end gap-1">
                    <div
                      className="w-3 rounded-t-sm bg-income"
                      style={{
                        height: `${(t.income / maxValue) * 100}%`,
                        minHeight: t.income > 0 ? 3 : 0,
                      }}
                    />
                    <div
                      className="w-3 rounded-t-sm bg-expense"
                      style={{
                        height: `${(t.expense / maxValue) * 100}%`,
                        minHeight: t.expense > 0 ? 3 : 0,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {monthShortLabel(t.month)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-income" />
                수입
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-expense" />
                지출
              </span>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            아직 표시할 데이터가 없어요.
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          이번 달 카테고리별 지출
        </h3>
        {hasCategoryData ? (
          <div className="flex flex-col gap-3">
            {categoryBreakdown.map((c) => {
              const cat = getCategory(c.category)
              const Icon = cat?.icon
              return (
                <div key={c.category} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      {Icon && (
                        <Icon className="size-3.5 text-muted-foreground" />
                      )}
                      {cat?.label ?? c.category}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatWon(c.amount)} · {c.percent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-expense"
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            이번 달 지출 내역이 없어요.
          </p>
        )}
      </Card>
    </div>
  )
}
