import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/states";
import { ExcelPreview } from "@/components/warehouse/ExcelPreview";
import { ExcelUploader } from "@/components/warehouse/ExcelUploader";

export const Route = createFileRoute("/warehouse/upload")({
  head: () => ({ meta: [{ title: "Excel Upload - NetworkIQ" }] }),
  component: ExcelUpload,
});

function ExcelUpload() {
  return (
    <div className="space-y-5">
      <PageHeader title="Excel Upload" description="Bulk upload inventory, validate rows, remove invalid records, and import clean data." />
      <ExcelUploader />
      <ExcelPreview />
    </div>
  );
}
