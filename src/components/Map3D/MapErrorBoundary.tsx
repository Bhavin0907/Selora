import { Component, type ErrorInfo, type ReactNode } from 'react'

interface MapErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface MapErrorBoundaryState {
  hasError: boolean
}

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Selora Map] 3D scene failed to load:', error)
    console.error('[Selora Map] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
