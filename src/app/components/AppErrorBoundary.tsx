import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/app/components/ui/button";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches render errors so a single bad chart or data edge case cannot white-screen the whole app.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || "Something went wrong" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[FinEra] UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-bold text-foreground">We hit a snag loading this screen</p>
          <p className="text-sm text-muted-foreground max-w-md">{this.state.message}</p>
          <Button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: "" });
              this.props.onReset?.();
            }}
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
