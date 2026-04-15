import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Ruler } from "lucide-react";

const SIZE_CHART = [
  { size: "S", chest: "36", length: "27", shoulder: "16" },
  { size: "M", chest: "38", length: "28", shoulder: "17" },
  { size: "L", chest: "40", length: "29", shoulder: "18" },
  { size: "XL", chest: "42", length: "30", shoulder: "19" },
  { size: "XXL", chest: "44", length: "31", shoulder: "20" },
];

const SizeGuideDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          <Ruler className="h-3 w-3" /> Size Guide
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Size Guide (inches)</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold">Size</th>
                <th className="text-center py-2 px-3 font-semibold">Chest</th>
                <th className="text-center py-2 px-3 font-semibold">Length</th>
                <th className="text-center py-2 px-3 font-semibold">Shoulder</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((row) => (
                <tr key={row.size} className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium">{row.size}</td>
                  <td className="py-2 px-3 text-center text-muted-foreground">{row.chest}"</td>
                  <td className="py-2 px-3 text-center text-muted-foreground">{row.length}"</td>
                  <td className="py-2 px-3 text-center text-muted-foreground">{row.shoulder}"</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Measurements may vary ±0.5 inches. For the best fit, measure your body and compare with the chart above.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default SizeGuideDialog;
