import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

type SnackbarType = "success" | "warning";

type SnackbarState = {
  visible: boolean;
  message: string;
  type: SnackbarType;
};

type SnackbarContextValue = {
  showSnackbar: (message: string, type: SnackbarType) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

const SNACKBAR_DURATION_MS = 2600;

type Props = { children: ReactNode };

export const SnackbarProvider = ({ children }: Props) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: "",
    type: "success",
  });

  const showSnackbar = useCallback((message: string, type: SnackbarType) => {
    setSnackbar({ visible: true, message, type });
    const t = window.setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, visible: false }));
    }, SNACKBAR_DURATION_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <div className={`app-snackbar ${snackbar.visible ? "show" : ""} ${snackbar.type}`} role="status" aria-live="polite">
        {snackbar.message}
      </div>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const ctx = useContext(SnackbarContext);
  if (ctx === undefined) throw new Error("useSnackbar must be used within SnackbarProvider");
  return ctx;
};
