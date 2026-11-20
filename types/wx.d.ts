/**
 * 微信小程序宿主 API 的最小类型声明。
 * 仅用于 `tsc --noEmit` 类型检查；不参与运行时，运行环境由微信开发者工具注入。
 */

declare namespace WechatMiniprogram {
  interface Dataset {
    [key: string]: any;
  }

  interface Target {
    id: string;
    dataset: Dataset;
  }

  interface Event<D = any> {
    type: string;
    detail: D;
    currentTarget: Target;
    target: Target;
    mark?: Record<string, any>;
  }

  interface PageInstance {
    data: Record<string, any>;
    setData(patch: Record<string, any>, callback?: () => void): void;
    selectComponent(selector: string): any;
    route?: string;
  }
}

declare function Page(options: Record<string, any>): void;
declare function Component(options: Record<string, any>): void;
declare function App(options: Record<string, any>): void;
declare function getApp<T = any>(): T;
declare function getCurrentPages(): any[];

declare const wx: {
  request(options: Record<string, any>): void;
  showToast(options: Record<string, any>): void;
  showLoading(options?: Record<string, any>): void;
  hideLoading(options?: Record<string, any>): void;
  navigateTo(options: Record<string, any>): void;
  switchTab(options: Record<string, any>): void;
  stopPullDownRefresh(options?: Record<string, any>): void;
  setNavigationBarTitle(options: Record<string, any>): void;
  getStorageSync(key: string): any;
  setStorageSync(key: string, value: any): void;
  [key: string]: any;
};
