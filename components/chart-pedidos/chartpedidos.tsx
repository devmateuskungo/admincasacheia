"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { BASE_URL } from "@/lib/api"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type OrderItem = {
  createdAt?: string
  totalItens?: number
}

type OrdersResponse = {
  data?: OrderItem[]
}

const chartConfig = {
  pedidos: {
    label: "Pedidos",
    color: "#ED5379",
  },
  itens: {
    label: "Itens",
    color: "#F8668A8C",
  },
} satisfies ChartConfig

function monthLabel(date: Date): string {
  return date.toLocaleDateString("pt-PT", { month: "short" })
}

export function ChartPedidos() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setOrders([])
          return
        }

        const response = await fetch(`${BASE_URL}/orders/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          setOrders([])
          return
        }

        const result: OrdersResponse = await response.json()
        setOrders(Array.isArray(result?.data) ? result.data : [])
      } catch {
        setOrders([])
      }
    }

    fetchOrders()
  }, [])

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()])
    for (const order of orders) {
      if (!order?.createdAt) continue
      const d = new Date(order.createdAt)
      if (Number.isNaN(d.getTime())) continue
      years.add(d.getFullYear())
    }
    return Array.from(years).sort((a, b) => b - a)
  }, [orders])

  const chartData = useMemo(() => {
    const months: { month: string; pedidos: number; itens: number }[] = []
    const byMonth = new Map<number, { month: string; pedidos: number; itens: number }>()

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const d = new Date(selectedYear, monthIndex, 1)
      const monthData = { month: monthLabel(d), pedidos: 0, itens: 0 }
      months.push(monthData)
      byMonth.set(monthIndex, monthData)
    }

    for (const order of orders) {
      if (!order?.createdAt) continue
      const d = new Date(order.createdAt)
      if (Number.isNaN(d.getTime())) continue
      if (d.getFullYear() !== selectedYear) continue
      const target = byMonth.get(d.getMonth())
      if (!target) continue
      target.pedidos += 1
      target.itens += Number(order.totalItens ?? 0)
    }

    return months
  }, [orders, selectedYear])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="pedidos" fill="var(--color-pedidos)" radius={4} />
          <Bar dataKey="itens" fill="var(--color-itens)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
