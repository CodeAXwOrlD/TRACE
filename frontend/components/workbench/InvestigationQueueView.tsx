"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { formatTimestamp } from "@/lib/utils";
import type { Investigation } from "@/lib/types";
import {
  Search,
  Filter,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export interface InvestigationQueueViewProps {
  initialInvestigations: Investigation[];
}

export function InvestigationQueueView({ initialInvestigations }: InvestigationQueueViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [patternFilter, setPatternFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [riskRangeFilter, setRiskRangeFilter] = useState("all");

  // Dynamic Real Aggregate KPIs
  const kpis = useMemo(() => {
    const total = initialInvestigations.length;
    const highRisk = initialInvestigations.filter(
      (i) => (i.risk?.riskScore ?? 0) >= 0.7 || i.risk?.verdict === "FRAUD"
    ).length;
    const awaitingEvidence = initialInvestigations.filter(
      (i) => i.risk?.verdict === "UNCERTAIN" || i.status === "open"
    ).length;
    const escalated = initialInvestigations.filter(
      (i) =>
        i.status === "escalated" ||
        (i.policy?.actions || []).some((a) => a.includes("ESCALATE"))
    ).length;
    const confirmedFraud = initialInvestigations.filter(
      (i) => i.risk?.verdict === "FRAUD" || i.status === "closed_fraud"
    ).length;

    return { total, highRisk, awaitingEvidence, escalated, confirmedFraud };
  }, [initialInvestigations]);

  // Unique filter dropdown options based on actual data
  const patterns = useMemo(() => {
    const set = new Set<string>();
    initialInvestigations.forEach((i) => {
      if (i.pattern && i.pattern !== "none") set.add(i.pattern);
    });
    return Array.from(set).sort();
  }, [initialInvestigations]);

  // Filtered rows
  const filteredInvestigations = useMemo(() => {
    return initialInvestigations.filter((item) => {
      // Search: case ID, customer ID, card ID, transaction ID
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCase = item.caseId.toLowerCase().includes(q);
        const matchCustomer = (item.customerId || "").toLowerCase().includes(q);
        const matchCard = (item.cardId || "").toLowerCase().includes(q);
        const matchTxn = (item.triggerTransactionId || "").toLowerCase().includes(q);
        if (!matchCase && !matchCustomer && !matchCard && !matchTxn) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if (item.status !== statusFilter) return false;
      }

      // Verdict filter
      if (verdictFilter !== "all") {
        const itemVerdict = (item.risk?.verdict || "PENDING").toLowerCase();
        if (itemVerdict !== verdictFilter.toLowerCase()) return false;
      }

      // Pattern filter
      if (patternFilter !== "all") {
        const p = item.pattern || "none";
        if (p !== patternFilter) return false;
      }

      // Trigger filter
      if (triggerFilter !== "all") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = ((item as any).triggerType || "risk_score").toLowerCase();
        if (!t.includes(triggerFilter.toLowerCase())) return false;
      }

      // Risk range filter
      if (riskRangeFilter !== "all") {
        const score = item.risk?.riskScore ?? 0;
        if (riskRangeFilter === "high" && score < 0.7) return false;
        if (riskRangeFilter === "medium" && (score < 0.3 || score >= 0.7)) return false;
        if (riskRangeFilter === "low" && score >= 0.3) return false;
      }

      return true;
    });
  }, [
    initialInvestigations,
    searchQuery,
    statusFilter,
    verdictFilter,
    patternFilter,
    triggerFilter,
    riskRangeFilter,
  ]);

  const formatPattern = (pattern: string | null) => {
    if (!pattern || pattern === "none") return "None / Benign";
    if (pattern === "cnp") return "Card-Not-Present (CNP)";
    if (pattern === "cnp_new_device") return "CNP New Device";
    if (pattern === "card_testing") return "Card Testing";
    if (pattern === "out_of_region" || pattern === "out_of_region_use") return "Out-of-Region";
    if (pattern === "account_takeover") return "Account Takeover";
    if (pattern === "undocumented") return "Undocumented Typology";
    return pattern.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatTrigger = (item: Investigation) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const triggerType = (item as any).triggerType;
    if (triggerType === "customer_report") return "Customer Report";
    if (triggerType === "analyst_request") return "Analyst Request";
    return "Detection Model";
  };

  const formatAction = (item: Investigation) => {
    const act = item.policy?.actions?.[0];
    if (!act) return "Monitor";
    return act
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatStatus = (status: string) => {
    if (status === "closed_fraud") return "Closed (Fraud)";
    if (status === "closed_legitimate") return "Closed (Legit)";
    if (status === "escalated") return "Escalated";
    return "Open";
  };

  const getStatusColor = (status: string) => {
    if (status === "closed_fraud") return "text-red border-red/30 bg-red/10";
    if (status === "closed_legitimate") return "text-green border-green/30 bg-green/10";
    if (status === "escalated") return "text-amber border-amber/30 bg-amber/10";
    return "text-blue border-blue/30 bg-blue/10";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] font-bold tracking-widest text-blue uppercase mb-1">
            TRACE INVESTIGATION CONSOLE
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-sans">
            Fraud Case Queue & Benchmark Registry
          </h1>
          <p className="text-xs text-muted mt-1 font-sans">
            Real-time fraud cases evaluated across TigerGraph graph traversal and multi-signal reasoning.
          </p>
        </div>
      </div>

      {/* 2. Top Aggregate Metrics (Dynamic, strictly non-mock) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-xl border border-white/[.08] bg-[#0c1017]/90 shadow-md">
          <div className="flex items-center justify-between text-muted mb-1.5">
            <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
              Open Investigations
            </span>
            <Clock size={13} className="text-blue" />
          </div>
          <div className="text-2xl font-bold font-sans text-white">{kpis.total}</div>
          <span className="text-[10px] font-mono text-muted">Benchmark cohort</span>
        </div>

        <div className="p-3.5 rounded-xl border border-red/20 bg-[#160a0c]/80 shadow-md">
          <div className="flex items-center justify-between text-red mb-1.5">
            <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
              High-Risk Cases
            </span>
            <ShieldAlert size={13} className="text-red" />
          </div>
          <div className="text-2xl font-bold font-sans text-red">{kpis.highRisk}</div>
          <span className="text-[10px] font-mono text-red/70">Risk score ≥ 0.70</span>
        </div>

        <div className="p-3.5 rounded-xl border border-amber/20 bg-[#161208]/80 shadow-md">
          <div className="flex items-center justify-between text-amber mb-1.5">
            <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
              Awaiting Evidence
            </span>
            <HelpCircle size={13} className="text-amber" />
          </div>
          <div className="text-2xl font-bold font-sans text-amber">{kpis.awaitingEvidence}</div>
          <span className="text-[10px] font-mono text-amber/70">Uncertainty state</span>
        </div>

        <div className="p-3.5 rounded-xl border border-orange/20 bg-[#170e08]/80 shadow-md">
          <div className="flex items-center justify-between text-orange mb-1.5">
            <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
              Escalated Cases
            </span>
            <AlertTriangle size={13} className="text-orange" />
          </div>
          <div className="text-2xl font-bold font-sans text-orange">{kpis.escalated}</div>
          <span className="text-[10px] font-mono text-orange/70">L1/L2 routing</span>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-[#081510]/80 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
              Confirmed Fraud
            </span>
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-sans text-emerald-400">{kpis.confirmedFraud}</div>
          <span className="text-[10px] font-mono text-emerald-400/70">Defensible verdict</span>
        </div>
      </div>

      {/* 3. Search Bar & Filter Controls */}
      <div className="p-4 rounded-xl border border-white/[.08] bg-[#0c1017]/90 shadow-lg flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by case ID, customer ID, card ID, or transaction ID…"
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/[.08] focus:border-white/30 rounded-lg font-mono text-xs text-white placeholder:text-dim outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Clear Filter */}
          {(searchQuery ||
            statusFilter !== "all" ||
            verdictFilter !== "all" ||
            patternFilter !== "all" ||
            triggerFilter !== "all" ||
            riskRangeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setVerdictFilter("all");
                setPatternFilter("all");
                setTriggerFilter("all");
                setRiskRangeFilter("all");
              }}
              className="font-mono text-[11px] text-orange hover:underline whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[.06] text-xs">
          <div className="flex items-center gap-1.5 text-muted font-mono text-[11px] mr-2">
            <Filter size={12} className="text-orange" />
            <span>Filters:</span>
          </div>

          {/* Verdict Filter */}
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#070a0f] border border-white/[.08] text-white font-mono text-[11px] outline-none"
          >
            <option value="all">Verdict: All</option>
            <option value="fraud">Fraud</option>
            <option value="uncertain">Uncertain</option>
            <option value="legitimate">Legitimate</option>
            <option value="pending">Pending</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#070a0f] border border-white/[.08] text-white font-mono text-[11px] outline-none"
          >
            <option value="all">Status: All</option>
            <option value="open">Open</option>
            <option value="escalated">Escalated</option>
            <option value="closed_fraud">Closed Fraud</option>
            <option value="closed_legitimate">Closed Legitimate</option>
          </select>

          {/* Pattern Filter */}
          <select
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#070a0f] border border-white/[.08] text-white font-mono text-[11px] outline-none"
          >
            <option value="all">Pattern: All</option>
            {patterns.map((p) => (
              <option key={p} value={p}>
                {formatPattern(p)}
              </option>
            ))}
          </select>

          {/* Trigger Filter */}
          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#070a0f] border border-white/[.08] text-white font-mono text-[11px] outline-none"
          >
            <option value="all">Trigger: All</option>
            <option value="risk_score">Detection Model</option>
            <option value="customer_report">Customer Report</option>
            <option value="analyst_request">Analyst Request</option>
          </select>

          {/* Risk Range Filter */}
          <select
            value={riskRangeFilter}
            onChange={(e) => setRiskRangeFilter(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#070a0f] border border-white/[.08] text-white font-mono text-[11px] outline-none"
          >
            <option value="all">Risk: All</option>
            <option value="high">High (≥ 0.70)</option>
            <option value="medium">Medium (0.30 - 0.69)</option>
            <option value="low">Low (&lt; 0.30)</option>
          </select>

          <span className="ml-auto font-mono text-[11px] text-muted">
            Showing <strong className="text-white">{filteredInvestigations.length}</strong> of{" "}
            {initialInvestigations.length} cases
          </span>
        </div>
      </div>

      {/* 4. Rich Investigation Table */}
      <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[.08] bg-black/40 text-[10px] font-mono font-semibold tracking-wider text-muted uppercase">
                <th className="py-3 px-4">Case</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Trigger</th>
                <th className="py-3 px-3 text-right">Risk Score</th>
                <th className="py-3 px-4">Pattern</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3 text-right">Exposure</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Next Action</th>
                <th className="py-3 px-3">Opened</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.04] text-xs font-mono">
              {filteredInvestigations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted font-sans">
                    No investigation cases match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredInvestigations.map((r) => {
                  const riskVal = r.risk?.riskScore ?? 0;
                  const riskColor =
                    riskVal >= 0.7 ? "text-red" : riskVal >= 0.3 ? "text-amber" : "text-green";

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-white/[.02] transition-colors group"
                    >
                      {/* Case ID */}
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        <Link
                          href={`/investigations/${r.id}`}
                          className="hover:text-orange flex items-center gap-1.5 transition-colors"
                        >
                          <span>{r.caseId}</span>
                        </Link>
                      </td>

                      {/* Customer ID */}
                      <td className="py-3 px-3 text-emerald-400 font-medium whitespace-nowrap">
                        {r.customerId}
                      </td>

                      {/* Trigger Type */}
                      <td className="py-3 px-3 text-[#b4bac2] whitespace-nowrap font-sans text-xs">
                        {formatTrigger(r)}
                      </td>

                      {/* Risk Score (Input) */}
                      <td className={`py-3 px-3 text-right font-bold ${riskColor} whitespace-nowrap`}>
                        {riskVal.toFixed(2)}
                      </td>

                      {/* Fraud Pattern */}
                      <td className="py-3 px-4 text-white font-sans text-xs whitespace-nowrap">
                        {formatPattern(r.pattern)}
                      </td>

                      {/* Verdict */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <RiskBadge verdict={r.risk?.verdict} />
                      </td>

                      {/* Financial Exposure */}
                      <td className="py-3 px-3 text-right text-white font-semibold whitespace-nowrap">
                        ${(r.exposureUsd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Investigation Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusColor(
                            r.status
                          )}`}
                        >
                          {formatStatus(r.status)}
                        </span>
                      </td>

                      {/* Next Best Action */}
                      <td className="py-3 px-4 text-[#dfe4e8] font-sans text-xs whitespace-nowrap">
                        {formatAction(r)}
                      </td>

                      {/* Opened Timestamp */}
                      <td className="py-3 px-3 text-muted text-[11px] whitespace-nowrap">
                        {formatTimestamp(r.createdAt)}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/investigations/${r.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/15 hover:bg-orange text-orange hover:text-white border border-orange/40 hover:border-orange text-[11px] font-mono font-semibold transition-all shadow-sm"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
