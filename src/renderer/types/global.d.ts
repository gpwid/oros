import { OrosBridge } from '../../preload'

declare global {
  interface Window {
    oros?: OrosBridge;
  }
}
