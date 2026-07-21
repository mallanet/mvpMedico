"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class BookingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          No se pudo cargar el formulario de reserva. Recargá la página.
        </p>
      );
    }
    return this.props.children;
  }
}
