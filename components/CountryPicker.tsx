"use client";
import { useMemo, useState } from "react";
import { COUNTRIES, countryByCode } from "@/lib/countries";

export default function CountryPicker({ value, onChange, className = "" }: { value: string; onChange: (code: string) => void; className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = countryByCode(value);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? COUNTRIES.filter((c) => `${c.name} ${c.code} ${c.dialCode}`.toLowerCase().includes(q)) : COUNTRIES;
    return list.slice(0, 12);
  }, [query]);
  return <div className="relative">
    <input className={className} role="combobox" aria-expanded={open} aria-controls="country-picker-list" aria-autocomplete="list" value={open ? query : selected ? `${selected.flag} ${selected.name} (${selected.dialCode})` : value} onFocus={() => { setQuery(""); setOpen(true); }} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onBlur={() => setOpen(false)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); if (e.key === "Enter" && results[0]) { e.preventDefault(); onChange(results[0].code); setOpen(false); } }} placeholder="Search 195 countries…" autoComplete="off" />
    {open && <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1 shadow-2xl" id="country-picker-list" role="listbox">
      {results.length ? results.map((c) => <button type="button" key={c.code} role="option" aria-selected={c.code === value} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(c.code); setQuery(""); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[var(--line)]">
        <span className="text-lg">{c.flag}</span><span className="min-w-0 flex-1 truncate">{c.name}</span><span className="text-xs text-[var(--mut)]">{c.code} · {c.dialCode}</span>
      </button>) : <p className="p-3 text-sm text-[var(--mut)]">No matching country.</p>}
      {results.length === 12 && <p className="px-3 py-2 text-xs text-[var(--mut)]">Keep typing to narrow the list.</p>}
    </div>}
  </div>;
}
