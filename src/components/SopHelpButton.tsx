import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import sopContent from "@/data/sopContent";

interface SopHelpButtonProps {
  sopKey: string;
}

const SopHelpButton = ({ sopKey }: SopHelpButtonProps) => {
  const [open, setOpen] = useState(false);
  const doc = sopContent[sopKey];

  if (!doc) return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Стандартна оперативна процедура</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg">{doc.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="px-6 pb-6" style={{ maxHeight: "calc(85vh - 80px)" }}>
            <div className="space-y-5 pr-4">
              {doc.sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">
                    {section.heading}
                  </h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="text-foreground font-medium">
                          {part}
                        </strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SopHelpButton;
