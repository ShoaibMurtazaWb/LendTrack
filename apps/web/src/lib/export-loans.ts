import type { LoanWithRelations } from "@lendtrack/shared-types";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function loansToCsv(loans: LoanWithRelations[]) {
  const headers = [
    "Item",
    "Contact",
    "Direction",
    "Status",
    "Loaned On",
    "Due Date",
    "Returned On",
    "Locked",
    "Notes",
  ];

  const rows = loans.map((loan) =>
    [
      loan.item?.name ?? "",
      loan.contact?.name ?? "",
      loan.direction === "lent_out" ? "Lent out" : "Borrowed",
      loan.status,
      loan.loaned_at,
      loan.expected_return_at,
      loan.returned_at ?? "",
      loan.is_locked ? "Yes" : "No",
      loan.notes ?? "",
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
