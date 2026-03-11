import { ReactNode, useState, useCallback, useRef, useEffect } from "react";
import AppSidebar from "@/components/AppSidebar";
import AiAssistant from "@/components/AiAssistant";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 260;

const AppLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div style={{ width: sidebarWidth, minWidth: sidebarWidth }} className="relative flex-shrink-0">
        <AppSidebar />
        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize z-50 hover:bg-primary/30 active:bg-primary/40 transition-colors"
        />
      </div>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <AiAssistant />
    </div>
  );
};

export default AppLayout;
