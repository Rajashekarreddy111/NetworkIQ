import { Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWarehouseStore } from "@/store/app-store";

export function ExcelUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectUploadFile = useWarehouseStore((s) => s.selectUploadFile);
  const uploadStatus = useWarehouseStore((s) => s.uploadStatus);
  const [fileName, setFileName] = useState("networkiq-bulk-inventory-sample.csv");
  const [progress, setProgress] = useState(62);

  const chooseFile = (name: string) => {
    setFileName(name);
    setProgress(100);
    selectUploadFile(name);
  };

  const downloadSample = () => {
    const rows = [
      "SKU,Product,Stock,Warehouse,Category",
      "SKU-CE9021,Bluetooth Speaker Max,420,Mumbai,Consumer Electronics",
      "SKU-GR6712,Organic Atta 10kg,980,Mumbai,Grocery & Staples",
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "networkiq-inventory-sample.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl glass-panel p-4 sm:p-6">
      <div
        className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-border-strong bg-surface/40 p-6 text-center transition-colors hover:bg-accent/20"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files.item(0);
          if (file) chooseFile(file.name);
        }}
      >
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary-glow">
            <UploadCloud className="size-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Drop inventory file here</h2>
          <p className="mt-2 text-sm text-muted-foreground">Supported formats: .xlsx, .xls, .csv</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-4" /> {fileName}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.item(0);
              if (file) chooseFile(file.name);
            }}
          />
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button className="rounded-xl bg-gradient-primary" onClick={() => inputRef.current?.click()}>
              <UploadCloud className="mr-2 size-4" /> Upload
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={downloadSample}>
              <Download className="mr-2 size-4" /> Download Sample Excel
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Upload Status: {uploadStatus}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </section>
  );
}
